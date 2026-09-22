import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserOrmEntity } from '../../infrastructure/database/user.entity.orm';
import { RoleOrmEntity } from '../../infrastructure/database/role.entity.orm';
import { InvestigatorProfileOrmEntity } from '../../infrastructure/database/investigator-profile.entity.orm';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { RoleAssignmentItemDto } from '../dtos/assign-user-roles.dto';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { AUDIT_MESSAGES } from '../../../../shared/constants/audit-messages.constant';
import { SegregationOfDutiesDomainService } from '../../domain/services/segregation-of-duties.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly dataSource: DataSource,
    private readonly emailService: IEmailServicePort,
  ) {}

  async createUser(dto: CreateUserDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('El correo electrónico ya está registrado');
    }

    let hashedPassword = '';
    let otp = '';
    let hashedOtp = '';

    if (dto.password) {
      // Flujo normal: creación con contraseña directa
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(dto.password, salt);
    } else {
      // Flujo de Invitación: se genera OTP
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      hashedOtp = await bcrypt.hash(otp, 10);
    }

    const user = this.dataSource.getRepository(UserOrmEntity).create({
      nationalId: dto.nationalId,
      fullName: dto.fullName,
      institutionalEmail: dto.email,
      passwordHash: hashedPassword,
      isActive: dto.password ? (dto.isActive ?? true) : false,
      isEmailVerified: dto.password ? (dto.isEmailVerified ?? true) : false,
      confirmationTokenHash: hashedOtp || null,
    });

    const savedUser = await this.dataSource
      .getRepository(UserOrmEntity)
      .save(user);

    if (dto.roles && dto.roles.length > 0) {
      await this.updateUserRoles(savedUser.id, dto.roles);
    }

    // Si es flujo de invitación (sin contraseña previa), enviar correo con el enlace y OTP
    if (!dto.password && otp) {
      try {
        await this.emailService.sendAccountInvitation(
          savedUser.institutionalEmail,
          otp,
          savedUser.fullName,
        );
      } catch (emailErr) {
        console.error(
          `[UsersService] Error al enviar correo de invitación a ${savedUser.institutionalEmail}:`,
          emailErr,
        );
      }
    }

    const result = { ...savedUser } as Record<string, unknown>;
    delete result.passwordHash;
    delete result.refreshTokenHash;
    delete result.confirmationTokenHash;
    return result;
  }

  async findAllUsers() {
    const users = await this.userRepository.findAll();
    const userIds = users.map((u) => u.id);

    let roleMetadataRaw: {
      usuario_id: number;
      rol_id: number;
      code: string;
      name: string;
      valid_from: Date | null;
      valid_until: Date | null;
      reason: string | null;
      is_expired: boolean;
    }[] = [];

    if (userIds.length > 0) {
      roleMetadataRaw = await this.dataSource.query(
        `
        SELECT ur.usuario_id, ur.rol_id, r.codigo as code, r.nombre as name,
               ur.fecha_inicio as valid_from, ur.fecha_fin as valid_until,
               ur.motivo_delegacion as reason,
               (CASE WHEN ur.fecha_fin IS NOT NULL AND ur.fecha_fin < NOW() THEN true ELSE false END) as is_expired
        FROM catalogos.usuarios_roles ur
        JOIN catalogos.roles r ON ur.rol_id = r.id
        WHERE ur.usuario_id = ANY($1)
          AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
      `,
        [userIds],
      );
    }

    return users.map((user) => {
      const result = { ...user } as Record<string, unknown>;
      delete result.passwordHash;
      delete result.refreshTokenHash;
      delete result.confirmationTokenHash;
      delete result.resetPasswordTokenHash;

      const userRoles = roleMetadataRaw.filter(
        (rm) => rm.usuario_id === user.id,
      );

      return {
        ...result,
        roles: userRoles.map((r) => ({
          id: r.rol_id,
          code: r.code,
          name: r.name,
          validFrom: r.valid_from,
          validUntil: r.valid_until,
          reason: r.reason,
          isExpired: r.is_expired,
        })),
      };
    });
  }

  async findById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const roleMetadataRaw: {
      usuario_id: number;
      rol_id: number;
      code: string;
      name: string;
      valid_from: Date | null;
      valid_until: Date | null;
      reason: string | null;
      is_expired: boolean;
    }[] = await this.dataSource.query(
      `
      SELECT ur.usuario_id, ur.rol_id, r.codigo as code, r.nombre as name,
             ur.fecha_inicio as valid_from, ur.fecha_fin as valid_until,
             ur.motivo_delegacion as reason,
             (CASE WHEN ur.fecha_fin IS NOT NULL AND ur.fecha_fin < NOW() THEN true ELSE false END) as is_expired
      FROM catalogos.usuarios_roles ur
      JOIN catalogos.roles r ON ur.rol_id = r.id
      WHERE ur.usuario_id = $1
        AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
    `,
      [id],
    );

    const result = { ...user } as Record<string, unknown>;
    delete result.passwordHash;
    delete result.refreshTokenHash;
    delete result.confirmationTokenHash;
    delete result.resetPasswordTokenHash;

    const userRoles = roleMetadataRaw.map((r) => ({
      id: r.rol_id,
      code: r.code,
      name: r.name,
      validFrom: r.valid_from,
      validUntil: r.valid_until,
      reason: r.reason,
      isExpired: r.is_expired,
    }));

    return {
      ...result,
      roles: userRoles,
    };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updatePayload: Partial<UserOrmEntity> = {};

    if (dto.email && dto.email !== user.institutionalEmail) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) {
        throw new BadRequestException(
          'El nuevo correo electrónico ya está registrado',
        );
      }
      updatePayload.institutionalEmail = dto.email;
    }

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    if (dto.fullName) updatePayload.fullName = dto.fullName;
    if (dto.nationalId) updatePayload.nationalId = dto.nationalId;
    if (dto.isActive !== undefined) updatePayload.isActive = dto.isActive;
    if (dto.isEmailVerified !== undefined)
      updatePayload.isEmailVerified = dto.isEmailVerified;

    if (Object.keys(updatePayload).length > 0) {
      await this.userRepository.update(id, updatePayload);
    }

    if (dto.roles && Array.isArray(dto.roles)) {
      await this.updateUserRoles(id, dto.roles);
    }

    if (user.investigatorProfile) {
      if (dto.phone !== undefined) user.investigatorProfile.phone = dto.phone;
      if (dto.nationality !== undefined)
        user.investigatorProfile.nationality = dto.nationality;
      if (dto.position !== undefined)
        user.investigatorProfile.position = dto.position;
      if (dto.institution !== undefined)
        user.investigatorProfile.institution = dto.institution;
      if (dto.senescytRegistration !== undefined)
        user.investigatorProfile.senescytRegistration =
          dto.senescytRegistration;

      await this.dataSource
        .getRepository(InvestigatorProfileOrmEntity)
        .save(user.investigatorProfile);
    }

    return this.findById(id);
  }

  async updateUserRoles(
    userId: number,
    roleInput: (string | RoleAssignmentItemDto)[],
    assignedByUserId?: number,
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const normalizedItems: RoleAssignmentItemDto[] = roleInput.map((item) => {
      if (typeof item === 'string') {
        return { roleCode: item.toUpperCase() };
      }
      return {
        ...item,
        roleCode: item.roleCode.toUpperCase(),
      };
    });

    const roleCodes = normalizedItems.map((item) => item.roleCode);

    const segregationService = new SegregationOfDutiesDomainService();
    segregationService.validateRoleAssignments(roleCodes);

    const upperRoleCodes = roleCodes.map((c) => c.toUpperCase());
    const allRoles = await this.dataSource.getRepository(RoleOrmEntity).find();
    const roles = allRoles.filter(
      (r) =>
        (r.code && upperRoleCodes.includes(r.code.toUpperCase())) ||
        (r.name && upperRoleCodes.includes(r.name.toUpperCase())),
    );

    if (normalizedItems.length > 0 && roles.length === 0) {
      throw new BadRequestException('Roles no válidos');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newRoleIds = roles.map((r) => r.id);

      if (newRoleIds.length > 0) {
        await queryRunner.manager.query(
          `UPDATE catalogos.usuarios_roles
           SET fecha_fin = NOW(),
               motivo_delegacion = COALESCE(motivo_delegacion, '[REVOCADO] Rol retirado')
           WHERE usuario_id = $1 AND (fecha_fin IS NULL OR fecha_fin > NOW()) AND rol_id NOT IN (${newRoleIds.join(',')})`,
          [userId],
        );
      } else {
        await queryRunner.manager.query(
          `UPDATE catalogos.usuarios_roles
           SET fecha_fin = NOW(),
               motivo_delegacion = COALESCE(motivo_delegacion, '[REVOCADO] Rol retirado')
           WHERE usuario_id = $1 AND (fecha_fin IS NULL OR fecha_fin > NOW())`,
          [userId],
        );
      }

      for (const item of normalizedItems) {
        const roleEntity = roles.find(
          (r) =>
            (r.code && r.code.toUpperCase() === item.roleCode.toUpperCase()) ||
            (r.name && r.name.toUpperCase() === item.roleCode.toUpperCase()),
        );

        if (roleEntity) {
          const validFrom = item.validFrom
            ? new Date(item.validFrom)
            : new Date();
          const validUntil = item.validUntil ? new Date(item.validUntil) : null;
          const reason = item.reason || null;

          const existing = await queryRunner.manager.query(
            `SELECT usuario_id FROM catalogos.usuarios_roles WHERE usuario_id = $1 AND rol_id = $2`,
            [userId, roleEntity.id],
          );

          if (existing.length > 0) {
            await queryRunner.manager.query(
              `UPDATE catalogos.usuarios_roles
               SET fecha_inicio = $1, fecha_fin = $2, motivo_delegacion = $3, asignado_por = $4
               WHERE usuario_id = $5 AND rol_id = $6`,
              [
                validFrom,
                validUntil,
                reason,
                assignedByUserId || null,
                userId,
                roleEntity.id,
              ],
            );
          } else {
            await queryRunner.manager.query(
              `INSERT INTO catalogos.usuarios_roles (usuario_id, rol_id, fecha_inicio, fecha_fin, motivo_delegacion, asignado_por)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                userId,
                roleEntity.id,
                validFrom,
                validUntil,
                reason,
                assignedByUserId || null,
              ],
            );
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return {
      message: 'Roles actualizados exitosamente con vigencia temporal',
      roles: normalizedItems,
    };
  }

  async suspendTemporaryRole(
    userId: number,
    roleCode: string,
    reason?: string,
  ) {
    const allRoles = await this.dataSource.getRepository(RoleOrmEntity).find();
    const role = allRoles.find(
      (r) =>
        (r.code && r.code.toUpperCase() === roleCode.toUpperCase()) ||
        (r.name && r.name.toUpperCase() === roleCode.toUpperCase()),
    );

    if (!role) {
      throw new NotFoundException(`El rol ${roleCode} no fue encontrado`);
    }

    const motif = `${AUDIT_MESSAGES.SUSPENSION_TEMPORAL_PREFIX} ${reason || AUDIT_MESSAGES.DEFAULT_REVOCATION_REASON}`;
    const result = await this.dataSource.query(
      `UPDATE catalogos.usuarios_roles 
       SET fecha_fin = NOW(), motivo_delegacion = $1
       WHERE usuario_id = $2 AND rol_id = $3
       RETURNING usuario_id, rol_id, fecha_inicio, fecha_fin, motivo_delegacion`,
      [motif, userId, role.id],
    );

    if (result[0].length === 0) {
      throw new NotFoundException(
        `El usuario no posee asignado el rol ${roleCode}`,
      );
    }

    return {
      message: `El rol temporal ${role.name} ha sido suspendido exitosamente`,
      userId,
      roleCode: role.code,
      suspendedAt: new Date(),
      assignment: result[0][0],
    };
  }

  async extendTemporaryRole(
    userId: number,
    roleCode: string,
    newValidUntil: Date,
    reason?: string,
  ) {
    const allRoles = await this.dataSource.getRepository(RoleOrmEntity).find();
    const role = allRoles.find(
      (r) =>
        (r.code && r.code.toUpperCase() === roleCode.toUpperCase()) ||
        (r.name && r.name.toUpperCase() === roleCode.toUpperCase()),
    );

    if (!role) {
      throw new NotFoundException(`El rol ${roleCode} no fue encontrado`);
    }

    const motif = reason ? `[PRÓRROGA] ${reason}` : undefined;
    const result = await this.dataSource.query(
      `UPDATE catalogos.usuarios_roles 
       SET fecha_fin = $1, motivo_delegacion = COALESCE($2, motivo_delegacion)
       WHERE usuario_id = $3 AND rol_id = $4
       RETURNING usuario_id, rol_id, fecha_inicio, fecha_fin, motivo_delegacion`,
      [newValidUntil, motif || null, userId, role.id],
    );

    if (result[0].length === 0) {
      throw new NotFoundException(
        `El usuario no posee asignado el rol ${roleCode}`,
      );
    }

    return {
      message: `La vigencia del rol temporal ${role.name} ha sido extendida exitosamente`,
      userId,
      roleCode: role.code,
      newValidUntil,
      assignment: result[0][0],
    };
  }

  async getRoles() {
    return this.dataSource.getRepository(RoleOrmEntity).find({
      where: { isActive: true },
    });
  }
}

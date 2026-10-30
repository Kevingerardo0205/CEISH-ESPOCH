import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
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
import {
  SegregationOfDutiesDomainService,
  DatePeriod,
  SecretariaAssignment,
} from '../../domain/services/segregation-of-duties.service';
import { RoleCode } from '../../domain/enums/role.enum';

@Injectable()
export class UsersService {
  private readonly segregationService = new SegregationOfDutiesDomainService();

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let savedUser: UserOrmEntity;
    let otp = '';

    try {
      if (dto.nationalId) {
        const repo = this.dataSource.getRepository(UserOrmEntity);
        const existingNationalId = queryRunner.manager?.findOne
          ? await queryRunner.manager.findOne(UserOrmEntity, {
              where: { nationalId: dto.nationalId },
            })
          : typeof repo?.findOne === 'function'
            ? await repo.findOne({ where: { nationalId: dto.nationalId } })
            : null;
        if (existingNationalId) {
          throw new BadRequestException('Esta cédula ya está registrada');
        }
      }

      let hashedPassword = '';
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

      const savedResult = await queryRunner.manager.save(UserOrmEntity, user);
      savedUser = { ...user, ...savedResult };

      if (dto.roles && dto.roles.length > 0) {
        await this.updateUserRoles(
          savedUser.id,
          dto.roles,
          undefined,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
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
    if (dto.nationalId && dto.nationalId !== user.nationalId) {
      const repo = this.dataSource.getRepository(UserOrmEntity);
      const existingNatId =
        typeof repo?.findOne === 'function'
          ? await repo.findOne({
              where: { nationalId: dto.nationalId },
            })
          : null;
      if (existingNatId) {
        throw new BadRequestException('Esta cédula ya está registrada');
      }
      updatePayload.nationalId = dto.nationalId;
    }
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
    existingQueryRunner?: QueryRunner,
  ) {
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
    const upperRoleCodes = roleCodes.map((c) => c.toUpperCase());

    const isExternalRunner = !!existingQueryRunner;
    const queryRunner =
      existingQueryRunner || this.dataSource.createQueryRunner();

    if (!isExternalRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
      const user = queryRunner.manager.findOne
        ? await queryRunner.manager.findOne(UserOrmEntity, {
            where: { id: userId },
          })
        : await this.userRepository.findById(userId);

      if (!user) throw new NotFoundException('Usuario no encontrado');

      // Bloqueo pesimista si se solicita SECRETARIA para evitar carreras concurrentes
      if (upperRoleCodes.includes(RoleCode.SECRETARIA)) {
        await queryRunner.manager.query(
          `SELECT id FROM catalogos.roles WHERE codigo = 'SECRETARIA' FOR UPDATE`,
        );
      }

      // Obtener roles solicitados desde la BD
      const allRoles = await this.dataSource
        .getRepository(RoleOrmEntity)
        .find();
      const roles = allRoles.filter(
        (r) =>
          (r.code && upperRoleCodes.includes(r.code.toUpperCase())) ||
          (r.name && upperRoleCodes.includes(r.name.toUpperCase())),
      );

      if (normalizedItems.length > 0 && roles.length === 0) {
        throw new BadRequestException('Roles no válidos');
      }

      // 1. Obtener roles actuales vigentes del usuario
      const currentRolesRaw: { codigo: string }[] =
        await queryRunner.manager.query(
          `SELECT r.codigo
         FROM catalogos.usuarios_roles ur
         JOIN catalogos.roles r ON ur.rol_id = r.id
         WHERE ur.usuario_id = $1
           AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
           AND r.activo = true
           AND r.eliminado_en IS NULL`,
          [userId],
        );
      const currentActiveRoles = currentRolesRaw.map((r) => r.codigo);

      // 2. Si tiene INVESTIGADOR y pide comité, contar protocolos en curso
      let activeProtocolsCount = 0;
      const currentHasInvestigator = currentActiveRoles.includes(
        RoleCode.INVESTIGADOR,
      );
      const requestedHasCommittee = upperRoleCodes.some((rc) =>
        [RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.EVALUADOR].includes(
          rc as RoleCode,
        ),
      );

      if (currentHasInvestigator && requestedHasCommittee) {
        const protocolCountResult = await queryRunner.manager.query<
          Array<{ count: string }>
        >(
          `SELECT COUNT(DISTINCT p.id) AS count
           FROM public.protocolos p
           LEFT JOIN public.protocolo_investigadores pi ON pi.protocolo_id = p.id AND pi.eliminado_en IS NULL
           LEFT JOIN catalogos.estados e ON e.id = p.estado_id
           WHERE (p.investigador_principal_id = $1 OR pi.usuario_id = $1)
             AND p.eliminado_en IS NULL
             AND (e.codigo IS NULL OR e.codigo NOT IN ('RECHAZADO', 'ARCHIVADO_VENCIMIENTO'))`,
          [userId],
        );
        activeProtocolsCount = parseInt(
          protocolCountResult[0]?.count ?? '0',
          10,
        );
      }

      // 3. Validar segregación de funciones
      this.segregationService.validateRoleChange({
        currentActiveRoles,
        requestedRoles: roleCodes,
        activeProtocolsAsInvestigator: activeProtocolsCount,
      });

      // 4. Si se solicita SECRETARIA, validar que no haya otra titular vigente en el período
      if (upperRoleCodes.includes(RoleCode.SECRETARIA)) {
        const secItem = normalizedItems.find(
          (i) => (i.roleCode.toUpperCase() as RoleCode) === RoleCode.SECRETARIA,
        );
        const requestedPeriod: DatePeriod = {
          validFrom: secItem?.validFrom,
          validUntil: secItem?.validUntil,
        };

        const otherSecretariaRows: {
          usuario_id: number;
          valid_from: Date | null;
          valid_until: Date | null;
        }[] = await queryRunner.manager.query(
          `SELECT ur.usuario_id, ur.fecha_inicio as valid_from, ur.fecha_fin as valid_until
           FROM catalogos.usuarios_roles ur
           JOIN catalogos.roles r ON ur.rol_id = r.id
           WHERE r.codigo = 'SECRETARIA'
             AND ur.usuario_id != $1
             AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())`,
          [userId],
        );

        const otherSecretariaAssignments: SecretariaAssignment[] =
          otherSecretariaRows.map((row) => ({
            userId: row.usuario_id,
            validFrom: row.valid_from,
            validUntil: row.valid_until,
          }));

        this.segregationService.validateSingleSecretaria({
          targetUserId: userId,
          requestedPeriod,
          otherSecretariaAssignments,
        });
      }

      // 5. Aplicar cambios en la base de datos
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

          const existing = await queryRunner.manager.query<
            Array<{ usuario_id: number }>
          >(
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

      if (!isExternalRunner) {
        await queryRunner.commitTransaction();
      }
    } catch (err) {
      if (!isExternalRunner) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    } finally {
      if (!isExternalRunner) {
        await queryRunner.release();
      }
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
    const result = await this.dataSource.query<
      Array<
        Array<{
          usuario_id: number;
          rol_id: number;
          fecha_inicio: Date;
          fecha_fin: Date;
          motivo_delegacion: string;
        }>
      >
    >(
      `UPDATE catalogos.usuarios_roles 
       SET fecha_fin = NOW(), motivo_delegacion = $1
       WHERE usuario_id = $2 AND rol_id = $3
       RETURNING usuario_id, rol_id, fecha_inicio, fecha_fin, motivo_delegacion`,
      [motif, userId, role.id],
    );

    if (!result[0] || result[0].length === 0) {
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Bloqueo pesimista si es SECRETARIA
      if (role.code === (RoleCode.SECRETARIA as string)) {
        await queryRunner.manager.query(
          `SELECT id FROM catalogos.roles WHERE codigo = 'SECRETARIA' FOR UPDATE`,
        );
      }

      // 2. Verificar asignación existente
      const existingAssignment = await queryRunner.manager.query<
        Array<{
          usuario_id: number;
          rol_id: number;
          fecha_inicio: Date;
          fecha_fin: Date | null;
          motivo_delegacion: string | null;
        }>
      >(
        `SELECT usuario_id, rol_id, fecha_inicio, fecha_fin, motivo_delegacion
         FROM catalogos.usuarios_roles
         WHERE usuario_id = $1 AND rol_id = $2`,
        [userId, role.id],
      );

      if (existingAssignment.length === 0) {
        throw new NotFoundException(
          `El usuario no posee asignado el rol ${roleCode}`,
        );
      }

      const assignment = existingAssignment[0];

      // 3. Validar segregación con otros roles activos del usuario
      const otherActiveRolesRaw: { codigo: string }[] =
        await queryRunner.manager.query(
          `SELECT r.codigo
         FROM catalogos.usuarios_roles ur
         JOIN catalogos.roles r ON ur.rol_id = r.id
         WHERE ur.usuario_id = $1
           AND ur.rol_id != $2
           AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())
           AND r.activo = true
           AND r.eliminado_en IS NULL`,
          [userId, role.id],
        );
      const otherActiveRoles = otherActiveRolesRaw.map((r) => r.codigo);

      this.segregationService.validateRoleExtension(
        otherActiveRoles,
        role.code,
      );

      // 4. Validar unicidad de SECRETARIA si aplica
      if (role.code === (RoleCode.SECRETARIA as string)) {
        const otherSecretariaRows: {
          usuario_id: number;
          valid_from: Date | null;
          valid_until: Date | null;
        }[] = await queryRunner.manager.query(
          `SELECT ur.usuario_id, ur.fecha_inicio as valid_from, ur.fecha_fin as valid_until
           FROM catalogos.usuarios_roles ur
           JOIN catalogos.roles r ON ur.rol_id = r.id
           WHERE r.codigo = 'SECRETARIA'
             AND ur.usuario_id != $1
             AND (ur.fecha_fin IS NULL OR ur.fecha_fin >= NOW())`,
          [userId],
        );

        const otherAssignments: SecretariaAssignment[] =
          otherSecretariaRows.map((row) => ({
            userId: row.usuario_id,
            validFrom: row.valid_from,
            validUntil: row.valid_until,
          }));

        this.segregationService.validateSingleSecretaria({
          targetUserId: userId,
          requestedPeriod: {
            validFrom: assignment.fecha_inicio,
            validUntil: newValidUntil,
          },
          otherSecretariaAssignments: otherAssignments,
        });
      }

      // 5. Actualizar la vigencia
      const motif = reason ? `[PRÓRROGA] ${reason}` : undefined;
      const result = await queryRunner.manager.query<
        Array<
          Array<{
            usuario_id: number;
            rol_id: number;
            fecha_inicio: Date;
            fecha_fin: Date;
            motivo_delegacion: string;
          }>
        >
      >(
        `UPDATE catalogos.usuarios_roles 
         SET fecha_fin = $1, motivo_delegacion = COALESCE($2, motivo_delegacion)
         WHERE usuario_id = $3 AND rol_id = $4
         RETURNING usuario_id, rol_id, fecha_inicio, fecha_fin, motivo_delegacion`,
        [newValidUntil, motif || null, userId, role.id],
      );

      await queryRunner.commitTransaction();

      const returnedAssignment = result[0]?.[0];

      return {
        message: `La vigencia del rol temporal ${role.name} ha sido extendida exitosamente`,
        userId,
        roleCode: role.code,
        newValidUntil,
        assignment: returnedAssignment,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getRoles() {
    return this.dataSource.getRepository(RoleOrmEntity).find({
      where: { isActive: true },
    });
  }
}

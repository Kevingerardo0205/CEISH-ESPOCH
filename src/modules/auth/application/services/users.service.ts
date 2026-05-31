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
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';

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

    // Buscar roles por código (normalizado a mayúsculas) o por nombre
    const roleCodes = dto.roles.map((r) => r.toUpperCase().replace(' ', '_'));
    const roles = await this.dataSource.getRepository(RoleOrmEntity).find({
      where: [{ code: In(roleCodes) }, { name: In(dto.roles) }],
    });

    if (roles.length === 0) {
      throw new BadRequestException(
        'Ninguno de los roles proporcionados es válido',
      );
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
      roles: roles,
    });

    const savedUser = await this.dataSource
      .getRepository(UserOrmEntity)
      .save(user);

    // Si es flujo de invitación, enviar el correo
    if (!dto.password && otp) {
      await this.emailService.sendAccountInvitation(
        savedUser.institutionalEmail,
        otp,
        savedUser.fullName,
      );
    }

    const {
      passwordHash: _p,
      refreshTokenHash: _r,
      confirmationTokenHash: _c,
      ...result
    } = savedUser;
    return result;
  }

  async findAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map((user) => {
      const {
        passwordHash,
        refreshTokenHash,
        confirmationTokenHash,
        resetPasswordTokenHash,
        ...result
      } = user;
      return {
        ...result,
        roles: user.roles.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
        })),
      };
    });
  }

  async findById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== user.institutionalEmail) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) {
        throw new BadRequestException(
          'El nuevo correo electrónico ya está registrado',
        );
      }
      user.institutionalEmail = dto.email;
    }

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.nationalId) user.nationalId = dto.nationalId;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.isEmailVerified !== undefined)
      user.isEmailVerified = dto.isEmailVerified;

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

    const savedUser = await this.dataSource
      .getRepository(UserOrmEntity)
      .save(user);

    const { passwordHash: _p, refreshTokenHash: _r, ...result } = savedUser;
    return result;
  }

  async updateUserRoles(userId: number, roleCodes: string[]) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const normalizedCodes = roleCodes.map((c) => c.toUpperCase());
    const roles = await this.dataSource.getRepository(RoleOrmEntity).find({
      where: [{ code: In(normalizedCodes) }, { name: In(roleCodes) }],
    });

    if (roles.length === 0) {
      throw new BadRequestException('Roles no válidos');
    }

    user.roles = roles;
    await this.dataSource.getRepository(UserOrmEntity).save(user);

    return {
      message: 'Roles actualizados exitosamente',
      roles: user.roles.map((r) => r.code),
    };
  }

  async getRoles() {
    return this.dataSource.getRepository(RoleOrmEntity).find({
      where: { isActive: true },
    });
  }
}

import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserOrmEntity } from '../../infrastructure/database/user.entity.orm';
import { InvestigatorProfileOrmEntity } from '../../infrastructure/database/investigator-profile.entity.orm';
import { RoleOrmEntity } from '../../infrastructure/database/role.entity.orm';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';
import { RegisterInvestigatorDto } from '../dtos/register-investigator.dto';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { IInvestigatorProfileRepository } from '../../domain/ports/investigator-profile.repository.port';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly profileRepository: IInvestigatorProfileRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: IEmailServicePort,
    private readonly dataSource: DataSource,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Por favor, confirma tu correo electrónico antes de iniciar sesión.');
    }

    // Check lockout
    if (user.blockedUntil && user.blockedUntil > new Date()) {
      throw new ForbiddenException('Account temporarily locked. Try again later.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);

    if (!isMatch) {
      await this.handleFailedAttempt(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    if (user.failedAttempts > 0) {
      await this.userRepository.update(user.id, { 
        failedAttempts: 0, 
        blockedUntil: null 
      });
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  private async handleFailedAttempt(user: UserOrmEntity) {
    const newAttempts = user.failedAttempts + 1;
    const updateData: Partial<UserOrmEntity> = { failedAttempts: newAttempts };

    if (newAttempts >= this.MAX_FAILED_ATTEMPTS) {
      updateData.blockedUntil = new Date(Date.now() + this.LOCK_TIME_MS);
    }

    await this.userRepository.update(user.id, updateData);
  }

  async login(user: any) {
    const payload = { 
      email: user.institutionalEmail, 
      sub: user.id,
      roles: user.roles.map(r => r.name)
    };

    const tokens = await this.generateTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.institutionalEmail,
        roles: payload.roles,
        isEmailVerified: user.isEmailVerified
      }
    };
  }

  async getMe(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      id: user.id,
      nationalId: user.nationalId,
      fullName: user.fullName,
      email: user.institutionalEmail,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      roles: user.roles.map(r => r.name),
      investigatorProfile: user.investigatorProfile ? {
        documentType: user.investigatorProfile.documentType,
        firstName: user.investigatorProfile.firstName,
        lastName: user.investigatorProfile.firstLastName,
        phone: user.investigatorProfile.phone,
        nationality: user.investigatorProfile.nationality
      } : null
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepository.findById(userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) throw new UnauthorizedException('Access Denied');

    const payload = { 
      email: user.institutionalEmail, 
      sub: user.id,
      roles: user.roles.map(r => r.name)
    };
    const tokens = await this.generateTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  private async generateTokens(payload: any) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET || 'SUPER_SECRET_REFRESH_KEY',
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshTokenHash: hash });
  }

  async register(dto: RegisterInvestigatorDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar si ya existe el correo
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) throw new BadRequestException('Este correo electrónico ya está registrado');

      // 2. Buscar el Rol de Investigador (ID 6 según tu DB)
      const investigatorRole = await queryRunner.manager.findOne(RoleOrmEntity, {
        where: { name: 'investigador' },
      });

      if (!investigatorRole) {
        throw new Error('Configuración del sistema incompleta: Rol "investigador" no encontrado.');
      }

      // 3. Crear Usuario (Identidad para Auth)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password, salt);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(code, 10);

      const user = queryRunner.manager.create(UserOrmEntity, {
        nationalId: dto.nationalId,
        fullName: `${dto.firstName} ${dto.middleName || ''} ${dto.firstLastName} ${dto.secondLastName || ''}`.trim(),
        institutionalEmail: dto.email,
        passwordHash: hashedPassword,
        isEmailVerified: false,
        isActive: false, // Inactivo hasta que confirme email
        confirmationTokenHash: codeHash,
        roles: [investigatorRole], // Asignación de rol inmediata
      });

      const savedUser = await queryRunner.manager.save(user);

      // 4. Crear Perfil de Investigador (Datos Detallados)
      const profile = queryRunner.manager.create(InvestigatorProfileOrmEntity, {
        userId: savedUser.id,
        documentType: dto.documentType,
        firstName: dto.firstName,
        middleName: dto.middleName,
        firstLastName: dto.firstLastName,
        secondLastName: dto.secondLastName,
        nationality: dto.nationality,
        personalEmail: dto.email,
        phone: dto.phone,
        acceptsTerms: dto.acceptsTerms,
        acceptsRegulations: dto.acceptsRegulations,
      });

      await queryRunner.manager.save(profile);

      await queryRunner.commitTransaction();

      // 5. Enviar Correo con el Código OTP
      await this.emailService.sendEmailConfirmation(
        savedUser.institutionalEmail,
        code,
        savedUser.fullName,
      );

      return {
        id: savedUser.id,
        email: savedUser.institutionalEmail,
        message: 'Registro exitoso. El código de verificación ha sido enviado a su correo.',
      };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('[REGISTRATION FAILED]', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async confirmEmail(email: string, code: string): Promise<void> {
    if (!email || !code) throw new BadRequestException('Email y código son requeridos');
    
    // 1. Buscar el usuario (el repositorio ahora permite encontrar inactivos)
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.isEmailVerified) {
      return; // Ya está verificado
    }

    if (!user.confirmationTokenHash) {
      throw new BadRequestException('No hay una verificación pendiente para este usuario');
    }

    // 2. Validar el código
    const isMatch = await bcrypt.compare(code, user.confirmationTokenHash);
    if (!isMatch) {
      throw new BadRequestException('Código de confirmación inválido');
    }

    // 3. Iniciar Transacción de Activación
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Activar campos
      user.isEmailVerified = true;
      user.isActive = true;
      user.confirmationTokenHash = null;

      // Asignar rol de investigador si aplica
      if (user.investigatorProfile && (!user.roles || user.roles.length === 0)) {
        const investigatorRole = await queryRunner.manager.findOne(RoleOrmEntity, {
          where: { name: 'investigador' },
        });
        if (investigatorRole) {
          user.roles = [investigatorRole];
        }
      }

      // IMPORTANTE: Usar save() para guardar la relación de roles
      await queryRunner.manager.save(UserOrmEntity, user);
      await queryRunner.commitTransaction();

      console.log(`[AUTH SUCCESS] Usuario ${email} activado exitosamente.`);

    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('[AUTH ERROR] Fallo en la transacción de confirmación:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async resendConfirmation(email: string): Promise<void> {
    if (!email) throw new BadRequestException('El correo institucional es requerido');

    const user = await this.userRepository.findByEmail(email);

    if (!user || user.isEmailVerified) return;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    await this.userRepository.update(user.id, {
      confirmationTokenHash: codeHash,
    });

    await this.emailService.sendEmailConfirmation(
      user.institutionalEmail,
      code,
      user.fullName,
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) return;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    await this.userRepository.update(user.id, {
      resetPasswordTokenHash: hash,
      resetPasswordExpires: expires,
    });

    await this.emailService.sendPasswordReset(
      user.institutionalEmail,
      code,
      user.fullName,
    );
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    if (!email || !code) throw new BadRequestException('Email y código son requeridos');

    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.resetPasswordTokenHash || !user.resetPasswordExpires) {
      throw new BadRequestException('Código inválido o expirado');
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Código expirado');
    }

    const isMatch = await bcrypt.compare(code, user.resetPasswordTokenHash);
    if (!isMatch) {
      throw new BadRequestException('Código inválido o expirado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userRepository.update(user.id, {
      passwordHash: hashedPassword,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
    });
  }

  async createUser(dto: CreateUserDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new BadRequestException('El correo electrónico ya está registrado');

    const roles = await this.dataSource.getRepository(RoleOrmEntity).find({
      where: { name: In(dto.roles) },
    });

    if (roles.length === 0) {
      throw new BadRequestException('Ninguno de los roles proporcionados es válido');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const user = this.dataSource.getRepository(UserOrmEntity).create({
      nationalId: dto.nationalId,
      fullName: dto.fullName,
      institutionalEmail: dto.email,
      passwordHash: hashedPassword,
      isActive: dto.isActive ?? true,
      isEmailVerified: dto.isEmailVerified ?? true,
      roles: roles,
    });

    const savedUser = await this.dataSource.getRepository(UserOrmEntity).save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }

  async getRoles() {
    return this.dataSource.getRepository(RoleOrmEntity).find();
  }

  async findAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map(user => {
      const { passwordHash, refreshTokenHash, confirmationTokenHash, resetPasswordTokenHash, ...result } = user;
      return {
        ...result,
        roles: user.roles.map(r => r.name),
      };
    });
  }

  async updateUserRoles(userId: number, roleNames: string[]) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const roles = await this.dataSource.getRepository(RoleOrmEntity).find({
      where: { name: In(roleNames) },
    });

    if (roles.length === 0) {
      throw new BadRequestException('Roles no válidos');
    }

    user.roles = roles;
    await this.dataSource.getRepository(UserOrmEntity).save(user);

    return {
      message: 'Roles actualizados exitosamente',
      roles: user.roles.map(r => r.name),
    };
  }

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== user.institutionalEmail) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing) throw new BadRequestException('El nuevo correo electrónico ya está registrado');
      user.institutionalEmail = dto.email;
    }

    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.nationalId) user.nationalId = dto.nationalId;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.isEmailVerified !== undefined) user.isEmailVerified = dto.isEmailVerified;

    const savedUser = await this.dataSource.getRepository(UserOrmEntity).save(user);
    const { passwordHash, ...result } = savedUser;
    return result;
  }
}

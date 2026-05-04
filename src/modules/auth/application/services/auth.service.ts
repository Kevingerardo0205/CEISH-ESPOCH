import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserOrmEntity } from '../../infrastructure/database/user.entity.orm';
import { IEmailServicePort } from '../../../notifications/domain/ports/email.service.port';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    private readonly jwtService: JwtService,
    private readonly emailService: IEmailServicePort,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { institutionalEmail: email, isActive: true },
      relations: ['roles'],
      select: ['id', 'institutionalEmail', 'passwordHash', 'failedAttempts', 'blockedUntil', 'isEmailVerified'],
    });

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
      roles: user.roles 
    };

    const tokens = await this.generateTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['roles'],
      select: ['id', 'institutionalEmail', 'refreshTokenHash'],
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) throw new UnauthorizedException('Access Denied');

    const payload = { 
      email: user.institutionalEmail, 
      sub: user.id,
      roles: user.roles 
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

  async register(userData: any) {
    if (!userData || !userData.password) {
      throw new UnauthorizedException('Password is required for registration');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const { password, ...userToCreate } = userData;

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    const userEntity = this.userRepository.create({
      ...userToCreate,
      passwordHash: hashedPassword,
      isEmailVerified: false,
      confirmationTokenHash: tokenHash,
    });
    
    const savedUser = await this.userRepository.save(userEntity);
    const user = Array.isArray(savedUser) ? savedUser[0] : savedUser;

    await this.emailService.sendEmailConfirmation(
      user.institutionalEmail,
      token,
      user.fullName,
    );

    const { passwordHash, ...result } = user;
    return result;
  }

  async confirmEmail(token: string): Promise<void> {
    const usersWithToken = await this.userRepository.find({
      where: {
        isEmailVerified: false,
        confirmationTokenHash: require('typeorm').Not(require('typeorm').IsNull()),
      },
      select: ['id', 'confirmationTokenHash'],
    });

    let targetUser: UserOrmEntity | undefined;
    for (const user of usersWithToken) {
      if (user.confirmationTokenHash && await bcrypt.compare(token, user.confirmationTokenHash)) {
        targetUser = user;
        break;
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Token de confirmación inválido');
    }

    await this.userRepository.update(targetUser.id, {
      isEmailVerified: true,
      confirmationTokenHash: null,
    });
  }

  async resendConfirmation(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { institutionalEmail: email, isEmailVerified: false },
    });

    if (!user) return; // O lanzar error si prefieres

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await this.userRepository.update(user.id, {
      confirmationTokenHash: tokenHash,
    });

    await this.emailService.sendEmailConfirmation(
      user.institutionalEmail,
      token,
      user.fullName,
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { institutionalEmail: email, isActive: true },
    });

    // Siempre retornar 200 aunque no exista el usuario por seguridad
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const hash = await bcrypt.hash(token, 10);
    const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    await this.userRepository.update(user.id, {
      resetPasswordTokenHash: hash,
      resetPasswordExpires: expires,
    });

    await this.emailService.sendPasswordReset(
      user.institutionalEmail,
      token,
      user.fullName,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Nota: Esto es costoso porque no podemos buscar directamente por hash de bcrypt
    // Pero como los tokens de recuperación son pocos comparados con usuarios,
    // buscaremos todos los que tengan un token pendiente y no hayan expirado.
    const usersWithToken = await this.userRepository.find({
      where: {
        resetPasswordTokenHash: require('typeorm').Not(require('typeorm').IsNull()),
        resetPasswordExpires: require('typeorm').MoreThan(new Date()),
      },
      select: ['id', 'resetPasswordTokenHash'],
    });

    let targetUser: UserOrmEntity | undefined;
    for (const user of usersWithToken) {
      if (user.resetPasswordTokenHash && await bcrypt.compare(token, user.resetPasswordTokenHash)) {
        targetUser = user;
        break;
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await this.userRepository.update(targetUser.id, {
      passwordHash: hashedPassword,
      resetPasswordTokenHash: null,
      resetPasswordExpires: null,
    });
  }
}

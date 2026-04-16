import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../models/usuarios';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 3;
  private readonly LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usuariosRepository.findOne({
      where: { emailInstitucional: email, activo: true },
      relations: ['roles'],
      select: ['id', 'emailInstitucional', 'passwordHash', 'intentosFallidos', 'bloqueadoHasta'],
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lockout
    if (user.bloqueadoHasta && user.bloqueadoHasta > new Date()) {
      throw new ForbiddenException('Account temporarily locked. Try again later.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);

    if (!isMatch) {
      await this.handleFailedAttempt(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on success
    if (user.intentosFallidos > 0) {
      await this.usuariosRepository.update(user.id, { 
        intentosFallidos: 0, 
        bloqueadoHasta: null 
      });
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  private async handleFailedAttempt(user: Usuario) {
    const newAttempts = user.intentosFallidos + 1;
    const updateData: Partial<Usuario> = { intentosFallidos: newAttempts };

    if (newAttempts >= this.MAX_FAILED_ATTEMPTS) {
      updateData.bloqueadoHasta = new Date(Date.now() + this.LOCK_TIME_MS);
    }

    await this.usuariosRepository.update(user.id, updateData);
  }

  async login(user: any) {
    const payload = { 
      email: user.emailInstitucional, 
      sub: user.id,
      roles: user.roles 
    };

    const tokens = await this.generateTokens(payload);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usuariosRepository.findOne({
      where: { id: userId, activo: true },
      relations: ['roles'],
      select: ['id', 'emailInstitucional', 'refreshTokenHash'],
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Access Denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) throw new UnauthorizedException('Access Denied');

    const payload = { 
      email: user.emailInstitucional, 
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
    await this.usuariosRepository.update(userId, { refreshTokenHash: hash });
  }

  async register(userData: any) {
    if (!userData || !userData.password) {
      throw new UnauthorizedException('Password is required for registration');
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Eliminamos password del objeto para que no intente guardarlo en una columna inexistente
    const { password, ...userToCreate } = userData;

    const userEntity = this.usuariosRepository.create({
      ...userToCreate,
      passwordHash: hashedPassword,
    });
    
    const savedUser = await this.usuariosRepository.save(userEntity);
    const user = Array.isArray(savedUser) ? savedUser[0] : savedUser;

    const { passwordHash, ...result } = user;
    return result;
  }
}

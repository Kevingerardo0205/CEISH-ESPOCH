import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource } from 'typeorm';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { UserOrmEntity } from '../database/user.entity.orm';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';

@Injectable()
export class UserTypeOrmRepository
  extends BaseTypeOrmRepository<UserOrmEntity>
  implements IUserRepository
{
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
    private readonly dataSource: DataSource,
  ) {
    super(userRepo);
  }

  async findById(id: number): Promise<UserOrmEntity | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: [
        'roles',
        'investigatorProfile',
        'roles.permissions',
        'roles.permissions.module',
      ],
    });
  }

  async findAll(): Promise<UserOrmEntity[]> {
    return this.userRepo.find({
      relations: ['roles', 'investigatorProfile'],
      order: { id: 'DESC' },
    });
  }

  async save(
    user: Partial<UserOrmEntity>,
    manager?: Record<string, unknown>,
  ): Promise<UserOrmEntity> {
    const repo = manager
      ? (manager as any).getRepository(UserOrmEntity)
      : this.userRepo;
    return repo.save(user);
  }

  async update(
    id: number,
    data: Partial<UserOrmEntity>,
    manager?: Record<string, unknown>,
  ): Promise<void> {
    const repo = manager
      ? (manager as any).getRepository(UserOrmEntity)
      : this.userRepo;
    await repo.update(id, data);
  }

  async findByEmail(email: string): Promise<UserOrmEntity | null> {
    return this.userRepo.findOne({
      where: { institutionalEmail: email },
      relations: [
        'roles',
        'investigatorProfile',
        'roles.permissions',
        'roles.permissions.module',
      ],
      select: {
        id: true,
        nationalId: true,
        fullName: true,
        institutionalEmail: true,
        passwordHash: true,
        isActive: true,
        failedAttempts: true,
        blockedUntil: true,
        isEmailVerified: true,
        confirmationTokenHash: true,
        resetPasswordTokenHash: true,
        resetPasswordExpires: true,
        lastAccess: true,
      },
    });
  }

  async findWithToken(
    where: FindOptionsWhere<UserOrmEntity>,
  ): Promise<UserOrmEntity[]> {
    return this.userRepo.find({
      where,
      select: [
        'id',
        'confirmationTokenHash',
        'resetPasswordTokenHash',
        'resetPasswordExpires',
        'isEmailVerified',
      ],
    });
  }

  async findByRoleCodes(
    codes: string[],
  ): Promise<
    Array<{ id: number; fullName: string; institutionalEmail: string }>
  > {
    if (!codes.length) return [];
    const rows: Array<{
      id: number;
      nombres_completos: string;
      email_institucional: string;
    }> = await this.dataSource.query(
      `SELECT DISTINCT u.id, u.nombres_completos, u.email_institucional
       FROM catalogos.usuarios u
       JOIN catalogos.usuarios_roles ur ON ur.usuario_id = u.id
       JOIN catalogos.roles r           ON r.id = ur.rol_id
       WHERE r.codigo = ANY($1)
         AND u.activo = true`,
      [codes],
    );
    return rows.map((row) => ({
      id: row.id,
      fullName: row.nombres_completos,
      institutionalEmail: row.email_institucional,
    }));
  }
}

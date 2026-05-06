import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/ports/user.repository.port';
import { UserOrmEntity } from '../database/user.entity.orm';
import { BaseTypeOrmRepository } from '../../../../shared/db/base.repository';

@Injectable()
export class UserTypeOrmRepository 
  extends BaseTypeOrmRepository<UserOrmEntity> 
  implements IUserRepository {
  
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepo: Repository<UserOrmEntity>,
  ) {
    super(userRepo);
  }

  async findById(id: number): Promise<UserOrmEntity | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['roles', 'investigatorProfile'],
    });
  }

  async findAll(): Promise<UserOrmEntity[]> {
    return this.userRepo.find({
      relations: ['roles', 'investigatorProfile'],
      order: { id: 'DESC' },
    });
  }

  async save(user: Partial<UserOrmEntity>, manager?: any): Promise<UserOrmEntity> {
    const repo = manager ? manager.getRepository(UserOrmEntity) : this.userRepo;
    return repo.save(user);
  }

  async update(id: number, data: Partial<UserOrmEntity>, manager?: any): Promise<void> {
    const repo = manager ? manager.getRepository(UserOrmEntity) : this.userRepo;
    await repo.update(id, data);
  }

  async findByEmail(email: string): Promise<UserOrmEntity | null> {
    return this.userRepo.findOne({
      where: { institutionalEmail: email },
      relations: ['roles', 'investigatorProfile'],
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

  async findWithToken(where: any): Promise<UserOrmEntity[]> {
    return this.userRepo.find({
      where,
      select: ['id', 'confirmationTokenHash', 'resetPasswordTokenHash', 'resetPasswordExpires', 'isEmailVerified'],
    });
  }
}

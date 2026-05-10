import { UserOrmEntity } from '../../infrastructure/database/user.entity.orm';

export abstract class IUserRepository {
  abstract findByEmail(email: string): Promise<UserOrmEntity | null>;
  abstract findById(id: number): Promise<UserOrmEntity | null>;
  abstract findAll(): Promise<UserOrmEntity[]>;
  abstract save(
    user: Partial<UserOrmEntity>,
    manager?: any,
  ): Promise<UserOrmEntity>;
  abstract update(
    id: number,
    data: Partial<UserOrmEntity>,
    manager?: any,
  ): Promise<void>;
  abstract findWithToken(where: any): Promise<UserOrmEntity[]>;
}

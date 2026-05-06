import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './infrastructure/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { UserOrmEntity } from './infrastructure/database/user.entity.orm';
import { RoleOrmEntity } from './infrastructure/database/role.entity.orm';
import { InvestigatorProfileOrmEntity } from './infrastructure/database/investigator-profile.entity.orm';
import { IUserRepository } from './domain/ports/user.repository.port';
import { UserTypeOrmRepository } from './infrastructure/repositories/user.typeorm.repository';
import { IInvestigatorProfileRepository } from './domain/ports/investigator-profile.repository.port';
import { InvestigatorProfileTypeOrmRepository } from './infrastructure/repositories/investigator-profile.typeorm.repository';
import { LocalStrategy } from './infrastructure/strategies/local.strategy';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserOrmEntity, RoleOrmEntity, InvestigatorProfileOrmEntity]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    LocalStrategy, 
    JwtStrategy,
    {
      provide: IUserRepository,
      useClass: UserTypeOrmRepository,
    },
    {
      provide: IInvestigatorProfileRepository,
      useClass: InvestigatorProfileTypeOrmRepository,
    },
  ],
  exports: [AuthService, IUserRepository],
})
export class AuthModule {}

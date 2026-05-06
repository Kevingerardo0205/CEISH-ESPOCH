import { Role } from './role.entity';
import { InvestigatorProfile } from './investigator-profile.entity';

export class User {
  constructor(
    public readonly id: number,
    public readonly nationalId: string,
    public readonly fullName: string,
    public readonly institutionalEmail: string,
    public readonly passwordHash?: string,
    public readonly isActive: boolean = true,
    public readonly failedAttempts: number = 0,
    public readonly blockedUntil: Date | null = null,
    public readonly refreshTokenHash: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly lastAccess: Date | null = null,
    public readonly roles: Role[] = [],
    public readonly isEmailVerified: boolean = false,
    public readonly investigatorProfile?: InvestigatorProfile,
  ) {}
}

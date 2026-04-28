import { Role } from './role.entity';

export class User {
  constructor(
    public readonly id: number,
    public readonly nationalId: string,
    public readonly fullName: string,
    public readonly institutionalEmail: string,
    public readonly personalEmail: string | null = null,
    public readonly phone: string | null = null,
    public readonly institution: string | null = null,
    public readonly position: string | null = null,
    public readonly senescytRegistration: string | null = null,
    public readonly passwordHash?: string,
    public readonly isActive: boolean = true,
    public readonly failedAttempts: number = 0,
    public readonly blockedUntil: Date | null = null,
    public readonly refreshTokenHash: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly lastAccess: Date | null = null,
    public readonly roles: Role[] = [],
  ) {}
}

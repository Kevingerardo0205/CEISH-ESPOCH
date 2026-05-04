import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { RoleOrmEntity } from './role.entity.orm';
import { EncryptionTransformer } from '../../../../shared/encryption/encryption.transformer';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'usuarios', schema: 'catalogos' })
export class UserOrmEntity extends BaseOrmEntity {
  @Column({ name: 'cedula', unique: true, length: 20 })
  nationalId!: string;

  @Column({ name: 'nombres_completos', length: 200 })
  fullName!: string;

  @Column({ name: 'email_institucional', unique: true, length: 100 })
  institutionalEmail!: string;

  @Column({ 
    name: 'email_personal', 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  personalEmail: string | null = null;

  @Column({ 
    name: 'telefono',
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  phone: string | null = null;

  @Column({ name: 'institucion_pertenece', type: 'varchar', length: 200, nullable: true })
  institution!: string | null;

  @Column({ name: 'cargo', type: 'varchar', length: 100, nullable: true })
  position: string | null = null;

  @Column({ name: 'registro_senescyt', type: 'varchar', length: 50, nullable: true })
  senescytRegistration: string | null = null;

  @Column({ name: 'password_hash', length: 255, select: false, nullable: true })
  passwordHash?: string;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;

  @Column({ name: 'intentos_fallidos', default: 0 })
  failedAttempts!: number;

  @Column({ name: 'bloqueado_hasta', type: 'timestamptz', nullable: true })
  blockedUntil: Date | null = null;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null = null;

  @Column({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true })
  lastAccess: Date | null = null;

  @Column({ name: 'email_verificado', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'token_confirmacion_hash', type: 'varchar', length: 255, nullable: true })
  confirmationTokenHash: string | null = null;

  @Column({ name: 'token_recuperacion_hash', type: 'varchar', length: 255, nullable: true })
  resetPasswordTokenHash: string | null = null;

  @Column({ name: 'token_recuperacion_expira', type: 'timestamptz', nullable: true })
  resetPasswordExpires: Date | null = null;

  @ManyToMany(() => RoleOrmEntity)
  @JoinTable({
    name: 'usuarios_roles',
    schema: 'catalogos',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles!: RoleOrmEntity[];
}

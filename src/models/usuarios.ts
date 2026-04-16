import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Rol } from './roles';
import { EncryptionTransformer } from '../core/encryption/encryption.transformer';

@Entity({ name: 'usuarios', schema: 'catalogos' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 20 })
  cedula!: string;

  @Column({ name: 'nombres_completos', length: 200 })
  nombresCompletos!: string;

  @Column({ name: 'email_institucional', unique: true, length: 100 })
  emailInstitucional!: string;

  @Column({ 
    name: 'email_personal', 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  emailPersonal: string | null = null;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  telefono: string | null = null;

  @Column({ name: 'institucion_pertenece', type: 'varchar', length: 200, nullable: true })
  institucionPertenece: string | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string | null = null;

  @Column({ name: 'registro_senescyt', type: 'varchar', length: 50, nullable: true })
  registroSenescyt: string | null = null;

  @Column({ name: 'password_hash', length: 255, select: false, nullable: true })
  passwordHash?: string;

  @Column({ default: true })
  activo!: boolean;

  @Column({ name: 'intentos_fallidos', default: 0 })
  intentosFallidos!: number;

  @Column({ name: 'bloqueado_hasta', type: 'timestamptz', nullable: true })
  bloqueadoHasta: Date | null = null;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null = null;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion!: Date;

  @Column({ name: 'ultimo_acceso', type: 'timestamptz', nullable: true })
  ultimoAcceso: Date | null = null;

  @ManyToMany(() => Rol)
  @JoinTable({
    name: 'usuarios_roles',
    schema: 'catalogos',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'rol_id', referencedColumnName: 'id' },
  })
  roles!: Rol[];
}

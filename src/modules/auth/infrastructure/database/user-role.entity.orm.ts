import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'usuarios_roles', schema: 'catalogos' })
export class UserRoleOrmEntity {
  @PrimaryColumn({ name: 'usuario_id', type: 'int' })
  userId!: number;

  @PrimaryColumn({ name: 'rol_id', type: 'int' })
  roleId!: number;

  @Column({
    name: 'fecha_inicio',
    type: 'timestamptz',
    nullable: true,
    default: () => 'NOW()',
  })
  validFrom?: Date;

  @Column({ name: 'fecha_fin', type: 'timestamptz', nullable: true })
  validUntil?: Date;

  @Column({
    name: 'motivo_delegacion',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  reason?: string;

  @Column({ name: 'asignado_por', type: 'int', nullable: true })
  assignedBy?: number;
}

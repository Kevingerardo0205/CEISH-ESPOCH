import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'roles', schema: 'catalogos' })
export class RoleOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre', unique: true, length: 50 })
  name: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'permisos', type: 'jsonb', default: {} })
  permissions: any;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;
}

import { Entity, Column, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';
import { PermissionOrmEntity } from './permission.entity.orm';

@Entity({ name: 'modulos', schema: 'catalogos' })
export class ModuleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'codigo', unique: true, length: 50 })
  code!: string;

  @Column({ name: 'icono', length: 50, nullable: true })
  icon?: string;

  @Column({ name: 'orden', type: 'int', default: 0 })
  order!: number;

  @Column({ name: 'activo', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => PermissionOrmEntity, (permission) => permission.module)
  permissions!: PermissionOrmEntity[];
}

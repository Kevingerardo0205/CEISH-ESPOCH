import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';
import { PermissionOrmEntity } from './permission.entity.orm';

@Entity({ name: 'roles', schema: 'catalogos' })
export class RoleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'codigo', unique: true, length: 20 })
  code!: string;

  @Column({ name: 'nombre', length: 50 })
  name!: string;

  @Column({ name: 'descripcion', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;

  @ManyToMany(() => PermissionOrmEntity)
  @JoinTable({
    name: 'rol_permisos',
    joinColumn: { name: 'rol_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permiso_id', referencedColumnName: 'id' },
    schema: 'catalogos',
  })
  permissions!: PermissionOrmEntity[];
}

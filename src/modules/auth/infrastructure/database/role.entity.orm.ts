import { Entity, Column } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'roles', schema: 'catalogos' })
export class RoleOrmEntity extends BaseOrmEntity {
  @Column({ name: 'nombre', unique: true, length: 50 })
  name!: string;

  @Column({ name: 'descripcion', length: 255, nullable: true })
  description?: string;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;
}

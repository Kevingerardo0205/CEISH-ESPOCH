import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';
import { ModuleOrmEntity } from './module.entity.orm';

@Entity({ name: 'permisos', schema: 'catalogos' })
export class PermissionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'codigo', unique: true, length: 50 })
  code!: string;

  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'modulo_id', nullable: true })
  moduleId!: number | null;

  @ManyToOne(() => ModuleOrmEntity, (module) => module.permissions)
  @JoinColumn({ name: 'modulo_id' })
  module?: ModuleOrmEntity;
}

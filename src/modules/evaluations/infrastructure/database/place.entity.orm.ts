import { Entity, Column } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'lugares', schema: 'evaluacion' })
export class PlaceOrmEntity extends BaseOrmEntity {
  @Column({ name: 'nombre', unique: true, length: 150 })
  name!: string;

  @Column({ name: 'ubicacion', length: 250, nullable: true })
  location?: string;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;
}

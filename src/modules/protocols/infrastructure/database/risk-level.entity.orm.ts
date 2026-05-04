import { Entity, Column } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'niveles_riesgo', schema: 'catalogos' })
export class RiskLevelOrmEntity extends BaseOrmEntity {
  @Column({ name: 'codigo', unique: true, length: 20 })
  code!: string;

  @Column({ name: 'nombre', length: 100, nullable: true })
  name?: string;

  @Column({ name: 'tipo_revision', length: 50, nullable: true })
  reviewType?: string;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;
}

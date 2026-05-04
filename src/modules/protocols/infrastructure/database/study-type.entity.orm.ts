import { Entity, Column } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'tipos_estudio', schema: 'catalogos' })
export class StudyTypeOrmEntity extends BaseOrmEntity {
  @Column({ name: 'codigo', unique: true, length: 20 })
  code!: string;

  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'plazo_evaluacion_dias', nullable: true })
  evaluationDeadlineDays?: number;

  @Column({ name: 'requiere_arcsa', default: false, nullable: true })
  requiresArcsa?: boolean;

  @Column({ name: 'periodicidad_informe_dias', nullable: true })
  reportPeriodicityDays?: number;

  @Column({ name: 'requiere_informe_inicio', nullable: true })
  requiresStartReport?: boolean;

  @Column({ name: 'requiere_informe_final', nullable: true })
  requiresFinalReport?: boolean;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;
}

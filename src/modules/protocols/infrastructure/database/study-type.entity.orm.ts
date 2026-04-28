import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'tipos_estudio', schema: 'catalogos' })
export class StudyTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', unique: true, length: 10 })
  code!: string;

  @Column({ name: 'nombre', length: 100 })
  name!: string;

  @Column({ name: 'plazo_evaluacion_dias', nullable: true })
  evaluationDeadlineDays?: number;

  @Column({ name: 'requiere_arcsa', nullable: true })
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

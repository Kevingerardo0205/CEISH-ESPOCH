import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { EvaluationAssignmentOrmEntity } from './evaluation-assignment.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

@Entity({ name: 'evaluaciones', schema: 'evaluacion' })
export class EvaluationOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'asignacion_id' })
  assignmentId!: number;

  @ManyToOne(() => EvaluationAssignmentOrmEntity)
  @JoinColumn({ name: 'asignacion_id' })
  assignment!: EvaluationAssignmentOrmEntity;

  @Column({ name: 'aspectos_eticos', type: 'jsonb', nullable: true })
  ethicalAspects?: any;

  @Column({ name: 'aspectos_metodologicos', type: 'jsonb', nullable: true })
  methodologicalAspects?: any;

  @Column({ name: 'aspectos_juridicos', type: 'jsonb', nullable: true })
  legalAspects?: any;

  @Column({ name: 'resultado', length: 50, nullable: true })
  result?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'ruta_informe_pdf', length: 500, nullable: true })
  reportPath?: string;

  @CreateDateColumn({ name: 'fecha_evaluacion', type: 'timestamp' })
  evaluationDate!: Date;

  @Column({ name: 'evaluado_por', nullable: true })
  evaluatedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'evaluado_por' })
  evaluatedBy?: UserOrmEntity;
}

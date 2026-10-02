import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EvaluationAssignmentOrmEntity } from '../evaluation-assignment.entity.orm';
import { RiskLevelOrmEntity } from '../../../../protocols/infrastructure/database/risk-level.entity.orm';

@Entity({ schema: 'evaluacion', name: 'propuestas_riesgo' })
export class RiskProposalOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'asignacion_id', type: 'integer' })
  assignmentId!: number;

  @ManyToOne(() => EvaluationAssignmentOrmEntity)
  @JoinColumn({ name: 'asignacion_id' })
  assignment?: EvaluationAssignmentOrmEntity;

  @Column({ name: 'nivel_riesgo_id', type: 'integer' })
  riskLevelId!: number;

  @ManyToOne(() => RiskLevelOrmEntity)
  @JoinColumn({ name: 'nivel_riesgo_id' })
  riskLevel?: RiskLevelOrmEntity;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({
    name: 'ruta_informe_pdf',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  reportPath?: string;

  @Column({ name: 'ronda', type: 'integer', default: 1 })
  round!: number;

  @Column({ name: 'es_vigente', type: 'boolean', default: true })
  isCurrent!: boolean;

  @CreateDateColumn({ name: 'fecha_propuesta', type: 'timestamp' })
  submittedAt!: Date;
}

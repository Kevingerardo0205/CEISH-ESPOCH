import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../../../auth/infrastructure/database/user.entity.orm';
import { EvaluatorProfileOrmEntity } from '../evaluator-profile.entity.orm';
import { EvaluationAssignmentOrmEntity } from '../evaluation-assignment.entity.orm';

@Entity({ name: 'asignacion_historial', schema: 'evaluacion' })
export class AssignmentHistoryOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'asignacion_anterior_id' })
  previousAssignmentId!: number;

  @ManyToOne(() => EvaluationAssignmentOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignacion_anterior_id' })
  previousAssignment?: EvaluationAssignmentOrmEntity;

  @Column({ name: 'evaluador_anterior_id' })
  previousEvaluatorId!: number;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluador_anterior_id' })
  previousEvaluator?: UserOrmEntity;

  @Column({ name: 'perfil_id', nullable: true })
  profileId?: number;

  @ManyToOne(() => EvaluatorProfileOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'perfil_id' })
  profile?: EvaluatorProfileOrmEntity;

  @Column({ name: 'motivo', length: 50 })
  reason!: string;

  @Column({ name: 'justificacion', type: 'text', nullable: true })
  justification?: string;

  @Column({ name: 'evaluador_nuevo_id' })
  newEvaluatorId!: number;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluador_nuevo_id' })
  newEvaluator?: UserOrmEntity;

  @Column({ name: 'asignacion_nueva_id', nullable: true })
  newAssignmentId?: number;

  @ManyToOne(() => EvaluationAssignmentOrmEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asignacion_nueva_id' })
  newAssignment?: EvaluationAssignmentOrmEntity;

  @Column({ name: 'ejecutado_por' })
  executedBy!: number;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ejecutado_por' })
  executor?: UserOrmEntity;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  executedAt!: Date;
}

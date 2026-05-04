import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ProtocolVersionOrmEntity } from './protocol-version.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { EvaluatorProfileOrmEntity } from './evaluator-profile.entity.orm';

@Entity({ name: 'asignaciones_evaluacion', schema: 'evaluacion' })
export class EvaluationAssignmentOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'version_id' })
  versionId!: number;

  @ManyToOne(() => ProtocolVersionOrmEntity)
  @JoinColumn({ name: 'version_id' })
  version!: ProtocolVersionOrmEntity;

  @Column({ name: 'evaluador_id' })
  evaluatorId!: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'evaluador_id' })
  evaluator!: UserOrmEntity;

  @Column({ name: 'perfil_id', nullable: true })
  profileId?: number;

  @ManyToOne(() => EvaluatorProfileOrmEntity)
  @JoinColumn({ name: 'perfil_id' })
  profile?: EvaluatorProfileOrmEntity;

  @Column({ name: 'modalidad_id', nullable: true })
  modalityId?: number;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  @Column({ name: 'fecha_limite', type: 'date', nullable: true })
  deadline!: Date;

  @Column({ name: 'fecha_asignacion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt!: Date;

  @Column({ name: 'fecha_entrega_real', type: 'timestamp', nullable: true })
  actualSubmissionDate?: Date;

  @Column({ name: 'informe_evaluacion', type: 'text', nullable: true })
  evaluationReport?: string;

  @Column({ name: 'recomendacion', length: 50, nullable: true })
  recommendation?: string;

  @Column({ name: 'asignado_por', nullable: true })
  assignedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'asignado_por' })
  assignedBy?: UserOrmEntity;

  @Column({ name: 'aprobado_asignacion_por', nullable: true })
  assignmentApprovedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'aprobado_asignacion_por' })
  assignmentApprovedBy?: UserOrmEntity;
}

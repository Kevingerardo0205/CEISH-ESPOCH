import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProtocolVersionOrmEntity } from './protocol-version.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { EvaluatorProfileOrmEntity } from './evaluator-profile.entity.orm';
import { AssignmentStatus } from '../../domain/enums/assignment-status.enum';
import { RevisionModalityOrmEntity } from './revision-modality.entity.orm';

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

  @ManyToOne(() => RevisionModalityOrmEntity)
  @JoinColumn({ name: 'modalidad_id' })
  modality?: RevisionModalityOrmEntity;

  @Column({
    name: 'estado_id',
    type: 'integer',
    default: AssignmentStatus.SUGGESTED,
  })
  statusId!: number;

  @Column({ name: 'fecha_limite', type: 'date', nullable: true })
  deadline?: Date;

  @CreateDateColumn({ name: 'fecha_asignacion', type: 'timestamp' })
  assignedAt!: Date;

  @Column({
    name: 'fecha_sugerencia',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  suggestedAt!: Date;

  @Column({ name: 'fecha_confirmacion', type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @Column({ name: 'fecha_entrega_real', type: 'timestamp', nullable: true })
  actualSubmissionDate?: Date;

  @Column({ name: 'informe_evaluacion', type: 'text', nullable: true })
  evaluationReport?: string;

  @Column({ name: 'recomendacion_id', nullable: true })
  recommendation?: number;

  @Column({ name: 'ruta_informe_pdf', length: 500, nullable: true })
  reportPath?: string;

  @Column({ name: 'sugerido_por', nullable: true })
  suggestedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'sugerido_por' })
  suggestedBy?: UserOrmEntity;

  @Column({ name: 'confirmado_por', nullable: true })
  confirmedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'confirmado_por' })
  confirmedBy?: UserOrmEntity;

  // Legacy fields for compatibility if needed during migration
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

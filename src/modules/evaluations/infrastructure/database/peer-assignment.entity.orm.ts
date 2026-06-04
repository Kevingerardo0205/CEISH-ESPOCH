import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { RiskLevelOrmEntity } from '../../../protocols/infrastructure/database/risk-level.entity.orm';

@Entity({ name: 'asignaciones_pares_riesgo', schema: 'evaluacion' })
export class PeerRiskAssignmentOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;

  @ManyToOne(() => ProtocolOrmEntity)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: ProtocolOrmEntity;

  @Column({ name: 'evaluador_id' })
  evaluatorId!: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'evaluador_id' })
  evaluator!: UserOrmEntity;

  @Column({ name: 'nivel_riesgo_propuesto_id', nullable: true })
  proposedRiskLevelId?: number;

  @ManyToOne(() => RiskLevelOrmEntity)
  @JoinColumn({ name: 'nivel_riesgo_propuesto_id' })
  proposedRiskLevel?: RiskLevelOrmEntity;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'ruta_informe_pdf', length: 500, nullable: true })
  reportPath?: string;

  @CreateDateColumn({ name: 'fecha_asignacion', type: 'timestamp' })
  assignedAt!: Date;

  @Column({ name: 'fecha_envio', type: 'timestamp', nullable: true })
  submittedAt?: Date;
}

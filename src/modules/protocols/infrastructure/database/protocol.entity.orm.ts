import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { StudyTypeOrmEntity } from './study-type.entity.orm';
import { RiskLevelOrmEntity } from './risk-level.entity.orm';

@Entity({ name: 'protocolos', schema: 'public' })
export class ProtocolOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo_ceish', unique: true, length: 50 })
  ceishCode!: string;

  @Column({ name: 'titulo', length: 500, nullable: true })
  title?: string;

  @ManyToOne(() => StudyTypeOrmEntity)
  @JoinColumn({ name: 'tipo_estudio_id' })
  studyType?: StudyTypeOrmEntity;

  @Column({ name: 'tipo_estudio_id', nullable: true })
  studyTypeId?: number;

  @ManyToOne(() => RiskLevelOrmEntity)
  @JoinColumn({ name: 'nivel_riesgo_id' })
  riskLevel?: RiskLevelOrmEntity;

  @Column({ name: 'nivel_riesgo_id', nullable: true })
  riskLevelId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'investigador_principal_id' })
  principalInvestigator!: UserOrmEntity;

  @Column({ name: 'investigador_principal_id' })
  principalInvestigatorId!: number;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  @Column({ name: 'fecha_recepcion', type: 'date', nullable: true })
  receptionDate?: Date;

  @Column({ name: 'fecha_aprobacion', type: 'date', nullable: true })
  approvalDate?: Date;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  expirationDate?: Date;

  @Column({ name: 'fecha_finalizacion', type: 'date', nullable: true })
  completionDate?: Date;

  @Column({ name: 'duracion_estudio_meses', nullable: true })
  studyDurationMonths?: number;

  @Column({ name: 'poblacion_vulnerable', default: false })
  isVulnerablePopulation!: boolean;

  @Column({ name: 'utiliza_muestras_biologicas', default: false })
  usesBiologicalSamples!: boolean;

  @Column({ name: 'multicentrico', default: false })
  isMulticentric!: boolean;

  @Column({ name: 'version_actual', default: 1 })
  currentVersion!: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  updatedAt!: Date;
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { StudyTypeOrmEntity } from './study-type.entity.orm';
import { RiskLevelOrmEntity } from './risk-level.entity.orm';
import { GeographicCoverage } from '../../domain/enums/geographic-coverage.enum';
import { ReceptionStatus } from '../../domain/enums/reception-status.enum';
import { ReviewType } from '../../domain/enums/review-type.enum';
import { InvestigatorOrmEntity } from './investigator.entity.orm';
import { ParticipatingInstitutionOrmEntity } from './participating-institution.entity.orm';
import { ProtocolRequirementOrmEntity } from './protocol-requirement.entity.orm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'protocolos', schema: 'public' })
export class ProtocolOrmEntity extends BaseOrmEntity {
  @Column({ name: 'codigo_ceish', unique: true, length: 100, nullable: true })
  ceishCode?: string;

  @Column({ name: 'titulo', length: 1000, nullable: true })
  title?: string;

  @Column({ name: 'version', length: 20, default: '1.0' })
  version!: string;

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

  @Column({ name: 'fecha_recepcion', type: 'timestamp', nullable: true })
  receptionDate?: Date;

  @Column({ name: 'monto_financiamiento', type: 'decimal', precision: 12, scale: 2, nullable: true })
  financingAmount?: number;

  @Column({ name: 'fuentes_financiamiento', type: 'text', nullable: true })
  financingSources?: string;

  @Column({ name: 'fecha_estimada_inicio', type: 'date', nullable: true })
  estimatedStartDate?: Date;

  @Column({ name: 'fecha_estimada_fin', type: 'date', nullable: true })
  estimatedEndDate?: Date;

  @Column({ name: 'fecha_aprobacion', type: 'date', nullable: true })
  approvalDate?: Date;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  expirationDate?: Date;

  @Column({ name: 'fecha_finalizacion', type: 'date', nullable: true })
  completionDate?: Date;

  @Column({ name: 'fecha_limite_renovacion', type: 'date', nullable: true })
  renewalRequestDeadline?: Date;

  @Column({
    name: 'tipo_revision',
    type: 'enum',
    enum: ReviewType,
    nullable: true,
  })
  reviewType?: ReviewType;

  @Column({
    name: 'cobertura_geografica',
    type: 'enum',
    enum: GeographicCoverage,
    nullable: true,
  })
  geographicCoverage?: GeographicCoverage;

  @Column({ name: 'duracion_estudio_meses', nullable: true })
  studyDurationMonths?: number;

  @Column({
    name: 'estado_recepcion',
    type: 'enum',
    enum: ReceptionStatus,
    default: ReceptionStatus.PENDIENTE_SUBSANACION,
  })
  receptionStatus!: ReceptionStatus;

  @Column({ name: 'requisitos_faltantes', type: 'text', nullable: true })
  missingRequirements?: string;

  @Column({ name: 'fecha_limite_subsanacion', type: 'timestamp', nullable: true })
  submissionDeadline?: Date;

  @Column({ name: 'fecha_limite_respuesta', type: 'timestamp', nullable: true })
  responseDeadline?: Date;

  @Column({ name: 'notificado_presidente', default: false })
  isPresidentNotified!: boolean;

  @Column({ name: 'fecha_notificacion_presidente', type: 'timestamp', nullable: true })
  presidentNotificationDate?: Date;

  @Column({ name: 'notificado_investigador', default: false })
  isInvestigatorNotified!: boolean;

  @Column({ name: 'fecha_notificacion_investigador', type: 'timestamp', nullable: true })
  investigatorNotificationDate?: Date;

  @Column({ name: 'certificado_recepcion_emitido', default: false })
  isReceptionCertificateIssued!: boolean;

  @Column({ name: 'fecha_emision_certificado', type: 'timestamp', nullable: true })
  receptionCertificateDate?: Date;

  @Column({ name: 'poblacion_vulnerable', default: false })
  isVulnerablePopulation!: boolean;

  @Column({ name: 'utiliza_muestras_biologicas', default: false })
  usesBiologicalSamples!: boolean;

  @Column({ name: 'multicentrico', default: false })
  isMulticentric!: boolean;

  @Column({ name: 'version_actual', default: 1 })
  currentVersion!: number;

  @OneToMany(() => InvestigatorOrmEntity, (investigator) => investigator.protocol, { cascade: true })
  investigators!: InvestigatorOrmEntity[];

  @OneToMany(() => ParticipatingInstitutionOrmEntity, (institution) => institution.protocol, { cascade: true })
  institutions!: ParticipatingInstitutionOrmEntity[];

  @OneToMany(() => ProtocolRequirementOrmEntity, (requirement) => requirement.protocol, { cascade: true })
  checklist!: ProtocolRequirementOrmEntity[];
}

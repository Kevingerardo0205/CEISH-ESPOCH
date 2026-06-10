import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
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
import { ReceptionOrmEntity } from '../../../reception/infrastructure/database/reception.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';

@Entity({ name: 'protocolos', schema: 'public' })
export class ProtocolOrmEntity extends BaseOrmEntity {
  @Column({ name: 'version_actual_id', nullable: true })
  versionActualId?: number;

  @ManyToOne(() => ProtocolVersionOrmEntity)
  @JoinColumn({ name: 'version_actual_id' })
  activeVersion?: ProtocolVersionOrmEntity;

  get reception(): ReceptionOrmEntity | undefined {
    return this.activeVersion?.reception;
  }

  @Column({ name: 'codigo_ceish', length: 50, nullable: true, unique: true })
  ceishCode?: string;

  @Column({ name: 'titulo', length: 1000, nullable: true })
  title?: string;

  get version(): string {
    return `${this.currentVersion || 1}.0`;
  }

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

  /**
   * @deprecated Usar investigadorPrincipalInvId (InvestigatorOrmEntity) para la fuente de verdad.
   */
  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'investigador_principal_id' })
  principalInvestigator!: UserOrmEntity;

  /**
   * @deprecated Usar investigadorPrincipalInvId para la fuente de verdad.
   */
  @Column({ name: 'investigador_principal_id' })
  principalInvestigatorId!: number;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  get receptionDate(): Date | undefined {
    return this.reception?.receptionDate;
  }

  @Column({
    name: 'monto_financiamiento',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  financingAmount?: number;

  @Column({ name: 'fuentes_financiamiento', type: 'text', nullable: true })
  financingSources?: string;

  // E5: Datos estructurados del Patrocinador
  @Column({ name: 'patrocinador_ruc', length: 20, nullable: true })
  sponsorRuc?: string;

  @Column({
    name: 'patrocinador_telefono_institucional',
    length: 30,
    nullable: true,
  })
  sponsorPhone?: string;

  @Column({ name: 'patrocinador_direccion', length: 500, nullable: true })
  sponsorAddress?: string;

  @Column({ name: 'patrocinador_pagina_web', length: 200, nullable: true })
  sponsorWeb?: string;

  @Column({ name: 'patrocinador_organo_ejecutor', length: 200, nullable: true })
  sponsorExecutingAgency?: string;

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

  get receptionStatus(): ReceptionStatus {
    const sId = this.reception?.statusId;
    if (sId === 10) return ReceptionStatus.COMPLETO;
    if (sId === 11) return ReceptionStatus.INCOMPLETO;
    if (sId === 15) return ReceptionStatus.EN_REVISION_SECRETARIA;
    if (sId === 12) return 'ARCHIVADO' as any;
    return ReceptionStatus.PENDIENTE_SUBSANACION;
  }

  get missingRequirements(): string | undefined {
    return this.reception?.missingItemsList;
  }

  get submissionDeadline(): Date | undefined {
    return this.reception?.completionDeadlineDate;
  }

  get responseDeadline(): Date | undefined {
    if (!this.reception?.receptionDate || !this.reviewType) return undefined;
    const days = this.reviewType === ReviewType.EXPEDITA ? 45 : 60;
    const result = new Date(this.reception.receptionDate);
    let count = 0;
    while (count < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
    }
    return result;
  }

  get isPresidentNotified(): boolean {
    return false;
  }

  get presidentNotificationDate(): Date | undefined {
    return undefined;
  }

  get isInvestigatorNotified(): boolean {
    return false;
  }

  get investigatorNotificationDate(): Date | undefined {
    return undefined;
  }

  get isReceptionCertificateIssued(): boolean {
    return this.reception?.isCertificateIssued || false;
  }

  get receptionCertificateDate(): Date | undefined {
    return this.reception?.certificateDate;
  }

  @Column({ name: 'poblacion_vulnerable', default: false })
  isVulnerablePopulation!: boolean;

  @Column({ name: 'utiliza_muestras_biologicas', default: false })
  usesBiologicalSamples!: boolean;

  @Column({ name: 'multicentrico', default: false })
  isMulticentric!: boolean;

  @Column({ name: 'tiene_instituciones_externas', default: false })
  hasExternalInstitutions!: boolean;

  @Column({ name: 'poblacion_indigena', default: false })
  isIndigenousPopulation!: boolean;

  // E2: Declaración Jurada
  @Column({ name: 'declaracion_no_iniciado', default: false })
  isAffidavitAccepted!: boolean;

  @Column({
    name: 'fecha_declaracion_no_iniciado',
    type: 'timestamp',
    nullable: true,
  })
  affidavitDate?: Date;

  @Column({ name: 'ip_declaracion_no_iniciado', length: 45, nullable: true })
  affidavitIp?: string;

  // E2: Aceptación de sometimiento a tiempos y reglamentos del comité
  @Column({ name: 'sometimiento_tiempos_aceptado', default: false })
  isTimelineTermsAccepted!: boolean;

  @Column({
    name: 'fecha_sometimiento_tiempos',
    type: 'timestamp',
    nullable: true,
  })
  timelineTermsAcceptedAt?: Date;

  @Column({ name: 'ip_sometimiento_tiempos', length: 45, nullable: true })
  timelineTermsAcceptedIp?: string;

  @OneToMany(() => ProtocolVersionOrmEntity, (version) => version.protocol, {
    cascade: true,
  })
  versions!: ProtocolVersionOrmEntity[];

  get currentVersion(): number {
    if (this.versions && this.versions.length > 0) {
      return Math.max(...this.versions.map((v) => v.versionNumber || 1));
    }
    return 1;
  }

  @Column({ name: 'nivel_riesgo_confirmado', default: false })
  isRiskLevelDesignated!: boolean;

  @OneToMany(
    () => InvestigatorOrmEntity,
    (investigator) => investigator.protocol,
    { cascade: true },
  )
  investigators!: InvestigatorOrmEntity[];

  @OneToMany(
    () => ParticipatingInstitutionOrmEntity,
    (institution) => institution.protocol,
    { cascade: true },
  )
  institutions!: ParticipatingInstitutionOrmEntity[];

  @OneToMany(
    () => ProtocolRequirementOrmEntity,
    (requirement) => requirement.protocol,
    { cascade: true },
  )
  checklist!: ProtocolRequirementOrmEntity[];
}

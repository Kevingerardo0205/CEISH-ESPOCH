import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';

@Entity({ name: 'recepciones', schema: 'recepcion' })
export class ReceptionOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'version_id', unique: true })
  versionId!: number;

  @OneToOne(() => ProtocolVersionOrmEntity, (version) => version.reception)
  @JoinColumn({ name: 'version_id' })
  version!: Relation<ProtocolVersionOrmEntity>;

  get protocolId(): number {
    return this.version?.protocolId;
  }

  @Column({
    name: 'fecha_recepcion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  receptionDate!: Date;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  @Column({ name: 'tiene_faltantes', default: false })
  hasMissingItems!: boolean;

  @Column({ name: 'lista_faltantes', type: 'text', nullable: true })
  missingItemsList?: string;

  @Column({
    name: 'fecha_notificacion_faltantes',
    type: 'timestamp',
    nullable: true,
  })
  missingItemsNotificationDate?: Date;

  @Column({ name: 'plazo_completar_dias', default: 15 })
  completionDeadlineDays!: number;

  @Column({ name: 'fecha_limite_completar', type: 'date', nullable: true })
  completionDeadlineDate?: Date;

  @Column({ name: 'constancia_emitida', default: false })
  isCertificateIssued!: boolean;

  @Column({ name: 'fecha_constancia', type: 'timestamp', nullable: true })
  certificateDate?: Date;

  @Column({ name: 'plazo_respuesta_dias', nullable: true })
  responseDeadlineDays?: number;

  get generatedCeishCode(): string | undefined {
    return this.version?.protocol?.ceishCode;
  }

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'creado_por', nullable: true })
  createdByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'creado_por' })
  createdBy?: UserOrmEntity;
}

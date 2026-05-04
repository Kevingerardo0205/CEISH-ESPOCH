import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

@Entity({ name: 'recepciones', schema: 'recepcion' })
export class ReceptionOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'protocolo_id', unique: true })
  protocolId!: number;

  @ManyToOne(() => ProtocolOrmEntity)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: ProtocolOrmEntity;

  @Column({ name: 'fecha_recepcion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  receptionDate!: Date;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  @Column({ name: 'tiene_faltantes', default: false })
  hasMissingItems!: boolean;

  @Column({ name: 'lista_faltantes', type: 'text', nullable: true })
  missingItemsList?: string;

  @Column({ name: 'fecha_notificacion_faltantes', type: 'timestamp', nullable: true })
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

  @Column({ name: 'codigo_ceish_generado', length: 50, nullable: true })
  generatedCeishCode?: string;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'creado_por', nullable: true })
  createdByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'creado_por' })
  createdBy?: UserOrmEntity;
}

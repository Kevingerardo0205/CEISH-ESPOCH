import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolVersionOrmEntity } from '../../../evaluations/infrastructure/database/protocol-version.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

@Entity({ name: 'resoluciones', schema: 'resolucion' })
export class ResolutionOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;

  @ManyToOne(() => ProtocolOrmEntity)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: ProtocolOrmEntity;

  @Column({ name: 'version_id' })
  versionId!: number;

  @ManyToOne(() => ProtocolVersionOrmEntity)
  @JoinColumn({ name: 'version_id' })
  version!: ProtocolVersionOrmEntity;

  @Column({ name: 'tipo_resolucion_id', nullable: true })
  resolutionTypeId?: number;

  @CreateDateColumn({ name: 'fecha_emision', type: 'timestamp' })
  issuedAt!: Date;

  @Column({
    name: 'fecha_notificacion_investigador',
    type: 'timestamp',
    nullable: true,
  })
  investigatorNotificationDate?: Date;

  @Column({ name: 'vigencia_aprobacion_anios', default: 1 })
  validityYears!: number;

  @Column({ name: 'periodo_seguimiento_dias', nullable: true })
  followUpPeriodDays?: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'archivo_carta_pdf', length: 500, nullable: true })
  letterFilePath?: string;

  @Column({ name: 'creado_por', nullable: true })
  createdByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'creado_por' })
  createdBy?: UserOrmEntity;
}

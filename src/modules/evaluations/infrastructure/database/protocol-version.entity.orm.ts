import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { ResolutionTypeOrmEntity } from '../../../resolutions/infrastructure/database/resolution-type.entity.orm';
import { ReceptionOrmEntity } from '../../../reception/infrastructure/database/reception.entity.orm';

@Entity({ name: 'versiones_protocolo', schema: 'public' })
export class ProtocolVersionOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;

  @ManyToOne(() => ProtocolOrmEntity, (protocol) => protocol.versions)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: ProtocolOrmEntity;

  @Column({ name: 'numero_version', nullable: true })
  versionNumber?: number;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  @Column({ name: 'fecha_envio', type: 'timestamp', nullable: true })
  submissionDate?: Date;

  @Column({ name: 'fecha_resolucion', type: 'timestamp', nullable: true })
  resolutionDate?: Date;

  @Column({ name: 'tipo_resolucion_id', nullable: true })
  resolutionTypeId?: number;

  @ManyToOne(() => ResolutionTypeOrmEntity)
  @JoinColumn({ name: 'tipo_resolucion_id' })
  resolutionType?: ResolutionTypeOrmEntity;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'plazo_subsanacion_dias', default: 30 })
  correctionDeadlineDays!: number;

  @Column({ name: 'fecha_limite_subsanacion', type: 'date', nullable: true })
  correctionDeadlineDate?: Date;

  @Column({ name: 'validado_por', nullable: true })
  validatedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'validado_por' })
  validatedBy?: UserOrmEntity;

  @OneToOne(() => ReceptionOrmEntity, (reception) => reception.version)
  reception?: ReceptionOrmEntity;
}

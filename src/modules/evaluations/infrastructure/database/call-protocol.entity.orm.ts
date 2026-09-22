import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';
import { CallOrmEntity } from './call.entity.orm';
import { ProtocolVersionOrmEntity } from './protocol-version.entity.orm';

@Entity({ name: 'convocatoria_protocolos', schema: 'evaluacion' })
export class CallProtocolOrmEntity extends BaseOrmEntity {
  @Column({ name: 'convocatoria_id' })
  callId!: number;

  @ManyToOne(() => CallOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'convocatoria_id' })
  call!: CallOrmEntity;

  @Column({ name: 'version_protocolo_id' })
  protocolVersionId!: number;

  @ManyToOne(() => ProtocolVersionOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'version_protocolo_id' })
  protocolVersion!: ProtocolVersionOrmEntity;

  @Column({ name: 'orden' })
  order!: number;

  @Column({ name: 'fecha_reunion', type: 'date' })
  meetingDate!: Date;

  @Column({ name: 'fecha_entrega_evaluacion', type: 'date' })
  evaluationDeadline!: Date;

  @Column({ name: 'resultado_id', nullable: true })
  resultId?: number; // e.g. 17 (APROBADO), 25 (APROBADO_CON_CONDICION), 18 (RECHAZADO/NO_APROBADO)
}

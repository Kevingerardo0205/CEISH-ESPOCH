import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { ProtocolOrmEntity } from './protocol.entity.orm';
import { RequirementStatus } from '../../domain/enums/requirement-status.enum';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'protocolo_requisitos', schema: 'public' })
export class ProtocolRequirementOrmEntity extends BaseOrmEntity {
  @Column({ name: 'codigo_requisito', length: 50 })
  requirementCode!: string;

  @Column({ name: 'nombre_requisito', length: 255 })
  requirementName!: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: RequirementStatus,
    default: RequirementStatus.NO_PRESENTADO,
  })
  status!: RequirementStatus;

  @Column({ name: 'numero_paginas', default: 0 })
  pageCount!: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @ManyToOne(() => ProtocolOrmEntity, (protocol) => protocol.checklist)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: Relation<ProtocolOrmEntity>;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;
}

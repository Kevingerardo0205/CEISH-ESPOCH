import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { ProtocolOrmEntity } from './protocol.entity.orm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'protocolo_instituciones', schema: 'public' })
export class ParticipatingInstitutionOrmEntity extends BaseOrmEntity {
  @Column({ name: 'nombre', length: 255 })
  name!: string;

  @Column({ name: 'tipo', type: 'enum', enum: ['PUBLIC', 'PRIVATE'] })
  type!: 'PUBLIC' | 'PRIVATE';

  @Column({ name: 'direccion', length: 500 })
  address!: string;

  @Column({ name: 'persona_contacto', length: 255 })
  contactPerson!: string;

  @Column({ name: 'email_contacto', length: 100, nullable: true })
  contactEmail?: string;

  @Column({ name: 'telefono_contacto', length: 20, nullable: true })
  contactPhone?: string;

  @Column({ name: 'tiene_carta_interes', default: false })
  hasInterestLetter!: boolean;

  @ManyToOne(() => ProtocolOrmEntity, (protocol) => protocol.institutions)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: Relation<ProtocolOrmEntity>;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;
}

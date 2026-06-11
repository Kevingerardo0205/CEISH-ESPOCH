import { Entity, Column, ManyToOne, JoinColumn, Relation } from 'typeorm';
import { ProtocolOrmEntity } from './protocol.entity.orm';
import { InvestigatorRole } from '../../domain/enums/investigator-role.enum';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'protocolo_investigadores', schema: 'public' })
export class InvestigatorOrmEntity extends BaseOrmEntity {
  @Column({ name: 'nombre_completo', length: 255 })
  fullName!: string;

  @Column({ name: 'identificacion', length: 20 })
  identification!: string;

  @Column({ name: 'cargo', length: 100 })
  position!: string;

  @Column({ name: 'institucion', length: 255 })
  institution!: string;

  @Column({ name: 'email', length: 100 })
  email!: string;

  @Column({ name: 'telefono', length: 20 })
  phone!: string;

  @Column({ name: 'formacion_academica', type: 'text' })
  education!: string;

  @Column({
    name: 'rol',
    type: 'enum',
    enum: InvestigatorRole,
    default: InvestigatorRole.CO_INVESTIGADOR,
  })
  role!: InvestigatorRole;

  @ManyToOne(() => ProtocolOrmEntity, (protocol) => protocol.investigators)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: Relation<ProtocolOrmEntity>;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;

  @ManyToOne(() => UserOrmEntity, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  user?: UserOrmEntity;

  @Column({ name: 'usuario_id', nullable: true })
  userId?: number;
}

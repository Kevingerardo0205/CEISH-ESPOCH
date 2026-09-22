import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { CallOrmEntity } from './call.entity.orm';

@Entity({ name: 'sesiones', schema: 'evaluacion' })
export class SessionOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'tipo_sesion', length: 50, nullable: true })
  sessionType?: string;

  @Column({ name: 'quorum_alcanzado', default: false })
  isQuorumReached!: boolean;

  @Column({ nullable: true })
  attendeesCount?: number;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  @Column({ name: 'convocatoria_id', nullable: true })
  callId?: number;

  @ManyToOne(() => CallOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'convocatoria_id' })
  call?: CallOrmEntity;

  @Column({ name: 'creado_por', nullable: true })
  createdByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'creado_por' })
  createdBy?: UserOrmEntity;
}

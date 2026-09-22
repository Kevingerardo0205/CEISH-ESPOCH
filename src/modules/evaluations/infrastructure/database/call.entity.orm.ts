import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';
import { PlaceOrmEntity } from './place.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

@Entity({ name: 'convocatorias', schema: 'evaluacion' })
export class CallOrmEntity extends BaseOrmEntity {
  @Column({ name: 'codigo', unique: true, length: 50 })
  code!: string;

  @Column({ name: 'fecha', type: 'date' })
  date!: Date;

  @Column({ name: 'hora', type: 'time' })
  time!: string;

  @Column({ name: 'lugar_id', nullable: true })
  placeId?: number;

  @ManyToOne(() => PlaceOrmEntity, { nullable: true })
  @JoinColumn({ name: 'lugar_id' })
  place?: PlaceOrmEntity;

  @Column({ name: 'tipo_sesion', length: 50 })
  sessionType!: string; // 'ORDINARIA' o 'EXTRAORDINARIA'

  @Column({ name: 'estado_id' })
  statusId!: number; // e.g. 22 (CREADA), 23 (ENVIADA), 24 (FINALIZADA)

  @Column({ name: 'resumen_agenda', type: 'text', nullable: true })
  agendaSummary?: string;

  @Column({ name: 'creado_por', nullable: true })
  createdByUserId?: number;

  @ManyToOne(() => UserOrmEntity, { nullable: true })
  @JoinColumn({ name: 'creado_por' })
  createdBy?: UserOrmEntity;
}

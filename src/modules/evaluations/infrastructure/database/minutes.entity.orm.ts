import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SessionOrmEntity } from './session.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

@Entity({ name: 'actas', schema: 'evaluacion' })
export class MinutesOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'sesion_id' })
  sessionId!: number;

  @ManyToOne(() => SessionOrmEntity)
  @JoinColumn({ name: 'sesion_id' })
  session!: SessionOrmEntity;

  @Column({ name: 'numero_acta', nullable: true })
  minutesNumber?: number;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ name: 'resumen_agenda', type: 'text', nullable: true })
  agendaSummary?: string;

  @Column({ type: 'text', nullable: true })
  deliberations?: string;

  @Column({ name: 'decisiones_tomadas', type: 'jsonb', nullable: true })
  decisionsTaken?: any;

  @Column({ type: 'jsonb', nullable: true })
  voting?: any;

  @Column({ name: 'lista_asistentes', type: 'jsonb', nullable: true })
  attendeesList?: any;

  @Column({
    name: 'conflictos_interes_registrados',
    type: 'jsonb',
    nullable: true,
  })
  conflictsOfInterest?: any;

  @Column({ name: 'consultores_externos', type: 'jsonb', nullable: true })
  externalConsultants?: any;

  @Column({ name: 'archivo_acta_pdf', length: 500, nullable: true })
  minutesFilePath?: string;

  @Column({ name: 'firmada_por_presidente', default: false })
  signedByPresident!: boolean;

  @Column({ name: 'firmada_por_secretario', default: false })
  signedBySecretary!: boolean;

  @CreateDateColumn({ name: 'fecha_elaboracion', type: 'timestamp' })
  createdAt!: Date;

  @Column({ name: 'creado_por', nullable: true })
  createdByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'creado_por' })
  createdBy?: UserOrmEntity;
}

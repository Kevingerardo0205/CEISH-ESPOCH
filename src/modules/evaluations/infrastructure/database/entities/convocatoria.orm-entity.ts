import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LugarOrmEntity } from './lugar.orm-entity';

export enum SessionType {
  ORDINARIA = 'ORDINARIA',
  EXTRAORDINARIA = 'EXTRAORDINARIA',
}

export enum ConvocatoriaStatus {
  PROGRAMADA = 'PROGRAMADA',
  EN_CURSO = 'EN_CURSO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

@Entity({ schema: 'evaluacion', name: 'convocatorias' })
export class ConvocatoriaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'numero_convocatoria',
    type: 'varchar',
    length: 20,
    unique: true,
    nullable: false,
  })
  numeroConvocatoria: string;

  @Column({ name: 'anio_lectivo', type: 'integer', nullable: true })
  anioLectivo: number;

  @Column({
    name: 'tipo_session',
    type: 'enum',
    enum: SessionType,
    default: SessionType.ORDINARIA,
  })
  tipoSession: SessionType;

  @Column({ name: 'fecha_reunion', type: 'timestamptz', nullable: true })
  fechaReunion: Date;

  @Column({
    name: 'fecha_entrega_evaluacion',
    type: 'timestamptz',
    nullable: true,
  })
  fechaEntregaEvaluacion: Date;

  @Column({ name: 'lugar_id', type: 'uuid', nullable: true })
  lugarId?: string;

  @ManyToOne(() => LugarOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lugar_id' })
  lugar?: LugarOrmEntity;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ConvocatoriaStatus,
    default: ConvocatoriaStatus.PROGRAMADA,
  })
  estado: ConvocatoriaStatus;

  @Column({ name: 'orden_dia_pdf_path', type: 'varchar', nullable: true })
  ordenDiaPdfPath?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

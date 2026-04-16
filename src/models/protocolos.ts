import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from './usuarios';
import { TipoEstudio } from './tipos_estudio';
import { NivelRiesgo } from './niveles_riesgo';

@Entity({ name: 'protocolos', schema: 'public' })
export class Protocolo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo_ceish', unique: true, length: 50 })
  codigoCeish!: string;

  @Column({ length: 500, nullable: true })
  titulo?: string;

  @ManyToOne(() => TipoEstudio)
  @JoinColumn({ name: 'tipo_estudio_id' })
  tipoEstudio?: TipoEstudio;

  @Column({ name: 'tipo_estudio_id', nullable: true })
  tipoEstudioId?: number;

  @ManyToOne(() => NivelRiesgo)
  @JoinColumn({ name: 'nivel_riesgo_id' })
  nivelRiesgo?: NivelRiesgo;

  @Column({ name: 'nivel_riesgo_id', nullable: true })
  nivelRiesgoId?: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'investigador_principal_id' })
  investigadorPrincipal!: Usuario;

  @Column({ name: 'investigador_principal_id' })
  investigadorPrincipalId!: number;

  @Column({ name: 'estado_id', nullable: true })
  estadoId?: number;

  @Column({ name: 'fecha_recepcion', type: 'date', nullable: true })
  fechaRecepcion?: Date;

  @Column({ name: 'fecha_aprobacion', type: 'date', nullable: true })
  fechaAprobacion?: Date;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento?: Date;

  @Column({ name: 'fecha_finalizacion', type: 'date', nullable: true })
  fechaFinalizacion?: Date;

  @Column({ name: 'duracion_estudio_meses', nullable: true })
  duracionEstudioMeses?: number;

  @Column({ name: 'poblacion_vulnerable', default: false })
  poblacionVulnerable!: boolean;

  @Column({ name: 'utiliza_muestras_biologicas', default: false })
  utilizaMuestrasBiologicas!: boolean;

  @Column({ name: 'multicentrico', default: false })
  multicentrico!: boolean;

  @Column({ name: 'version_actual', default: 1 })
  versionActual!: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  creadoEn!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  actualizadoEn!: Date;
}

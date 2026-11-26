import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * TSK-015-N09 (spec-003 RF-17.4 v1.6.6): una fila por versión de la carta firmada de una
 * convocatoria-protocolo. Tabla `resolucion.cartas_firmadas` (migración 2000000000004).
 */
@Entity({ name: 'cartas_firmadas', schema: 'resolucion' })
export class CartaFirmadaOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'convocatoria_protocolo_id', type: 'uuid' })
  convocatoriaProtocoloId!: string;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;

  @Column({ name: 'version_id' })
  versionId!: number;

  @Column({ name: 'numero_version' })
  numeroVersion!: number;

  @Column({ name: 'resultado', length: 30 })
  resultado!: string;

  @Column({ name: 'anexo_codigo', length: 50 })
  anexoCodigo!: string;

  @Column({ name: 'clave_archivo', length: 500 })
  claveArchivo!: string;

  @Column({ name: 'vigente', default: true })
  vigente!: boolean;

  @Column({ name: 'motivo_reemplazo', type: 'text', nullable: true })
  motivoReemplazo?: string | null;

  @Column({ name: 'subido_por' })
  subidoPor!: number;

  @CreateDateColumn({ name: 'subido_en', type: 'timestamptz' })
  subidoEn!: Date;
}

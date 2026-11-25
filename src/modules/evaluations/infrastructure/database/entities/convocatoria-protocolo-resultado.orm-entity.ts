import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Historial append-only del resultado del pleno (TSK-015-N08, spec-003 RF-17.1).
 * Cada registro o corrección añade una fila; la aplicación nunca hace UPDATE ni DELETE.
 * No extiende BaseOrmEntity: la tabla no tiene updated_at y su id es BIGSERIAL.
 */
@Entity({ schema: 'evaluacion', name: 'convocatoria_protocolo_resultados' })
export class ConvocatoriaProtocoloResultadoOrmEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'convocatoria_protocolo_id', type: 'uuid' })
  convocatoriaProtocoloId: string;

  @Column({ name: 'resultado', type: 'varchar' })
  resultado: string;

  @Column({ name: 'motivo', type: 'text', nullable: true })
  motivo?: string | null;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ name: 'motivo_correccion', type: 'text', nullable: true })
  motivoCorreccion?: string | null;

  @Column({ name: 'registrado_por', type: 'integer' })
  registradoPor: number;

  @CreateDateColumn({ name: 'registrado_en', type: 'timestamptz' })
  registradoEn: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConvocatoriaOrmEntity } from './convocatoria.orm-entity';
import { ProtocolOrmEntity } from '../../../../protocols/infrastructure/database/protocol.entity.orm';
import { ProtocolVersionOrmEntity } from '../protocol-version.entity.orm';
import { AgendaItemType } from '../../../../../shared/enums/agenda-section.enum';

@Entity({ schema: 'evaluacion', name: 'convocatoria_protocolos' })
export class ConvocatoriaProtocoloOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'convocatoria_id', type: 'uuid' })
  convocatoriaId: string;

  @Column({
    name: 'tipo_punto_agenda',
    type: 'varchar',
    length: 50,
    default: AgendaItemType.EVALUACION_INICIAL,
  })
  tipoPuntoAgenda: AgendaItemType;

  @Column({ name: 'protocolo_id', type: 'integer', nullable: true })
  protocoloId?: number | null;

  @ManyToOne(() => ProtocolOrmEntity, { nullable: true })
  @JoinColumn({ name: 'protocolo_id' })
  protocolo?: ProtocolOrmEntity;

  @Column({ name: 'version_id', type: 'integer', nullable: true })
  versionId?: number | null;

  @ManyToOne(() => ProtocolVersionOrmEntity, { nullable: true })
  @JoinColumn({ name: 'version_id' })
  version?: ProtocolVersionOrmEntity;

  @Column({ name: 'informe_seguimiento_id', type: 'integer', nullable: true })
  informeSeguimientoId?: number | null;

  @Column({ name: 'orden', type: 'integer' })
  orden: number;

  @Column({
    name: 'fecha_plazo_normativo',
    type: 'timestamptz',
    nullable: true,
  })
  fechaPlazoNormativo?: Date | null;

  @Column({ name: 'dictamen_resultado', type: 'varchar', nullable: true })
  dictamenResultado?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => ConvocatoriaOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'convocatoria_id' })
  convocatoria?: ConvocatoriaOrmEntity;
}

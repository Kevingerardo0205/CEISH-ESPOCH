import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'documentos', schema: 'public' })
export class DocumentOrmEntity extends BaseOrmEntity {
  @Column({ name: 'nombre_archivo', length: 255 })
  fileName!: string;

  @Column({ name: 'tipo_mimetype', length: 100 })
  mimeType!: string;

  @Column({ name: 'ruta_almacenamiento', length: 500 })
  storagePath!: string;

  @Column({ name: 'tamano_bytes', type: 'bigint' })
  sizeBytes!: number;

  @Column({ name: 'hash_verificacion', length: 64, nullable: true })
  hash!: string;

  @Column({ name: 'version', default: 1 })
  version!: number;

  @ManyToOne(() => ProtocolOrmEntity)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: ProtocolOrmEntity;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

@Entity({ name: 'documentos', schema: 'recepcion' })
export class ReceptionDocumentOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;

  @ManyToOne(() => ProtocolOrmEntity)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: ProtocolOrmEntity;

  @Column({ name: 'nombre_archivo', length: 200 })
  fileName!: string;

  @Column({ name: 'ruta', length: 500 })
  path!: string;

  @Column({ name: 'numero_hojas', nullable: true })
  pageCount?: number;

  @Column({ name: 'hash_checksum', length: 64, nullable: true })
  hash!: string;

  @Column({ name: 'tamaño_bytes', type: 'bigint', nullable: true })
  sizeBytes?: string;

  @Column({ name: 'es_confidencial', default: true })
  isConfidential!: boolean;

  @Column({ name: 'validado_secretaria', default: false })
  isValidatedBySecretary!: boolean;

  @Column({ name: 'subido_por', nullable: true })
  uploadedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'subido_por' })
  uploadedBy?: UserOrmEntity;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;
}

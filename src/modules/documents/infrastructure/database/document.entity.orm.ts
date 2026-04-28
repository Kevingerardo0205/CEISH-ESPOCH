import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProtocolOrmEntity } from '../../../protocols/infrastructure/database/protocol.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { EncryptionTransformer } from '../../../../shared/encryption/encryption.transformer';

@Entity({ name: 'documentos', schema: 'recepcion' })
export class DocumentOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProtocolOrmEntity)
  @JoinColumn({ name: 'protocolo_id' })
  protocol!: ProtocolOrmEntity;

  @Column({ name: 'protocolo_id' })
  protocolId!: number;

  @Column({ 
    name: 'nombre_archivo', 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  fileName: string | null = null;

  @Column({ 
    name: 'ruta',
    type: 'varchar', 
    length: 500, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  path: string | null = null;

  @Column({ name: 'numero_hojas', nullable: true })
  pageCount?: number;

  @Column({ name: 'hash_checksum', length: 64, nullable: true })
  hashChecksum?: string;

  @Column({ name: 'tamaño_bytes', type: 'bigint', nullable: true })
  sizeBytes?: number;

  @Column({ name: 'es_confidencial', default: true })
  isConfidential!: boolean;

  @Column({ name: 'validado_secretaria', default: false })
  isValidatedBySecretary!: boolean;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'subido_por' })
  uploadedBy!: UserOrmEntity;

  @Column({ name: 'subido_por', nullable: true })
  uploadedById?: number;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt!: Date;
}

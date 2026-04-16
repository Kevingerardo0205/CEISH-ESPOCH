import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Protocolo } from './protocolos';
import { Usuario } from './usuarios';
import { EncryptionTransformer } from '../core/encryption/encryption.transformer';

@Entity({ name: 'documentos', schema: 'recepcion' })
export class Documento {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Protocolo)
  @JoinColumn({ name: 'protocolo_id' })
  protocolo!: Protocolo;

  @Column({ name: 'protocolo_id' })
  protocoloId!: number;

  @Column({ 
    name: 'nombre_archivo', 
    type: 'varchar', 
    length: 255, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  nombreArchivo: string | null = null;

  @Column({ 
    type: 'varchar', 
    length: 500, 
    nullable: true, 
    transformer: EncryptionTransformer 
  })
  ruta: string | null = null;

  @Column({ name: 'numero_hojas', nullable: true })
  numeroHojas?: number;

  @Column({ name: 'hash_checksum', length: 64, nullable: true })
  hashChecksum?: string;

  @Column({ name: 'tamaño_bytes', type: 'bigint', nullable: true })
  tamañoBytes?: number;

  @Column({ name: 'es_confidencial', default: true })
  esConfidencial!: boolean;

  @Column({ name: 'validado_secretaria', default: false })
  validadoSecretaria!: boolean;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'subido_por' })
  subidoPor!: Usuario;

  @Column({ name: 'subido_por', nullable: true })
  subidoPorId?: number;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn!: Date;
}

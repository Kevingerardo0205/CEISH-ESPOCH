import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity({ name: 'audit_log', schema: 'sistema' })
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'usuario_id', nullable: true })
  userId?: number;

  @Column({ name: 'accion', length: 50 })
  action!: string;

  @Column({ name: 'tabla', length: 100, nullable: true })
  table?: string;

  @Column({ name: 'registro_id', nullable: true })
  recordId?: number;

  @Column({ name: 'datos_anteriores', type: 'jsonb', nullable: true })
  oldData?: any;

  @Column({ name: 'datos_nuevos', type: 'jsonb', nullable: true })
  newData?: any;

  @Column({ name: 'ip_origen', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ name: 'protocolo_codigo', length: 50, nullable: true })
  protocolCode?: string;

  @CreateDateColumn({ name: 'fecha' })
  createdAt!: Date;
}

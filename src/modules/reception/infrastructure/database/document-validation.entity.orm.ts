import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { DocumentOrmEntity } from '../../../documents/infrastructure/database/document.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';

@Entity({ name: 'validaciones_documento', schema: 'recepcion' })
export class DocumentValidationOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'documento_id' })
  documentId!: number;

  @ManyToOne(() => DocumentOrmEntity)
  @JoinColumn({ name: 'documento_id' })
  document!: Relation<DocumentOrmEntity>;

  @Column({ name: 'estado_id', nullable: true })
  statusId?: number;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observations?: string;

  @Column({ name: 'validado_por', nullable: true })
  validatedByUserId?: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'validado_por' })
  validatedBy?: Relation<UserOrmEntity>;

  @Column({
    name: 'fecha_validacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  validationDate!: Date;
}

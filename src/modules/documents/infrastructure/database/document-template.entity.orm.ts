import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'plantillas_documentos', schema: 'sistema' })
export class DocumentTemplateOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo', length: 100, unique: true })
  code!: string;

  @Column({ name: 'nombre', length: 200 })
  name!: string;

  @Column({ name: 'ruta_archivo', length: 500, nullable: true })
  filePath?: string;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  updatedAt!: Date;
}

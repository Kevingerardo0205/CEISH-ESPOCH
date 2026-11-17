import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';
import { TipoDocumentoEstudioOrmEntity } from './tipo-documento-estudio.entity.orm';
import { DocumentTemplateOrmEntity } from '../../../documents/infrastructure/database/document-template.entity.orm';

@Entity({ name: 'tipos_documento', schema: 'catalogos' })
export class TipoDocumentoOrmEntity extends BaseOrmEntity {
  @Column({ name: 'nombre', length: 100 })
  nombre!: string;

  @Column({ name: 'codigo_anexo', length: 20, nullable: true })
  codigoAnexo?: string;

  @Column({ name: 'es_obligatorio', default: true })
  esObligatorio!: boolean;

  @Column({ name: 'es_condicional', default: false })
  esCondicional!: boolean;

  @Column({ name: 'condicion_json', type: 'jsonb', nullable: true })
  condicionJson?: Record<string, unknown> | null;

  @Column({ name: 'tipo_estudio_aplica', type: 'jsonb', nullable: true })
  tipoEstudioAplica?: string[];

  // RF-18.1 a (TSK-001.18): plantilla del requisito (sistema.plantillas_documentos.codigo).
  @Column({
    name: 'codigo_plantilla',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  codigoPlantilla?: string | null;

  @ManyToOne(() => DocumentTemplateOrmEntity, { nullable: true })
  @JoinColumn({ name: 'codigo_plantilla', referencedColumnName: 'code' })
  plantilla?: Relation<DocumentTemplateOrmEntity> | null;

  @OneToMany(() => TipoDocumentoEstudioOrmEntity, (tde) => tde.tipoDocumento)
  estudiosAplica!: Relation<TipoDocumentoEstudioOrmEntity>[];
}

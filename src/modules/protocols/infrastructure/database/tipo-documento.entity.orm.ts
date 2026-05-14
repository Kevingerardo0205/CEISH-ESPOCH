import { Entity, Column, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';
import { TipoDocumentoEstudioOrmEntity } from './tipo-documento-estudio.entity.orm';

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
  condicionJson?: any;

  @Column({ name: 'tipo_estudio_aplica', type: 'jsonb', nullable: true })
  tipoEstudioAplica?: string[];

  @OneToMany(() => TipoDocumentoEstudioOrmEntity, (tde) => tde.tipoDocumento)
  estudiosAplica!: TipoDocumentoEstudioOrmEntity[];
}

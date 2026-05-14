import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { TipoDocumentoOrmEntity } from './tipo-documento.entity.orm';
import { StudyTypeOrmEntity } from './study-type.entity.orm';

@Entity({ name: 'tipo_documento_estudio', schema: 'catalogos' })
export class TipoDocumentoEstudioOrmEntity {
  @PrimaryColumn({ name: 'tipo_documento_id' })
  tipoDocumentoId!: number;

  @PrimaryColumn({ name: 'tipo_estudio_id' })
  tipoEstudioId!: number;

  @Column({ name: 'obligatorio', default: true })
  esObligatorio!: boolean;

  @ManyToOne(() => TipoDocumentoOrmEntity, (td) => td.estudiosAplica)
  @JoinColumn({ name: 'tipo_documento_id' })
  tipoDocumento!: TipoDocumentoOrmEntity;

  @ManyToOne(() => StudyTypeOrmEntity)
  @JoinColumn({ name: 'tipo_estudio_id' })
  studyType!: StudyTypeOrmEntity;
}

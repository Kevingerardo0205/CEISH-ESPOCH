import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ProtocolStage } from '../../domain/enums/protocol-stage.enum';

/** Catálogo de estados (catalogos.estados). Etapa y orden: spec-001 RF-EST.1. */
@Entity({ name: 'estados', schema: 'catalogos' })
export class StatusOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre', length: 50 })
  name!: string;

  @Column({ name: 'categoria', type: 'varchar', length: 50, nullable: true })
  category?: string | null;

  @Column({ name: 'codigo', length: 30 })
  code!: string;

  @Column({ name: 'etapa', type: 'varchar', length: 20, nullable: true })
  stage!: ProtocolStage | null;

  @Column({ name: 'orden', type: 'smallint', nullable: true })
  stageOrder!: number | null;
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { EvaluationOrmEntity } from './evaluation.entity.orm';

export enum EvaluationCriterionType {
  ETICA = 'ETICA',
  METODOLOGIA = 'METODOLOGIA',
  JURIDICA = 'JURIDICA',
}

export enum ChecklistItemState {
  C = 'C', // Cumple
  NC = 'NC', // No cumple
  NA = 'NA', // No aplica
}

@Entity({ name: 'evaluacion_respuestas_detalles', schema: 'evaluacion' })
export class EvaluationResponseDetailOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'evaluacion_id' })
  evaluacionId!: number;

  @ManyToOne(() => EvaluationOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluacion_id' })
  evaluacion!: EvaluationOrmEntity;

  @Column({
    name: 'criterio_tipo',
    type: 'enum',
    enum: EvaluationCriterionType,
  })
  criterioTipo!: EvaluationCriterionType;

  @Column({ name: 'item_codigo', length: 50 })
  itemCodigo!: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ChecklistItemState,
  })
  estado!: ChecklistItemState;

  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;
}

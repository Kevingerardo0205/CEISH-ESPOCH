import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'perfiles_evaluador', schema: 'catalogos' })
export class EvaluatorProfileOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre', unique: true, length: 100 })
  name!: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'obligatorio_para_tipo_estudio', type: 'jsonb', nullable: true })
  mandatoryForStudyTypes?: any;

  @Column({ name: 'orden_prioridad', default: 0 })
  priorityOrder!: number;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;
}

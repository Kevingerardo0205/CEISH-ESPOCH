import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'tipos_estudio', schema: 'catalogos' })
export class TipoEstudio {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 10 })
  codigo!: string;

  @Column({ length: 100 })
  nombre!: string;

  @Column({ name: 'plazo_evaluacion_dias', nullable: true })
  plazoEvaluacionDias?: number;

  @Column({ name: 'requiere_arcsa', nullable: true })
  requiereArcsa?: boolean;

  @Column({ name: 'periodicidad_informe_dias', nullable: true })
  periodicidadInformeDias?: number;

  @Column({ name: 'requiere_informe_inicio', nullable: true })
  requiereInformeInicio?: boolean;

  @Column({ name: 'requiere_informe_final', nullable: true })
  requiereInformeFinal?: boolean;

  @Column({ default: true })
  activo!: boolean;
}

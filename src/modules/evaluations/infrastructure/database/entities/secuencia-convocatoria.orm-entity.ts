import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'evaluacion', name: 'secuencias_convocatoria' })
export class SecuenciaConvocatoriaOrmEntity {
  @PrimaryColumn({ name: 'anio_lectivo', type: 'integer' })
  anioLectivo: number;

  @Column({ name: 'ultimo_secuencial', type: 'integer', default: 0 })
  ultimoSecuencial: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

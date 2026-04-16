import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'niveles_riesgo', schema: 'catalogos' })
export class NivelRiesgo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 20 })
  codigo!: string;

  @Column({ length: 100, nullable: true })
  nombre?: string;

  @Column({ name: 'tipo_revision', length: 50, nullable: true })
  tipoRevision?: string;

  @Column({ default: true })
  activo!: boolean;
}

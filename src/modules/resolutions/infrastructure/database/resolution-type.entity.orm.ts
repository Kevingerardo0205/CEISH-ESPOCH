import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tipos_resolucion', schema: 'catalogos' })
export class ResolutionTypeOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre', length: 50 })
  name!: string;
}

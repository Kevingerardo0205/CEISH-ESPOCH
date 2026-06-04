import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'modalidades_revision', schema: 'catalogos' })
export class RevisionModalityOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'nombre', length: 50 })
  name!: string;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'evaluacion', name: 'lugares' })
export class LugarOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', type: 'varchar', length: 255, nullable: true })
  nombre: string;

  @Column({ name: 'direccion', type: 'varchar', length: 255, nullable: true })
  direccion?: string;

  @Column({ name: 'es_virtual', type: 'boolean', default: false })
  esVirtual: boolean;

  @Column({
    name: 'enlace_reunion',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  enlaceReunion?: string;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

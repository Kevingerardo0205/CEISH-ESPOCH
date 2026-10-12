import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'parametros_sistema', schema: 'sistema' })
export class SystemParamOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  clave: string;

  @Column({ type: 'text' })
  valor: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'tipo_dato' })
  tipoDato: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;
}

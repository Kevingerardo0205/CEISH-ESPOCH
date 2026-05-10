import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'eliminado_en', type: 'timestamp', nullable: true })
  deletedAt?: Date;
}

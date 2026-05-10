import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { EvaluatorProfileOrmEntity } from './evaluator-profile.entity.orm';

@Entity({ name: 'evaluadores_perfil', schema: 'catalogos' })
export class EvaluatorProfileUserOrmEntity {
  @PrimaryColumn({ name: 'usuario_id' })
  userId!: number;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'usuario_id' })
  user!: UserOrmEntity;

  @PrimaryColumn({ name: 'perfil_id' })
  profileId!: number;

  @ManyToOne(() => EvaluatorProfileOrmEntity)
  @JoinColumn({ name: 'perfil_id' })
  profile!: EvaluatorProfileOrmEntity;

  @Column({
    name: 'fecha_asignacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  assignedAt!: Date;

  @Column({ name: 'activo', default: true })
  isActive!: boolean;
}

import { Entity, Column } from 'typeorm';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'ai_assistant_config', schema: 'catalogos' })
export class AiAssistantConfigOrmEntity extends BaseOrmEntity {
  @Column({ name: 'pet_text', type: 'text', nullable: true })
  petText?: string;

  @Column({ name: 'pet_file_name', type: 'varchar', length: 255, nullable: true })
  petFileName?: string;

  @Column({ name: 'allowed_roles', type: 'simple-array', nullable: true })
  allowedRoles?: string[];
}

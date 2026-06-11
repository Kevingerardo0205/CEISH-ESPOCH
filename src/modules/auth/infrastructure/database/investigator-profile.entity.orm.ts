import { Entity, Column, OneToOne, JoinColumn, Relation } from 'typeorm';
import { UserOrmEntity } from './user.entity.orm';
import { EncryptionTransformer } from '../../../../shared/encryption/encryption.transformer';
import { BaseOrmEntity } from '../../../../shared/db/base.entity.orm';

@Entity({ name: 'perfiles_investigador', schema: 'catalogos' })
export class InvestigatorProfileOrmEntity extends BaseOrmEntity {
  @Column({ name: 'usuario_id' })
  userId!: number;

  @OneToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'usuario_id' })
  user!: Relation<UserOrmEntity>;

  @Column({
    name: 'email_personal',
    type: 'varchar',
    length: 255,
    nullable: true,
    transformer: EncryptionTransformer,
  })
  personalEmail: string | null = null;

  @Column({
    name: 'telefono',
    type: 'varchar',
    length: 255,
    nullable: true,
    transformer: EncryptionTransformer,
  })
  phone: string | null = null;

  @Column({
    name: 'institucion_pertenece',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  institution: string | null = null;

  @Column({ name: 'cargo', type: 'varchar', length: 100, nullable: true })
  position: string | null = null;

  @Column({
    name: 'registro_senescyt',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  senescytRegistration: string | null = null;

  @Column({
    name: 'tipo_documento',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  documentType: string | null = null;

  @Column({
    name: 'primer_nombre',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  firstName: string | null = null;

  @Column({
    name: 'segundo_nombre',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  middleName: string | null = null;

  @Column({
    name: 'primer_apellido',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  firstLastName: string | null = null;

  @Column({
    name: 'segundo_apellido',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  secondLastName: string | null = null;

  @Column({
    name: 'nacionalidad',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  nationality: string | null = null;

  @Column({ name: 'acepta_terminos', type: 'boolean', default: false })
  acceptsTerms!: boolean;

  @Column({ name: 'acepta_reglamento', type: 'boolean', default: false })
  acceptsRegulations!: boolean;
}

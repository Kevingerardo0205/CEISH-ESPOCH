import { InvestigatorOrmEntity } from '../../infrastructure/database/investigator.entity.orm';

export class InvestigatorMapper {
  static toResponse(orm: InvestigatorOrmEntity) {
    if (!orm) return null;
    return {
      id: orm.id,
      fullName: orm.fullName,
      identification: orm.identification,
      position: orm.position,
      institution: orm.institution,
      email: orm.email,
      phone: orm.phone,
      education: orm.education,
      role: orm.role,
      userId: orm.userId,
    };
  }
}

import { ProtocolRequirementOrmEntity } from '../../infrastructure/database/protocol-requirement.entity.orm';

export class RequirementMapper {
  static toResponse(orm: ProtocolRequirementOrmEntity) {
    if (!orm) return null;
    return {
      id: orm.id,
      code: orm.requirementCode,
      name: orm.requirementName,
      status: orm.status,
      pageCount: orm.pageCount,
      observations: orm.observations,
    };
  }
}

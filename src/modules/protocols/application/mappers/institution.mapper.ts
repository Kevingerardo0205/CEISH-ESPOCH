import { ParticipatingInstitutionOrmEntity } from '../../infrastructure/database/participating-institution.entity.orm';

export class InstitutionMapper {
  static toResponse(orm: ParticipatingInstitutionOrmEntity) {
    if (!orm) return null;
    return {
      id: orm.id,
      name: orm.name,
      type: orm.type,
      address: orm.address,
      contactPerson: orm.contactPerson,
      contactEmail: orm.contactEmail,
      contactPhone: orm.contactPhone,
      hasInterestLetter: orm.hasInterestLetter,
    };
  }
}

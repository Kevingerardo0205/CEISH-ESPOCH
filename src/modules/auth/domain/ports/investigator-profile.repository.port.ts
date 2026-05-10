import { InvestigatorProfileOrmEntity } from '../../infrastructure/database/investigator-profile.entity.orm';

export abstract class IInvestigatorProfileRepository {
  abstract save(
    profile: Partial<InvestigatorProfileOrmEntity>,
    manager?: any,
  ): Promise<InvestigatorProfileOrmEntity>;
  abstract findByUserId(
    userId: number,
  ): Promise<InvestigatorProfileOrmEntity | null>;
}

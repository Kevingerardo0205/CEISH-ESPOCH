import { Injectable, BadRequestException } from '@nestjs/common';
import { RoleCode } from '../enums/role.enum';

@Injectable()
export class SegregationOfDutiesDomainService {
  /**
   * Valida la regla de Segregación de Funciones (SoD):
   * El rol INVESTIGADOR es mutuamente exclusivo con roles administrativos o de evaluación (SECRETARIA, PRESIDENTE, EVALUADOR, ADMIN_TI).
   */
  public validateRoleAssignments(roleCodes: string[]): void {
    if (!roleCodes || roleCodes.length <= 1) {
      return;
    }

    const normalizedCodes = roleCodes.map((c) => c.trim().toUpperCase());
    const hasInvestigator = normalizedCodes.includes(RoleCode.INVESTIGADOR);

    if (hasInvestigator) {
      const conflictingRoles = normalizedCodes.filter(
        (c) => c !== RoleCode.INVESTIGADOR,
      );
      throw new BadRequestException(
        `Violación de Segregación de Funciones (SoD): El rol INVESTIGADOR es exclusivo y no puede asignarse conjuntamente con los roles: ${conflictingRoles.join(', ')}.`,
      );
    }
  }
}

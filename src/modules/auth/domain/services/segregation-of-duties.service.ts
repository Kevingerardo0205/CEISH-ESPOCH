import { Injectable, BadRequestException } from '@nestjs/common';
import { RoleCode } from '../enums/role.enum';

export interface ValidateRoleChangeParams {
  currentActiveRoles: string[];
  requestedRoles: string[];
  activeProtocolsAsInvestigator: number;
}

export interface DatePeriod {
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
}

export interface SecretariaAssignment {
  userId: number;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
}

export interface ValidateSingleSecretariaParams {
  targetUserId: number;
  requestedPeriod: DatePeriod;
  otherSecretariaAssignments: SecretariaAssignment[];
}

const COMMITTEE_ROLES: RoleCode[] = [
  RoleCode.SECRETARIA,
  RoleCode.PRESIDENTE,
  RoleCode.EVALUADOR,
  RoleCode.ADMIN_TI,
];

@Injectable()
export class SegregationOfDutiesDomainService {
  /**
   * Valida la regla de Segregación de Funciones (SoD) al asignar roles:
   * - El conjunto pedido no puede contener INVESTIGADOR junto con un rol del comité.
   * - Si el usuario tiene un rol del comité vigente y pide INVESTIGADOR -> rechazo.
   * - Si tiene INVESTIGADOR vigente y pide un rol del comité:
   *     permitido solo si activeProtocolsAsInvestigator === 0; si no, rechazo con la cantidad.
   * - Combinar roles del comité entre sí está permitido.
   */
  public validateRoleChange(params: ValidateRoleChangeParams): void {
    const {
      currentActiveRoles = [],
      requestedRoles = [],
      activeProtocolsAsInvestigator = 0,
    } = params;

    const normalizedRequested = requestedRoles.map((r) =>
      r.trim().toUpperCase(),
    );
    const normalizedCurrent = currentActiveRoles.map((r) =>
      r.trim().toUpperCase(),
    );

    const requestedHasInvestigator = normalizedRequested.includes(
      RoleCode.INVESTIGADOR,
    );
    const requestedHasCommittee = normalizedRequested.some((r) =>
      COMMITTEE_ROLES.includes(r as RoleCode),
    );

    // 1. El conjunto pedido no puede tener INVESTIGADOR junto con un rol del comité
    if (requestedHasInvestigator && requestedHasCommittee) {
      const conflicting = normalizedRequested.filter(
        (r) => r !== (RoleCode.INVESTIGADOR as string),
      );
      throw new BadRequestException(
        `Violación de Segregación de Funciones: El rol INVESTIGADOR es incompatible con los roles del comité (${conflicting.join(', ')}).`,
      );
    }

    // 2. Si tiene un rol del comité vigente y pide INVESTIGADOR -> rechazo
    const currentHasCommittee = normalizedCurrent.some((r) =>
      COMMITTEE_ROLES.includes(r as RoleCode),
    );
    if (currentHasCommittee && requestedHasInvestigator) {
      throw new BadRequestException(
        'Violación de Segregación de Funciones: No se puede asignar el rol INVESTIGADOR a un usuario con rol del comité vigente.',
      );
    }

    // 3. Si tiene INVESTIGADOR vigente y pide un rol del comité:
    // permitido solo si activeProtocolsAsInvestigator === 0; si no, rechazo con la cantidad
    const currentHasInvestigator = normalizedCurrent.includes(
      RoleCode.INVESTIGADOR,
    );
    if (currentHasInvestigator && requestedHasCommittee) {
      if (activeProtocolsAsInvestigator > 0) {
        throw new BadRequestException(
          `No se puede cambiar el rol de INVESTIGADOR a miembro del comité porque tiene ${activeProtocolsAsInvestigator} protocolo(s) en curso.`,
        );
      }
    }

    // 4. Combinar roles del comité entre sí está permitido (no arroja error)
  }

  /**
   * Valida la regla de una sola Secretaría vigente (HU-001 b2):
   * - Rechazo si alguna asignación de SECRETARIA de OTRO usuario se superpone con el período pedido.
   * - Un período sin fin (null o undefined) se considera abierto (hasta infinito).
   * - Reasignar o prorrogar a la misma titular está permitido.
   */
  public validateSingleSecretaria(
    params: ValidateSingleSecretariaParams,
  ): void {
    const {
      targetUserId,
      requestedPeriod,
      otherSecretariaAssignments = [],
    } = params;

    const relevantAssignments = otherSecretariaAssignments.filter(
      (a) => a.userId !== targetUserId,
    );

    if (relevantAssignments.length === 0) {
      return;
    }

    const reqStart = requestedPeriod?.validFrom
      ? new Date(requestedPeriod.validFrom).getTime()
      : Date.now();
    const reqEnd = requestedPeriod?.validUntil
      ? new Date(requestedPeriod.validUntil).getTime()
      : Infinity;

    for (const assignment of relevantAssignments) {
      const otherStart = assignment.validFrom
        ? new Date(assignment.validFrom).getTime()
        : -Infinity;
      const otherEnd = assignment.validUntil
        ? new Date(assignment.validUntil).getTime()
        : Infinity;

      // Superposición de períodos [reqStart, reqEnd] y [otherStart, otherEnd]
      if (reqStart <= otherEnd && otherStart <= reqEnd) {
        throw new BadRequestException(
          'Solo puede existir una titular con el rol SECRETARIA vigente en el sistema.',
        );
      }
    }
  }

  /**
   * Valida la segregación al prorrogar un rol temporal:
   * - No se puede extender INVESTIGADOR si el usuario tiene un rol del comité activo.
   * - No se puede extender un rol del comité si el usuario tiene INVESTIGADOR activo.
   */
  public validateRoleExtension(
    currentActiveRoles: string[],
    extendingRole: string,
  ): void {
    const normalizedExtending = extendingRole.trim().toUpperCase();
    const normalizedCurrent = currentActiveRoles.map((r) =>
      r.trim().toUpperCase(),
    );

    const extendingIsInvestigator =
      normalizedExtending === (RoleCode.INVESTIGADOR as string);
    const extendingIsCommittee = COMMITTEE_ROLES.includes(
      normalizedExtending as RoleCode,
    );

    const currentHasInvestigator = normalizedCurrent.includes(
      RoleCode.INVESTIGADOR,
    );
    const currentHasCommittee = normalizedCurrent.some((r) =>
      COMMITTEE_ROLES.includes(r as RoleCode),
    );

    if (extendingIsInvestigator && currentHasCommittee) {
      throw new BadRequestException(
        'Violación de Segregación de Funciones: No se puede extender el rol INVESTIGADOR a un usuario con rol del comité vigente.',
      );
    }

    if (extendingIsCommittee && currentHasInvestigator) {
      throw new BadRequestException(
        'Violación de Segregación de Funciones: No se puede extender un rol del comité a un usuario que tiene el rol INVESTIGADOR activo.',
      );
    }
  }

  /**
   * Método de compatibilidad para código y pruebas existentes que envían solo roleCodes.
   */
  public validateRoleAssignments(roleCodes: string[]): void {
    this.validateRoleChange({
      currentActiveRoles: [],
      requestedRoles: roleCodes,
      activeProtocolsAsInvestigator: 0,
    });
  }
}

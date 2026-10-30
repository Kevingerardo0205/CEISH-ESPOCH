import { BadRequestException } from '@nestjs/common';
import { SegregationOfDutiesDomainService } from './segregation-of-duties.service';
import { RoleCode } from '../enums/role.enum';

describe('SegregationOfDutiesDomainService', () => {
  let service: SegregationOfDutiesDomainService;

  beforeEach(() => {
    service = new SegregationOfDutiesDomainService();
  });

  describe('validateRoleAssignments (legacy compatibility)', () => {
    it('should allow single role assignment', () => {
      expect(() =>
        service.validateRoleAssignments([RoleCode.INVESTIGADOR]),
      ).not.toThrow();
      expect(() =>
        service.validateRoleAssignments([RoleCode.SECRETARIA]),
      ).not.toThrow();
    });

    it('should allow multiple non-conflicting administrative/evaluator roles', () => {
      expect(() =>
        service.validateRoleAssignments([
          RoleCode.SECRETARIA,
          RoleCode.EVALUADOR,
        ]),
      ).not.toThrow();
    });

    it('should throw BadRequestException if INVESTIGADOR is combined with another role', () => {
      expect(() =>
        service.validateRoleAssignments([
          RoleCode.INVESTIGADOR,
          RoleCode.SECRETARIA,
        ]),
      ).toThrow(BadRequestException);

      expect(() =>
        service.validateRoleAssignments([
          RoleCode.PRESIDENTE,
          RoleCode.INVESTIGADOR,
        ]),
      ).toThrow(BadRequestException);
    });
  });

  describe('validateRoleChange (HU-001 b)', () => {
    it('should reject if requested set contains INVESTIGADOR together with committee role', () => {
      expect(() =>
        service.validateRoleChange({
          currentActiveRoles: [],
          requestedRoles: [RoleCode.INVESTIGADOR, RoleCode.EVALUADOR],
          activeProtocolsAsInvestigator: 0,
        }),
      ).toThrow(
        new BadRequestException(
          'Violación de Segregación de Funciones: El rol INVESTIGADOR es incompatible con los roles del comité (EVALUADOR).',
        ),
      );
    });

    it('should reject if user has committee role and requests INVESTIGADOR', () => {
      expect(() =>
        service.validateRoleChange({
          currentActiveRoles: [RoleCode.EVALUADOR],
          requestedRoles: [RoleCode.INVESTIGADOR],
          activeProtocolsAsInvestigator: 0,
        }),
      ).toThrow(
        new BadRequestException(
          'Violación de Segregación de Funciones: No se puede asignar el rol INVESTIGADOR a un usuario con rol del comité vigente.',
        ),
      );
    });

    it('should reject if user has INVESTIGADOR and requests committee role but has active protocols', () => {
      expect(() =>
        service.validateRoleChange({
          currentActiveRoles: [RoleCode.INVESTIGADOR],
          requestedRoles: [RoleCode.EVALUADOR],
          activeProtocolsAsInvestigator: 2,
        }),
      ).toThrow(
        new BadRequestException(
          'No se puede cambiar el rol de INVESTIGADOR a miembro del comité porque tiene 2 protocolo(s) en curso.',
        ),
      );
    });

    it('should allow if user has INVESTIGADOR and requests committee role and has 0 active protocols', () => {
      expect(() =>
        service.validateRoleChange({
          currentActiveRoles: [RoleCode.INVESTIGADOR],
          requestedRoles: [RoleCode.EVALUADOR],
          activeProtocolsAsInvestigator: 0,
        }),
      ).not.toThrow();
    });

    it('should allow combining committee roles together', () => {
      expect(() =>
        service.validateRoleChange({
          currentActiveRoles: [RoleCode.EVALUADOR],
          requestedRoles: [RoleCode.EVALUADOR, RoleCode.PRESIDENTE],
          activeProtocolsAsInvestigator: 0,
        }),
      ).not.toThrow();
    });
  });

  describe('validateSingleSecretaria (HU-001 b2)', () => {
    it('should reject if another user has open SECRETARIA assignment', () => {
      expect(() =>
        service.validateSingleSecretaria({
          targetUserId: 2,
          requestedPeriod: { validFrom: new Date(), validUntil: null },
          otherSecretariaAssignments: [
            {
              userId: 1,
              validFrom: new Date('2026-01-01'),
              validUntil: null,
            },
          ],
        }),
      ).toThrow(
        new BadRequestException(
          'Solo puede existir una titular con el rol SECRETARIA vigente en el sistema.',
        ),
      );
    });

    it('should allow if another user had SECRETARIA that already expired in the past', () => {
      expect(() =>
        service.validateSingleSecretaria({
          targetUserId: 2,
          requestedPeriod: {
            validFrom: new Date('2026-10-01'),
            validUntil: null,
          },
          otherSecretariaAssignments: [
            {
              userId: 1,
              validFrom: new Date('2026-01-01'),
              validUntil: new Date('2026-09-01'),
            },
          ],
        }),
      ).not.toThrow();
    });

    it('should reject if another user has scheduled SECRETARIA in future that overlaps', () => {
      expect(() =>
        service.validateSingleSecretaria({
          targetUserId: 2,
          requestedPeriod: {
            validFrom: new Date('2026-11-01'),
            validUntil: new Date('2026-11-20'),
          },
          otherSecretariaAssignments: [
            {
              userId: 1,
              validFrom: new Date('2026-11-15'),
              validUntil: new Date('2026-11-30'),
            },
          ],
        }),
      ).toThrow(
        new BadRequestException(
          'Solo puede existir una titular con el rol SECRETARIA vigente en el sistema.',
        ),
      );
    });

    it('should allow if another user has scheduled SECRETARIA without overlap', () => {
      expect(() =>
        service.validateSingleSecretaria({
          targetUserId: 2,
          requestedPeriod: {
            validFrom: new Date('2026-11-01'),
            validUntil: new Date('2026-11-10'),
          },
          otherSecretariaAssignments: [
            {
              userId: 1,
              validFrom: new Date('2026-11-15'),
              validUntil: new Date('2026-11-30'),
            },
          ],
        }),
      ).not.toThrow();
    });

    it('should allow reassigning or extending SECRETARIA to the same titular', () => {
      expect(() =>
        service.validateSingleSecretaria({
          targetUserId: 1,
          requestedPeriod: {
            validFrom: new Date('2026-11-01'),
            validUntil: null,
          },
          otherSecretariaAssignments: [
            {
              userId: 1,
              validFrom: new Date('2026-01-01'),
              validUntil: null,
            },
          ],
        }),
      ).not.toThrow();
    });
  });

  describe('validateRoleExtension', () => {
    it('should reject extending INVESTIGADOR if user currently has committee role', () => {
      expect(() =>
        service.validateRoleExtension(
          [RoleCode.EVALUADOR],
          RoleCode.INVESTIGADOR,
        ),
      ).toThrow(
        new BadRequestException(
          'Violación de Segregación de Funciones: No se puede extender el rol INVESTIGADOR a un usuario con rol del comité vigente.',
        ),
      );
    });

    it('should reject extending committee role if user currently has INVESTIGADOR active', () => {
      expect(() =>
        service.validateRoleExtension(
          [RoleCode.INVESTIGADOR],
          RoleCode.EVALUADOR,
        ),
      ).toThrow(
        new BadRequestException(
          'Violación de Segregación de Funciones: No se puede extender un rol del comité a un usuario que tiene el rol INVESTIGADOR activo.',
        ),
      );
    });

    it('should allow extending committee role if user currently has committee role', () => {
      expect(() =>
        service.validateRoleExtension(
          [RoleCode.PRESIDENTE],
          RoleCode.EVALUADOR,
        ),
      ).not.toThrow();
    });
  });
});

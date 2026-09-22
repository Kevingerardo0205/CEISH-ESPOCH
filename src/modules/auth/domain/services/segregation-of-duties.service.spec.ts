import { BadRequestException } from '@nestjs/common';
import { SegregationOfDutiesDomainService } from './segregation-of-duties.service';
import { RoleCode } from '../enums/role.enum';

describe('SegregationOfDutiesDomainService', () => {
  let service: SegregationOfDutiesDomainService;

  beforeEach(() => {
    service = new SegregationOfDutiesDomainService();
  });

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

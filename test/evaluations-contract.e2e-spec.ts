/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import request from 'supertest';
import { JwtAuthGuard } from '../src/shared/guards/jwt-auth.guard';
import { RolesGuard } from '../src/shared/guards/roles.guard';
import { PermissionsGuard } from '../src/shared/guards/permissions.guard';
import { EvaluationsController } from '../src/modules/evaluations/infrastructure/controllers/evaluations.controller';
import { CallsController } from '../src/modules/evaluations/infrastructure/controllers/calls.controller';
import { MeetingsController } from '../src/modules/evaluations/infrastructure/controllers/meetings.controller';
import { AssignEvaluatorsUseCase } from '../src/modules/evaluations/application/use-cases/assign-evaluators.use-case';
import { ReassignEvaluatorUseCase } from '../src/modules/evaluations/application/use-cases/reassign-evaluator.use-case';
import { SubmitEvaluationUseCase } from '../src/modules/evaluations/application/use-cases/submit-evaluation.use-case';
import { EvaluationsService } from '../src/modules/evaluations/application/services/evaluations.service';
import { EvaluationConsolidationService } from '../src/modules/evaluations/application/services/evaluation-consolidation.service';
import { CallsService } from '../src/modules/evaluations/application/services/calls.service';
import { CreateMeetingUseCase } from '../src/modules/evaluations/application/services/create-meeting.use-case';
import { CalculateMeetingDatesService } from '../src/modules/evaluations/application/services/calculate-meeting-dates.service';
import { EvaluatorAssignmentAdapterService } from '../src/modules/evaluations/application/services/evaluator-assignment-adapter.service';
import {
  EvaluatorProfile,
  ReassignmentReason,
} from '../src/shared/enums/evaluator-enums';
import { AssignmentStatus } from '../src/modules/evaluations/domain/enums/assignment-status.enum';

describe('Phase 2 Safety Net: Evaluations Contract & Authorization Tests (e2e)', () => {
  let app: INestApplication;

  const mockAssignEvaluatorsUseCase = {
    execute: jest.fn().mockImplementation((dto: any) => {
      const evaluators = dto.evaluators || [];
      return Promise.resolve(
        evaluators.map((e: any, idx: number) => ({
          id: idx + 1,
          protocolId: dto.protocolId,
          evaluatorId: e.evaluatorId,
          evaluatorProfile: e.profile,
          isAssignedForAnnex10:
            idx < 2 && e.profile !== EvaluatorProfile.SOCIEDAD_CIVIL,
          status: AssignmentStatus.ASSIGNED,
        })),
      );
    }),
  };

  const mockAssignmentAdapterService = {
    adaptAndAssign: jest
      .fn()
      .mockImplementation((protocolId: number, dto: any) => {
        if ('evaluators' in dto && Array.isArray(dto.evaluators)) {
          return mockAssignEvaluatorsUseCase.execute({
            protocolId,
            evaluators: dto.evaluators,
          });
        }
        if ('evaluatorIds' in dto && Array.isArray(dto.evaluatorIds)) {
          const profiles = [
            EvaluatorProfile.JURIDICO,
            EvaluatorProfile.SOCIEDAD_CIVIL,
            EvaluatorProfile.METODOLOGICO,
            EvaluatorProfile.SALUD,
          ];
          const adapted = dto.evaluatorIds.map((id: number, idx: number) => ({
            evaluatorId: id,
            profile: profiles[idx],
          }));
          return mockAssignEvaluatorsUseCase.execute({
            protocolId,
            evaluators: adapted,
          });
        }
        return Promise.resolve([]);
      }),
  };

  const mockReassignEvaluatorUseCase = {
    execute: jest.fn().mockImplementation((dto: any, adminUserId: number) => {
      return Promise.resolve({
        outgoingAssignment: {
          id: dto.currentAssignmentId,
          status: AssignmentStatus.REASIGNED_COI,
        },
        newAssignment: {
          id: 999,
          evaluatorId: dto.replacementEvaluatorId,
          status: AssignmentStatus.ASSIGNED,
        },
        auditHistory: {
          id: 888,
          reason: dto.reason,
          executedBy: adminUserId,
        },
      });
    }),
  };

  const mockSubmitEvaluationUseCase = {
    isCompletion100Percent: jest
      .fn()
      .mockImplementation((protocolId: string) => {
        return Promise.resolve(protocolId === '100');
      }),
  };

  const mockEvaluationsService = {
    assignPeerEvaluators: jest
      .fn()
      .mockResolvedValue({ message: 'Evaluadores asignados' }),
    submitEvaluation: jest
      .fn()
      .mockResolvedValue({ message: 'Evaluación enviada' }),
    getMyAssignments: jest.fn().mockResolvedValue([]),
    getEvaluatorsDashboard: jest.fn().mockResolvedValue([]),
    getMyPendingPeerAssignments: jest
      .fn()
      .mockImplementation((evaluatorId: number) =>
        Promise.resolve([
          {
            id: 42,
            evaluatorId,
            protocolId: 10,
            assignedAt: new Date('2026-03-01'),
            deadline: new Date('2026-03-15'),
            submittedAt: null,
            proposedRiskLevelId: null,
            observations: null,
            reportPath: null,
            protocol: {
              id: 10,
              code: 'CEISH-2026-001',
              studyType: { name: 'Observacional' },
              principalInvestigator: { fullName: 'Dr. Investigador' },
            },
          },
        ]),
      ),
    submitPeerRiskLevel: jest.fn().mockResolvedValue({
      message: 'Propuesta de nivel de riesgo enviada exitosamente.',
    }),
  };

  const mockConsolidationService = {
    consolidate: jest.fn().mockResolvedValue({ message: 'Consolidación' }),
  };

  const mockCallsService = {
    findAllCalls: jest
      .fn()
      .mockResolvedValue([
        { id: 'call-uuid-1', sessionNumber: '001-2026', status: 'PROGRAMADA' },
      ]),
    findAllPlaces: jest
      .fn()
      .mockResolvedValue([
        { id: 'place-uuid-1', name: 'Sala de Consejo', isVirtual: false },
      ]),
    createCall: jest.fn().mockImplementation((dto: any) =>
      Promise.resolve({
        id: 'call-uuid-created',
        sessionNumber: '002-2026',
        ...dto,
      }),
    ),
    getPendingProtocolsForCall: jest.fn().mockResolvedValue([]),
    findCallById: jest
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve({ id, sessionNumber: '001-2026' }),
      ),
  };

  const mockCreateMeetingUseCase = {
    execute: jest.fn().mockImplementation((dto: any) =>
      Promise.resolve({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        meetingNumber: '010-2026',
        academicYear: 2026,
        sessionType: dto.sessionType,
        meetingDate: dto.meetingDate,
        evalSubmissionDeadline: dto.evalSubmissionDeadline,
        agendaPdfUrl:
          '/api/evaluations/meetings/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/pdf',
      }),
    ),
  };

  const mockCalculateDatesService = {
    calculateSuggestedEvalDeadline: jest
      .fn()
      .mockReturnValue(new Date('2026-06-11T23:59:59.999Z')),
  };

  const mockMeetingRepo = {
    findById: jest.fn().mockImplementation((id: string) => {
      // ParseUUIDPipe bloquea strings no-UUID antes de llegar aquí
      if (id === '00000000-0000-0000-0000-000000000000')
        return Promise.resolve(null);
      return Promise.resolve({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        numeroConvocatoria: '010-2026',
        estado: 'PROGRAMADA',
      });
    }),
    findAll: jest.fn().mockResolvedValue({
      items: [
        {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          numeroConvocatoria: '010-2026',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    }),
    findPendingProtocols: jest
      .fn()
      .mockResolvedValue([
        { id: 100, ceishCode: 'CEISH-2026-001', title: 'Protocolo de Prueba' },
      ]),
    findAllPlaces: jest.fn().mockResolvedValue([
      {
        id: '11111111-1111-1111-1111-111111111111',
        nombre: 'Sala de Consejo',
        esVirtual: false,
      },
    ]),
    findPlaceById: jest
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve({ id, nombre: 'Sala de Consejo', esVirtual: false }),
      ),
    createPlace: jest.fn().mockImplementation((data: any) =>
      Promise.resolve({
        id: '11111111-1111-1111-1111-111111111111',
        ...data,
      }),
    ),
    updatePlace: jest
      .fn()
      .mockImplementation((id: string, data: any) =>
        Promise.resolve({ id, ...data }),
      ),
    deletePlace: jest.fn().mockResolvedValue(undefined),
  };

  const mockPdfGenerator = {
    generateAgendaPdf: jest
      .fn()
      .mockResolvedValue(
        '/api/evaluations/meetings/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/pdf',
      ),
    generateMeetingPdf: jest
      .fn()
      .mockResolvedValue(
        '/api/evaluations/meetings/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/pdf',
      ),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationsController, CallsController, MeetingsController],
      providers: [
        {
          provide: AssignEvaluatorsUseCase,
          useValue: mockAssignEvaluatorsUseCase,
        },
        {
          provide: ReassignEvaluatorUseCase,
          useValue: mockReassignEvaluatorUseCase,
        },
        {
          provide: SubmitEvaluationUseCase,
          useValue: mockSubmitEvaluationUseCase,
        },
        { provide: EvaluationsService, useValue: mockEvaluationsService },
        {
          provide: EvaluationConsolidationService,
          useValue: mockConsolidationService,
        },
        { provide: CallsService, useValue: mockCallsService },
        { provide: CreateMeetingUseCase, useValue: mockCreateMeetingUseCase },
        {
          provide: CalculateMeetingDatesService,
          useValue: mockCalculateDatesService,
        },
        {
          provide: EvaluatorAssignmentAdapterService,
          useValue: mockAssignmentAdapterService,
        },
        { provide: 'IMeetingRepositoryPort', useValue: mockMeetingRepo },
        { provide: 'IMeetingPdfGeneratorPort', useValue: mockPdfGenerator },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const authHeader = req.headers['authorization'];
          if (!authHeader || authHeader === 'Bearer invalid') {
            throw new UnauthorizedException(
              'Token de autenticación inválido o ausente',
            );
          }
          const roleHeader = req.headers['x-test-role'] || 'SECRETARIA';
          req.user = {
            id: 1,
            email: 'admin@ceish.com',
            roles: [roleHeader],
            permissions:
              roleHeader === 'INVESTIGADOR'
                ? []
                : [
                    'evaluators:assign',
                    'evaluation:view_mine',
                    'permissions:manage',
                    'reception:view',
                  ],
            temporalRoles: [],
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const roleHeader = req.headers['x-test-role'];
          if (roleHeader === 'INVESTIGADOR') {
            throw new ForbiddenException('Rol no autorizado');
          }
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          const roleHeader = req.headers['x-test-role'];
          if (roleHeader === 'INVESTIGADOR') {
            throw new ForbiddenException('Permisos insuficientes');
          }
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Contract 1: POST /api/evaluations/assign (Authorization & Functionality)', () => {
    const validPayload = {
      protocolId: 100,
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    it('debe rechazar con HTTP 401 si no se envía token de autenticación', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/assign')
        .send(validPayload)
        .expect(401);
    });

    it('debe rechazar con HTTP 403 si el usuario tiene rol INVESTIGADOR sin permisos de asignación', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/assign')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'INVESTIGADOR')
        .send(validPayload)
        .expect(403);
    });

    it('debe responder HTTP 201 y asignar evaluadores cuando el rol es SECRETARIA o PRESIDENTE', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluations/assign')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send(validPayload)
        .expect(201);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(4);
      expect(mockAssignEvaluatorsUseCase.execute).toHaveBeenCalled();
    });

    it('debe responder HTTP 400 cuando versionId explícito no existe (nunca 500)', async () => {
      mockAssignEvaluatorsUseCase.execute.mockRejectedValueOnce(
        new (require('@nestjs/common').BadRequestException)(
          'La versión con ID 9999 no existe.',
        ),
      );
      await request(app.getHttpServer())
        .post('/api/evaluations/assign')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send({
          protocolId: 100,
          versionId: 9999,
          evaluators: [
            { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
            { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
            { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
            { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
          ],
        })
        .expect(400);
    });

    it('debe responder HTTP 400 cuando protocolId es una cadena no numérica ("abc")', async () => {
      mockAssignEvaluatorsUseCase.execute.mockRejectedValueOnce(
        new (require('@nestjs/common').BadRequestException)(
          'protocolId debe ser un entero positivo; se recibió "abc".',
        ),
      );
      await request(app.getHttpServer())
        .post('/api/evaluations/assign')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send({
          protocolId: 'abc',
          evaluators: [
            { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
            { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
            { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
            { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
          ],
        })
        .expect(400);
    });

    it('debe rechazar con HTTP 400 si el body incluye profileId (campo no permitido en el contrato público)', async () => {
      const payloadWithProfileId = {
        protocolId: 100,
        evaluators: [
          {
            evaluatorId: 1,
            profile: EvaluatorProfile.JURIDICO,
            profileId: 8,
          },
          { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
          { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
          { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
        ],
      };
      await request(app.getHttpServer())
        .post('/api/evaluations/assign')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send(payloadWithProfileId)
        .expect(400);
    });
  });

  describe('Contract 2: POST /api/evaluations/reassign (Authorization & Functionality)', () => {
    const validPayload = {
      currentAssignmentId: 1,
      replacementEvaluatorId: 5,
      replacementEvaluatorProfile: EvaluatorProfile.JURIDICO,
      reason: ReassignmentReason.CONFLICTO_INTERES,
      reasonDescription: 'Conflicto de interés declarado',
    };

    it('debe rechazar con HTTP 401 si no se envía token de autenticación', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .send(validPayload)
        .expect(401);
    });

    it('debe rechazar con HTTP 403 si el rol no tiene permisos (INVESTIGADOR)', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'INVESTIGADOR')
        .send(validPayload)
        .expect(403);
    });

    it('debe responder HTTP 201 y reasignar evaluador cuando el rol es SECRETARIA', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluations/reassign')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send(validPayload)
        .expect(201);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('outgoingAssignment');
      expect(data).toHaveProperty('newAssignment');
      expect(mockReassignEvaluatorUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('Contract 3: GET /api/evaluations/completion-status/:protocolId', () => {
    it('debe rechazar con HTTP 401 sin autenticación', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/completion-status/100')
        .expect(401);
    });

    it('debe responder HTTP 200 con el estado de completitud booleano para usuario autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/completion-status/100')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toEqual({
        protocolId: '100',
        isCompletion100Percent: true,
      });
    });
  });

  describe('Contract 4: POST /api/evaluations/protocols/:id/assign-peer-evaluators', () => {
    const canonicalPayload = {
      evaluators: [
        { evaluatorId: 1, profile: EvaluatorProfile.JURIDICO },
        { evaluatorId: 2, profile: EvaluatorProfile.SOCIEDAD_CIVIL },
        { evaluatorId: 3, profile: EvaluatorProfile.METODOLOGICO },
        { evaluatorId: 4, profile: EvaluatorProfile.SALUD },
      ],
    };

    const legacyPayload = {
      evaluatorIds: [1, 2, 3, 4],
    };

    it('debe rechazar con HTTP 401 si no se envía token de autenticación', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/protocols/100/assign-peer-evaluators')
        .send(legacyPayload)
        .expect(401);
    });

    it('debe rechazar con HTTP 403 si el rol no tiene permisos (INVESTIGADOR)', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/protocols/100/assign-peer-evaluators')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'INVESTIGADOR')
        .send(legacyPayload)
        .expect(403);
    });

    it('debe soportar payload canónico con array de evaluators y llamar a AssignEvaluatorsUseCase', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluations/protocols/100/assign-peer-evaluators')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send(canonicalPayload)
        .expect(201);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(mockAssignmentAdapterService.adaptAndAssign).toHaveBeenCalled();
      expect(mockAssignEvaluatorsUseCase.execute).toHaveBeenCalled();
    });

    it('debe soportar payload legacy con array evaluatorIds y resolver hacia AssignEvaluatorsUseCase', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluations/protocols/100/assign-peer-evaluators')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send(legacyPayload)
        .expect(201);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(mockAssignmentAdapterService.adaptAndAssign).toHaveBeenCalled();
      expect(mockAssignEvaluatorsUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('Contract 5: Calls Endpoints (Legacy / Deprecated Safety Net)', () => {
    it('debe responder HTTP 200 en GET /api/evaluations/calls', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/calls')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(mockCallsService.findAllCalls).toHaveBeenCalled();
    });

    it('debe responder HTTP 200 en GET /api/evaluations/calls/places', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/calls/places')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(mockCallsService.findAllPlaces).toHaveBeenCalled();
    });
  });

  describe('Contract 6: Meetings Endpoints (Canonical RF-09 Safety Net)', () => {
    it('debe responder HTTP 201 en POST /api/evaluations/meetings con orden del día', async () => {
      const payload = {
        sessionType: 'ORDINARIA',
        meetingDate: '2026-06-18T10:00:00.000Z',
        evalSubmissionDeadline: '2026-06-11T23:59:59.000Z',
        protocolVersionIds: [100],
      };

      const res = await request(app.getHttpServer())
        .post('/api/evaluations/meetings')
        .set('Authorization', 'Bearer valid-token')
        .send(payload)
        .expect(201);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('meetingNumber');
      expect(data.meetingNumber).toMatch(/^\d{3}-2026$/);
    });

    it('debe responder HTTP 200 en GET /api/evaluations/meetings (listado paginado)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings?page=1&limit=10')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(mockMeetingRepo.findAll).toHaveBeenCalled();
    });

    it('debe responder HTTP 200 en GET /api/evaluations/meetings/pending-protocols', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings/pending-protocols')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .expect(200);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(mockMeetingRepo.findPendingProtocols).toHaveBeenCalled();
    });

    it('debe rechazar GET /api/evaluations/meetings/pending-protocols con 403 para INVESTIGADOR', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/meetings/pending-protocols')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'INVESTIGADOR')
        .expect(403);
    });

    it('debe responder HTTP 200 en GET /api/evaluations/meetings/:id', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const data = res.body.data || res.body;
      expect(data).toHaveProperty('id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
      expect(data).toHaveProperty('numeroConvocatoria', '010-2026');
    });

    it('debe responder HTTP 200 en GET /api/evaluations/meetings/places', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/meetings/places')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      const data = res.body.data || res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(mockMeetingRepo.findAllPlaces).toHaveBeenCalled();
    });

    it('debe responder HTTP 201 en POST /api/evaluations/meetings/places', async () => {
      const payload = {
        name: 'Sala de Consejo Politécnico',
        location: 'Edificio Central, 2do Piso',
        isVirtual: false,
      };

      const res = await request(app.getHttpServer())
        .post('/api/evaluations/meetings/places')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('nombre', 'Sala de Consejo Politécnico');
      expect(mockMeetingRepo.createPlace).toHaveBeenCalled();
    });

    it('debe rechazar POST /api/evaluations/meetings/places con 403 para INVESTIGADOR', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/meetings/places')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'INVESTIGADOR')
        .send({ name: 'Sala' })
        .expect(403);
    });

    it('debe responder HTTP 200 en PATCH /api/evaluations/meetings/places/:id', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          '/api/evaluations/meetings/places/11111111-1111-1111-1111-111111111111',
        )
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .send({ name: 'Sala Actualizada' })
        .expect(200);

      expect(res.body).toHaveProperty('nombre', 'Sala Actualizada');
    });

    it('debe responder HTTP 200 en DELETE /api/evaluations/meetings/places/:id', async () => {
      const res = await request(app.getHttpServer())
        .delete(
          '/api/evaluations/meetings/places/11111111-1111-1111-1111-111111111111',
        )
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'SECRETARIA')
        .expect(200);

      expect(res.body).toEqual({
        message: 'Lugar de reunión desactivado exitosamente.',
      });
    });
  });

  describe('Contract 7: Peer Risk Assignment & Submission Flow (Annex 10 Safety Net)', () => {
    it('debe rechazar GET /api/evaluations/peer-assignments/my-pending sin autenticación con 401', async () => {
      await request(app.getHttpServer())
        .get('/api/evaluations/peer-assignments/my-pending')
        .expect(401);
    });

    it('debe responder HTTP 200 con asignaciones pendientes para el evaluador', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/evaluations/peer-assignments/my-pending')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'EVALUADOR')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('id', 42);
      expect(res.body[0]).toHaveProperty('protocol');
      expect(
        mockEvaluationsService.getMyPendingPeerAssignments,
      ).toHaveBeenCalled();
    });

    it('debe rechazar POST /api/evaluations/peer-assignments/:id/submit-risk sin autenticación con 401', async () => {
      await request(app.getHttpServer())
        .post('/api/evaluations/peer-assignments/42/submit-risk')
        .send({
          riskLevelId: 2,
          observations: 'Riesgo medio observado',
          reportPath: 'protocols/10/docEvaluacion/informe.pdf',
        })
        .expect(401);
    });

    it('debe responder HTTP 201 y procesar propuesta de riesgo cuando el evaluador envía datos válidos', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/evaluations/peer-assignments/42/submit-risk')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'EVALUADOR')
        .send({
          riskLevelId: 2,
          observations: 'Riesgo medio observado',
          reportPath: 'protocols/10/docEvaluacion/informe.pdf',
        })
        .expect(201);

      expect(res.body).toHaveProperty(
        'message',
        'Propuesta de nivel de riesgo enviada exitosamente.',
      );
      expect(mockEvaluationsService.submitPeerRiskLevel).toHaveBeenCalledWith(
        42,
        1,
        expect.objectContaining({ riskLevelId: 2 }),
      );
    });
  });
});

import { toSummary, toDetail, toPendingProtocol } from './meeting.mapper';
import type {
  MeetingSummaryModel,
  MeetingDetailModel,
  PendingProtocolModel,
} from '../../domain/entities/meeting.entity';

const MEETING_DATE = new Date('2026-10-15T09:00:00.000Z');
const EVAL_DEADLINE = new Date('2026-10-08T23:59:59.000Z');
const NORMATIVE_DATE = new Date('2026-11-01T00:00:00.000Z');
const RECEPTION_DATE = new Date('2026-09-15T00:00:00.000Z');

const baseSummary: MeetingSummaryModel = {
  id: 'f47ac10b-0000-0000-0000-000000000010',
  meetingNumber: '010-2026',
  academicYear: 2026,
  sessionType: 'ORDINARIA',
  meetingDate: MEETING_DATE,
  evalSubmissionDeadline: EVAL_DEADLINE,
  status: 'PROGRAMADA',
  place: {
    id: 'place-001',
    name: 'Sala de Sesiones CEISH',
    address: 'Edificio Central, piso 3',
    isVirtual: false,
    meetingLink: null,
  },
  protocolCount: 2,
};

describe('meeting.mapper', () => {
  describe('toSummary', () => {
    it('convierte Date a ISO string en meetingDate y evalSubmissionDeadline', () => {
      const dto = toSummary(baseSummary);
      expect(dto.meetingDate).toBe(MEETING_DATE.toISOString());
      expect(dto.evalSubmissionDeadline).toBe(EVAL_DEADLINE.toISOString());
    });

    it('añade agendaPdfUrl derivada del id', () => {
      const dto = toSummary(baseSummary);
      expect(dto.agendaPdfUrl).toBe(
        `/api/evaluations/meetings/${baseSummary.id}/pdf`,
      );
    });

    it('produce null cuando meetingDate es null', () => {
      const dto = toSummary({ ...baseSummary, meetingDate: null });
      expect(dto.meetingDate).toBeNull();
    });

    it('produce null cuando evalSubmissionDeadline es null', () => {
      const dto = toSummary({ ...baseSummary, evalSubmissionDeadline: null });
      expect(dto.evalSubmissionDeadline).toBeNull();
    });

    it('pasa place y protocolCount sin modificarlos', () => {
      const dto = toSummary(baseSummary);
      expect(dto.place?.name).toBe('Sala de Sesiones CEISH');
      expect(dto.protocolCount).toBe(2);
    });

    it('pasa place null cuando no hay lugar', () => {
      const dto = toSummary({ ...baseSummary, place: null });
      expect(dto.place).toBeNull();
    });

    it('tiene exactamente las claves de contrato en summary', () => {
      const dto = toSummary(baseSummary);
      const actual = Object.keys(dto).sort();
      const expected = [
        'academicYear',
        'agendaPdfUrl',
        'evalSubmissionDeadline',
        'id',
        'meetingDate',
        'meetingNumber',
        'place',
        'protocolCount',
        'sessionType',
        'status',
      ];
      expect(actual).toEqual(expected);
    });

    it('tiene exactamente las claves de contrato en place', () => {
      const dto = toSummary(baseSummary);
      const actual = Object.keys(dto.place!).sort();
      expect(actual).toEqual([
        'address',
        'id',
        'isVirtual',
        'meetingLink',
        'name',
      ]);
    });
  });

  describe('toDetail', () => {
    const model: MeetingDetailModel = {
      ...baseSummary,
      protocols: [
        {
          order: 1,
          protocolId: 42,
          versionId: 137,
          versionNumber: 2,
          ceishCode: 'CEISH-042-2026',
          title: 'Estudio clínico fase II',
          studyType: 'Ensayo clínico',
          investigatorName: 'Juan Pérez',
          normativeDeadline: NORMATIVE_DATE,
        },
        {
          order: 2,
          protocolId: null,
          versionId: null,
          versionNumber: null,
          ceishCode: null,
          title: null,
          studyType: null,
          investigatorName: null,
          normativeDeadline: null,
        },
      ],
    };

    it('incluye los campos de summary', () => {
      const dto = toDetail(model);
      expect(dto.meetingNumber).toBe('010-2026');
      expect(dto.agendaPdfUrl).toContain('/pdf');
    });

    it('mapea normativeDeadline a ISO string', () => {
      const dto = toDetail(model);
      expect(dto.protocols[0].normativeDeadline).toBe(
        NORMATIVE_DATE.toISOString(),
      );
    });

    it('produce null en normativeDeadline cuando es null', () => {
      const dto = toDetail(model);
      expect(dto.protocols[1].normativeDeadline).toBeNull();
    });

    it('preserva protocolId/versionId null en ítems de seguimiento', () => {
      const dto = toDetail(model);
      expect(dto.protocols[1].protocolId).toBeNull();
      expect(dto.protocols[1].versionId).toBeNull();
    });

    it('count de protocols correcto', () => {
      const dto = toDetail(model);
      expect(dto.protocols).toHaveLength(2);
    });

    it('tiene exactamente las claves de contrato en detail', () => {
      const dto = toDetail(model);
      const actual = Object.keys(dto).sort();
      const expected = [
        'academicYear',
        'agendaPdfUrl',
        'evalSubmissionDeadline',
        'id',
        'meetingDate',
        'meetingNumber',
        'place',
        'protocolCount',
        'protocols',
        'sessionType',
        'status',
      ];
      expect(actual).toEqual(expected);
    });

    it('tiene exactamente las claves de contrato en cada ítem de protocols', () => {
      const dto = toDetail(model);
      const actual = Object.keys(dto.protocols[0]).sort();
      const expected = [
        'ceishCode',
        'investigatorName',
        'normativeDeadline',
        'order',
        'protocolId',
        'studyType',
        'title',
        'versionId',
        'versionNumber',
      ];
      expect(actual).toEqual(expected);
    });

    it('protocols desordenados en el modelo salen por order ASC', () => {
      const unordered: MeetingDetailModel = {
        ...baseSummary,
        protocols: [
          {
            order: 3,
            protocolId: 30,
            versionId: 30,
            versionNumber: null,
            ceishCode: null,
            title: 'C',
            studyType: null,
            investigatorName: null,
            normativeDeadline: null,
          },
          {
            order: 1,
            protocolId: 10,
            versionId: 10,
            versionNumber: null,
            ceishCode: null,
            title: 'A',
            studyType: null,
            investigatorName: null,
            normativeDeadline: null,
          },
          {
            order: 2,
            protocolId: 20,
            versionId: 20,
            versionNumber: null,
            ceishCode: null,
            title: 'B',
            studyType: null,
            investigatorName: null,
            normativeDeadline: null,
          },
        ],
      };
      const dto = toDetail(unordered);
      expect(dto.protocols.map((p) => p.order)).toEqual([1, 2, 3]);
    });

    it('el JSON serializado no contiene la cadena "email"', () => {
      const json = JSON.stringify(toDetail(model));
      expect(json).not.toContain('email');
    });
  });

  describe('toPendingProtocol', () => {
    const model: PendingProtocolModel = {
      protocolId: 42,
      versionId: 137,
      versionNumber: 2,
      ceishCode: 'CEISH-042-2026',
      title: 'Estudio clínico fase II',
      studyType: 'Ensayo clínico',
      investigatorName: 'Juan Pérez',
      receptionDate: RECEPTION_DATE,
      deadline: EVAL_DEADLINE,
    };

    it('convierte receptionDate a ISO string', () => {
      const dto = toPendingProtocol(model);
      expect(dto.receptionDate).toBe(RECEPTION_DATE.toISOString());
    });

    it('convierte deadline a ISO string', () => {
      const dto = toPendingProtocol(model);
      expect(dto.deadline).toBe(EVAL_DEADLINE.toISOString());
    });

    it('produce null cuando receptionDate es null', () => {
      const dto = toPendingProtocol({ ...model, receptionDate: null });
      expect(dto.receptionDate).toBeNull();
    });

    it('produce null cuando deadline es null', () => {
      const dto = toPendingProtocol({ ...model, deadline: null });
      expect(dto.deadline).toBeNull();
    });

    it('preserva protocolId y versionId como number', () => {
      const dto = toPendingProtocol(model);
      expect(dto.protocolId).toBe(42);
      expect(dto.versionId).toBe(137);
    });

    it('protocolId ≠ versionId cuando son distintos (5 vs 991)', () => {
      const dto = toPendingProtocol({
        ...model,
        protocolId: 5,
        versionId: 991,
      });
      expect(dto.protocolId).toBe(5);
      expect(dto.versionId).toBe(991);
      expect(dto.protocolId).not.toBe(dto.versionId);
    });

    it('tiene exactamente las claves de contrato en pending', () => {
      const dto = toPendingProtocol(model);
      const actual = Object.keys(dto).sort();
      const expected = [
        'ceishCode',
        'deadline',
        'investigatorName',
        'protocolId',
        'receptionDate',
        'studyType',
        'title',
        'versionId',
        'versionNumber',
      ];
      expect(actual).toEqual(expected);
    });

    it('el JSON serializado no contiene la cadena "email"', () => {
      const json = JSON.stringify(toPendingProtocol(model));
      expect(json).not.toContain('email');
    });
  });
});

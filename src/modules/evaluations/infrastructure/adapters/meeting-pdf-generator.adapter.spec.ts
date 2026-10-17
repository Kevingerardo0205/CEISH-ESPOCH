/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { MeetingPdfGeneratorAdapter } from './meeting-pdf-generator.adapter';
import { NotFoundException } from '@nestjs/common';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

describe('MeetingPdfGeneratorAdapter (TSK-009-007)', () => {
  let adapter: MeetingPdfGeneratorAdapter;
  let dataSourceMock: any;
  let pdfGeneratorMock: any;
  let convocatoriaRepoMock: any;
  let itemsRepoMock: any;

  beforeEach(() => {
    convocatoriaRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    itemsRepoMock = {
      find: jest.fn(),
    };

    dataSourceMock = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity.name === 'ConvocatoriaOrmEntity') {
          return convocatoriaRepoMock;
        }
        return itemsRepoMock;
      }),
    };

    pdfGeneratorMock = {
      generateCallPdf: jest
        .fn()
        .mockResolvedValue(Buffer.from('%PDF-1.4 mock content')),
    };

    adapter = new MeetingPdfGeneratorAdapter(dataSourceMock, pdfGeneratorMock);
  });

  it('should generate PDF buffer, save to file and update meeting ordenDiaPdfPath', async () => {
    const mockMeeting = {
      id: 'meet-001',
      numeroConvocatoria: '001-2026',
      tipoSession: 'ORDINARIA',
      fechaReunion: new Date('2026-10-15T09:00:00.000Z'),
      lugar: { nombre: 'Sala de Consejo Politécnico' },
      ordenDiaPdfPath: null,
    };
    convocatoriaRepoMock.findOne.mockResolvedValue(mockMeeting);

    const mockItems = [
      {
        id: 'item-01',
        protocoloId: 101,
        tipoPuntoAgenda: 'EVALUACION_INICIAL',
        orden: 1,
        protocolo: {
          ceishCode: 'CEISH-2026-001',
          title: 'Estudio de Bioética',
          principalInvestigator: { fullName: 'Dra. María Pérez' },
        },
      },
    ];
    itemsRepoMock.find.mockResolvedValue(mockItems);

    const result = await adapter.generateAgendaPdf('meet-001');

    expect(result.url).toBe('/api/evaluations/meetings/meet-001/pdf');
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
    expect(pdfGeneratorMock.generateCallPdf).toHaveBeenCalled();
    const callArg = pdfGeneratorMock.generateCallPdf.mock.calls[0][0] as {
      protocols: Array<{ investigatorName: string }>;
    };
    expect(callArg.protocols[0].investigatorName).toBe('Dra. María Pérez');
    expect(convocatoriaRepoMock.save).toHaveBeenCalled();
  });

  it('should pass date=null and time="Por definir" when fechaReunion is null', async () => {
    convocatoriaRepoMock.findOne.mockResolvedValue({
      id: 'meet-002',
      numeroConvocatoria: '002-2026',
      tipoSession: 'ORDINARIA',
      fechaReunion: null,
      lugar: null,
      ordenDiaPdfPath: null,
    });
    itemsRepoMock.find.mockResolvedValue([]);

    await adapter.generateAgendaPdf('meet-002');

    const callArg = pdfGeneratorMock.generateCallPdf.mock.calls[0][0] as {
      date: Date | null;
      time: string;
      placeName: string;
    };
    expect(callArg.date).toBeNull();
    expect(callArg.time).toBe('Por definir');
    expect(callArg.placeName).toBe('Por definir');
  });

  it('should pass placeName="Por definir" when lugar is null', async () => {
    convocatoriaRepoMock.findOne.mockResolvedValue({
      id: 'meet-003',
      numeroConvocatoria: '003-2026',
      tipoSession: 'ORDINARIA',
      fechaReunion: new Date('2026-08-20T14:00:00.000Z'),
      lugar: null,
      ordenDiaPdfPath: null,
    });
    itemsRepoMock.find.mockResolvedValue([]);

    await adapter.generateAgendaPdf('meet-003');

    const callArg = pdfGeneratorMock.generateCallPdf.mock.calls[0][0] as {
      placeName: string;
    };
    expect(callArg.placeName).toBe('Por definir');
  });

  it('should throw NotFoundException if meeting does not exist', async () => {
    convocatoriaRepoMock.findOne.mockResolvedValue(null);

    await expect(adapter.generateAgendaPdf('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});

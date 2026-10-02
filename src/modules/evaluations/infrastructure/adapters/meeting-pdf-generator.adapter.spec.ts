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
          codigoCeish: 'CEISH-2026-001',
          titulo: 'Estudio de Bioética',
          investigadorPrincipal: { fullName: 'Dra. María Pérez' },
        },
      },
    ];
    itemsRepoMock.find.mockResolvedValue(mockItems);

    const result = await adapter.generateAgendaPdf('meet-001');

    expect(result).toBe('/api/evaluations/meetings/meet-001/pdf');
    expect(pdfGeneratorMock.generateCallPdf).toHaveBeenCalled();
    expect(convocatoriaRepoMock.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if meeting does not exist', async () => {
    convocatoriaRepoMock.findOne.mockResolvedValue(null);

    await expect(adapter.generateAgendaPdf('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequirementsService } from './requirements.service';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';
import { TipoDocumentoEstudioOrmEntity } from '../../infrastructure/database/tipo-documento-estudio.entity.orm';
import { StudyTypeOrmEntity } from '../../infrastructure/database/study-type.entity.orm';

/**
 * TSK-001.12 (RF-19.1 a): la condición `tesis` de condiciones_por_tipo incluye
 * TESIS_ANTIPLAGIO y TESIS_OFICIO_TUTOR solo con tesis = true.
 */
const allTypes = (flag: string): Record<string, unknown> => ({
  condiciones_por_tipo: { IO: [flag], EI: [flag], EC: [flag], EX: [flag] },
});

const rel = (
  id: number,
  code: string,
  condicionJson: Record<string, unknown> | null,
): Partial<TipoDocumentoEstudioOrmEntity> => ({
  tipoDocumentoId: id,
  tipoEstudioId: 5,
  esObligatorio: true,
  tipoDocumento: {
    id,
    codigoAnexo: code,
    nombre: `Documento ${code}`,
    condicionJson,
  } as TipoDocumentoEstudioOrmEntity['tipoDocumento'],
});

const catalog: Partial<TipoDocumentoEstudioOrmEntity>[] = [
  rel(19, 'ANEXO_1', { condiciones_por_tipo: { IO: [], EI: [] } }),
  rel(30, 'TRADUCCION_ANCESTRAL', allTypes('poblacionIndigena')),
  rel(50, 'TESIS_ANTIPLAGIO', allTypes('tesis')),
  rel(51, 'TESIS_OFICIO_TUTOR', allTypes('tesis')),
];

const THESIS_CODES = ['TESIS_ANTIPLAGIO', 'TESIS_OFICIO_TUTOR'];

describe('RequirementsService.calcularRequeridos — tesis (TSK-001.12, RF-19.1)', () => {
  let service: RequirementsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        {
          provide: getRepositoryToken(TipoDocumentoEstudioOrmEntity),
          useValue: { find: jest.fn().mockResolvedValue(catalog) },
        },
        {
          provide: getRepositoryToken(StudyTypeOrmEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 5, code: 'IO' }),
          },
        },
      ],
    }).compile();
    service = module.get<RequirementsService>(RequirementsService);
  });

  const codesFor = async (
    flags: Parameters<RequirementsService['calcularRequeridos']>[1],
  ): Promise<string[]> =>
    (await service.calcularRequeridos(StudyTypeCode.IO, flags)).map(
      (r) => r.code,
    );

  it('con tesis = true incluye TESIS_ANTIPLAGIO y TESIS_OFICIO_TUTOR como obligatorios', async () => {
    const reqs = await service.calcularRequeridos(StudyTypeCode.IO, {
      tesis: true,
    });
    const thesis = reqs.filter((r) => THESIS_CODES.includes(r.code));
    expect(thesis.map((r) => r.code)).toEqual(THESIS_CODES);
    expect(thesis.every((r) => r.isRequired && r.isConditional)).toBe(true);
  });

  it('con tesis = false no los incluye', async () => {
    const codes = await codesFor({ tesis: false });
    expect(codes).toEqual(['ANEXO_1']);
  });

  it('sin el flag tesis no los incluye', async () => {
    const codes = await codesFor({});
    expect(codes).toEqual(['ANEXO_1']);
  });

  it('con tesis y población indígena suma los requisitos de ambas condiciones', async () => {
    const codes = await codesFor({ tesis: true, poblacionIndigena: true });
    expect(codes).toEqual([
      'ANEXO_1',
      'TRADUCCION_ANCESTRAL',
      'TESIS_ANTIPLAGIO',
      'TESIS_OFICIO_TUTOR',
    ]);
  });

  it('con tesis = true suma exactamente 2 requisitos respecto de tesis = false', async () => {
    const withThesis = await codesFor({ tesis: true });
    const withoutThesis = await codesFor({ tesis: false });
    expect(withThesis.length - withoutThesis.length).toBe(2);
  });
});

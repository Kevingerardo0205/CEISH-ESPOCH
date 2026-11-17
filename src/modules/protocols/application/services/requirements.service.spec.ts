import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RequirementsService } from './requirements.service';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';
import { TipoDocumentoEstudioOrmEntity } from '../../infrastructure/database/tipo-documento-estudio.entity.orm';
import { StudyTypeOrmEntity } from '../../infrastructure/database/study-type.entity.orm';
import { TipoDocumentoOrmEntity } from '../../infrastructure/database/tipo-documento.entity.orm';
import { DocumentTemplateOrmEntity } from '../../../documents/infrastructure/database/document-template.entity.orm';

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
        {
          provide: getRepositoryToken(TipoDocumentoOrmEntity),
          useValue: { find: jest.fn() },
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

/**
 * TSK-001.18 (RF-18.1 b): templateCode del checklist. Solo vale con plantilla activa y con
 * archivo; sin archivo, inactiva, sin relación o con un código fuera del catálogo → null.
 */
const template = (
  code: string,
  isActive: boolean,
  filePath: string | undefined,
): DocumentTemplateOrmEntity =>
  ({
    id: 1,
    code,
    name: `Plantilla ${code}`,
    isActive,
    filePath,
  }) as DocumentTemplateOrmEntity;

const tipoDocumento = (
  codigoAnexo: string,
  plantilla: DocumentTemplateOrmEntity | null,
): Partial<TipoDocumentoOrmEntity> => ({
  id: 1,
  codigoAnexo,
  nombre: `Documento ${codigoAnexo}`,
  codigoPlantilla: plantilla?.code ?? null,
  plantilla,
});

describe('RequirementsService.resolveTemplateCodes — plantilla del requisito (TSK-001.18, RF-18.1 b)', () => {
  let service: RequirementsService;
  let find: jest.Mock;

  beforeEach(async () => {
    find = jest
      .fn()
      .mockResolvedValue([
        tipoDocumento(
          'ANEXO_1',
          template('ANEXO_1', true, 'templates/anexo_1.docx'),
        ),
        tipoDocumento('ANEXO_2', template('ANEXO_2', true, undefined)),
        tipoDocumento(
          'ANEXO_4',
          template('ANEXO_4', false, 'templates/anexo_4.docx'),
        ),
        tipoDocumento(
          'CONSENTIMIENTO',
          template('ANEXO_3', true, 'templates/anexo_3.docx'),
        ),
        tipoDocumento('INSTRUMENTOS', null),
      ]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        {
          provide: getRepositoryToken(TipoDocumentoEstudioOrmEntity),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(StudyTypeOrmEntity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(TipoDocumentoOrmEntity),
          useValue: { find },
        },
      ],
    }).compile();
    service = module.get<RequirementsService>(RequirementsService);
  });

  const CODES = [
    'ANEXO_1',
    'ANEXO_2',
    'ANEXO_4',
    'CONSENTIMIENTO',
    'INSTRUMENTOS',
    'DECLARACION_CI',
  ];

  it('con plantilla activa y con archivo devuelve el código de la plantilla', async () => {
    const result = await service.resolveTemplateCodes(CODES);
    expect(result.get('ANEXO_1')).toBe('ANEXO_1');
    expect(result.get('CONSENTIMIENTO')).toBe('ANEXO_3');
  });

  it('con plantilla sin archivo devuelve null', async () => {
    const result = await service.resolveTemplateCodes(CODES);
    expect(result.get('ANEXO_2')).toBeNull();
  });

  it('con plantilla inactiva devuelve null', async () => {
    const result = await service.resolveTemplateCodes(CODES);
    expect(result.get('ANEXO_4')).toBeNull();
  });

  it('requisito sin relación con plantilla devuelve null', async () => {
    const result = await service.resolveTemplateCodes(CODES);
    expect(result.get('INSTRUMENTOS')).toBeNull();
  });

  it('código viejo que no está en el catálogo devuelve null', async () => {
    const result = await service.resolveTemplateCodes(CODES);
    expect(result.has('DECLARACION_CI')).toBe(true);
    expect(result.get('DECLARACION_CI')).toBeNull();
  });

  it('consulta el catálogo una sola vez, por codigo_anexo y con la relación plantilla', async () => {
    await service.resolveTemplateCodes([...CODES, 'ANEXO_1', '']);
    expect(find).toHaveBeenCalledTimes(1);
    const calls = find.mock.calls as Array<
      [{ where: { codigoAnexo: { value: string[] } }; relations: string[] }]
    >;
    const arg = calls[0][0];
    expect(arg.where.codigoAnexo.value).toEqual(CODES);
    expect(arg.relations).toEqual(['plantilla']);
  });

  it('sin códigos no consulta el catálogo', async () => {
    const result = await service.resolveTemplateCodes([]);
    expect(result.size).toBe(0);
    expect(find).not.toHaveBeenCalled();
  });
});

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListProtocolsQueryDto } from './list-protocols-query.dto';
import { ProtocolStage } from '../../domain/enums/protocol-stage.enum';

async function check(
  query: Record<string, string>,
): Promise<{ dto: ListProtocolsQueryDto; errors: string[] }> {
  const dto = plainToInstance(ListProtocolsQueryDto, query);
  const result = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errors: result.map((e) => e.property) };
}

describe('ListProtocolsQueryDto (RF-EST.3, TSK-001.4)', () => {
  describe('year', () => {
    it.each(['2000', '2026', '2100'])('acepta %s', async (year) => {
      const { dto, errors } = await check({ year });
      expect(errors).toEqual([]);
      expect(dto.year).toBe(Number(year));
    });

    it.each(['1999', '2101', '2026.5', 'abc'])('rechaza %s', async (year) => {
      const { errors } = await check({ year });
      expect(errors).toEqual(['year']);
    });
  });

  describe('etapa', () => {
    it.each(Object.values(ProtocolStage))('acepta %s', async (etapa) => {
      const { errors } = await check({ etapa });
      expect(errors).toEqual([]);
    });

    it.each(['RIESGO', 'recepcion', ''])('rechaza "%s"', async (etapa) => {
      const { errors } = await check({ etapa });
      expect(errors).toEqual(['etapa']);
    });
  });

  describe('search', () => {
    it('recorta el término', async () => {
      const { dto, errors } = await check({ search: '  CEISH-01  ' });
      expect(errors).toEqual([]);
      expect(dto.search).toBe('CEISH-01');
    });

    it.each(['', '   '])('vacío ("%s") se ignora', async (search) => {
      const { dto, errors } = await check({ search });
      expect(errors).toEqual([]);
      expect(dto.search).toBeUndefined();
    });

    it('acepta 100 caracteres (con espacios alrededor)', async () => {
      const { errors } = await check({ search: `  ${'a'.repeat(100)}  ` });
      expect(errors).toEqual([]);
    });

    it('rechaza 101 caracteres', async () => {
      const { errors } = await check({ search: 'a'.repeat(101) });
      expect(errors).toEqual(['search']);
    });
  });

  describe('limit', () => {
    it('por defecto 20', async () => {
      const { dto, errors } = await check({});
      expect(errors).toEqual([]);
      expect(dto.limit).toBe(20);
    });

    it('acepta 100', async () => {
      const { errors } = await check({ limit: '100' });
      expect(errors).toEqual([]);
    });

    it.each(['101', '0'])('rechaza %s', async (limit) => {
      const { errors } = await check({ limit });
      expect(errors).toEqual(['limit']);
    });
  });

  it('sigue aceptando los filtros existentes', async () => {
    const { errors } = await check({
      statusId: '14',
      page: '2',
      investigatorId: '5',
    });
    expect(errors).toEqual([]);
  });

  it('rechaza un parámetro desconocido', async () => {
    const { errors } = await check({ foo: 'x' });
    expect(errors).toEqual(['foo']);
  });
});

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProtocolDto } from './create-protocol.dto';

const RANGE_MESSAGE = 'El título debe tener entre 20 y 200 caracteres';

function validPayload(title: unknown): Record<string, unknown> {
  return {
    title,
    principalInvestigatorId: 1,
    studyTypeId: 1,
    isAffidavitAccepted: true,
    investigators: [],
    institutions: [],
  };
}

async function check(title: unknown): Promise<{
  dto: CreateProtocolDto;
  errors: string[];
  messages: string[];
}> {
  const dto = plainToInstance(CreateProtocolDto, validPayload(title));
  const result = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return {
    dto,
    errors: result.map((e) => e.property),
    messages: result.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('CreateProtocolDto.title (RF-02.2, TSK-001.8)', () => {
  it('19 caracteres → error con el mensaje del rango', async () => {
    const { errors, messages } = await check('a'.repeat(19));
    expect(errors).toEqual(['title']);
    expect(messages).toContain(RANGE_MESSAGE);
  });

  it('20 caracteres → válido', async () => {
    const { dto, errors } = await check('a'.repeat(20));
    expect(errors).toEqual([]);
    expect(dto.title).toBe('a'.repeat(20));
  });

  it('200 caracteres → válido', async () => {
    const { errors } = await check('a'.repeat(200));
    expect(errors).toEqual([]);
  });

  it('201 caracteres → error con el mensaje del rango', async () => {
    const { errors, messages } = await check('a'.repeat(201));
    expect(errors).toEqual(['title']);
    expect(messages).toContain(RANGE_MESSAGE);
  });

  it('"   " + 19 caracteres + "   " → error (se valida después del recorte)', async () => {
    const { errors, messages } = await check(`   ${'a'.repeat(19)}   `);
    expect(errors).toEqual(['title']);
    expect(messages).toContain(RANGE_MESSAGE);
  });

  it('"  " + 20 caracteres + "  " → válido y queda sin espacios', async () => {
    const { dto, errors } = await check(`  ${'a'.repeat(20)}  `);
    expect(errors).toEqual([]);
    expect(dto.title).toBe('a'.repeat(20));
  });

  it('solo espacios → error', async () => {
    const { dto, errors } = await check(' '.repeat(30));
    expect(errors).toEqual(['title']);
    expect(dto.title).toBe('');
  });

  it.each([123456789012345, true, null, undefined, ['a'.repeat(25)]])(
    'valor que no es string (%p) → error',
    async (value) => {
      const { errors } = await check(value);
      expect(errors).toEqual(['title']);
    },
  );
});

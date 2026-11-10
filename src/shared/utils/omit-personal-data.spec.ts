import { omitPersonalData } from './omit-personal-data';

const KEYS = ['identification', 'phone', 'sponsorPhone'];

describe('omitPersonalData (spec-001 RF-02.6 b, TSK-001.9)', () => {
  const body = () => ({
    title: 'Estudio de prueba',
    sponsorPhone: '0990000001',
    financingAmount: 100,
    isMulticentric: false,
    investigators: [
      {
        fullName: 'Persona Ficticia',
        identification: '9900000001',
        phone: '0990000002',
        email: 'ficticia@example.test',
      },
    ],
    institutions: [{ name: 'Institución', contact: { phone: '0990000003' } }],
  });

  it('quita las claves del primer nivel', () => {
    expect(omitPersonalData(body(), KEYS)).not.toHaveProperty('sponsorPhone');
  });

  it('quita las claves dentro de los arreglos y de objetos anidados', () => {
    const out = omitPersonalData(body(), KEYS);
    expect(out.investigators[0]).not.toHaveProperty('identification');
    expect(out.investigators[0]).not.toHaveProperty('phone');
    expect(out.institutions[0].contact).not.toHaveProperty('phone');
    expect(JSON.stringify(out)).not.toMatch(/099000000[123]|9900000001/);
  });

  it('no toca los demás campos', () => {
    expect(omitPersonalData(body(), KEYS)).toEqual({
      title: 'Estudio de prueba',
      financingAmount: 100,
      isMulticentric: false,
      investigators: [
        { fullName: 'Persona Ficticia', email: 'ficticia@example.test' },
      ],
      institutions: [{ name: 'Institución', contact: {} }],
    });
  });

  it('no modifica el objeto original', () => {
    const original = body();
    const snapshot = JSON.parse(JSON.stringify(original)) as unknown;
    const out = omitPersonalData(original, KEYS);
    expect(original).toEqual(snapshot);
    expect(out).not.toBe(original);
    expect(out.investigators).not.toBe(original.investigators);
  });

  it('devuelve tal cual los valores que no son objetos ni arreglos', () => {
    expect(omitPersonalData(null, KEYS)).toBeNull();
    expect(omitPersonalData(undefined, KEYS)).toBeUndefined();
    expect(omitPersonalData('texto', KEYS)).toBe('texto');
    const date = new Date(0);
    expect(omitPersonalData(date, KEYS)).toBe(date);
  });
});

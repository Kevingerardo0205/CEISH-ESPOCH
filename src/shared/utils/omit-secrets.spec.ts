import { omitSecrets } from './omit-secrets';

describe('omitSecrets (spec-001 RF-AUD.1 a, TSK-001.15)', () => {
  const body = () => ({
    email: 'persona@example.test',
    fullName: 'Persona Ficticia',
    password: 'valor-ficticio-1',
    token: 'valor-ficticio-2',
    codigo_anexo: 'ANEXO_5',
    code: 'REQ_A',
    profile: {
      Password: 'valor-ficticio-3',
      refresh_token: 'valor-ficticio-4',
      'access-token': 'valor-ficticio-5',
      newPassword: 'valor-ficticio-6',
      position: 'Docente',
    },
    items: [
      { currentPassword: 'valor-ficticio-7', name: 'uno' },
      { CONFIRM_PASSWORD: 'valor-ficticio-8', name: 'dos' },
      {
        secret: 'valor-ficticio-9',
        otp: '123456',
        contrasena: 'x',
        name: 'tres',
      },
      { accessToken: 'valor-ficticio-10', RefreshToken: 'valor-ficticio-11' },
    ],
  });

  it('quita password y token del primer nivel', () => {
    const out = omitSecrets(body());
    expect(out).not.toHaveProperty('password');
    expect(out).not.toHaveProperty('token');
  });

  it('quita las variantes Password, refresh_token, access-token y newPassword en objetos anidados', () => {
    const out = omitSecrets(body());
    expect(out.profile).toEqual({ position: 'Docente' });
  });

  it('quita las claves secretas dentro de los arreglos (con mayúsculas y guiones bajos)', () => {
    const out = omitSecrets(body());
    expect(out.items).toEqual([
      { name: 'uno' },
      { name: 'dos' },
      { name: 'tres' },
      {},
    ]);
    expect(JSON.stringify(out)).not.toMatch(/valor-ficticio|123456/);
  });

  it('deja codigo_anexo, code y los demás campos', () => {
    const out = omitSecrets(body());
    expect(out.codigo_anexo).toBe('ANEXO_5');
    expect(out.code).toBe('REQ_A');
    expect(out.email).toBe('persona@example.test');
    expect(out.fullName).toBe('Persona Ficticia');
  });

  it('quita la clave aunque el valor sea un hash bcrypt', () => {
    expect(
      omitSecrets({ password: '$2b$10$abcdefghijklmnopqrstuv', a: 1 }),
    ).toEqual({ a: 1 });
  });

  it('no modifica el objeto original', () => {
    const original = body();
    const snapshot = JSON.parse(JSON.stringify(original)) as unknown;
    const out = omitSecrets(original);
    expect(original).toEqual(snapshot);
    expect(out).not.toBe(original);
    expect(out.items).not.toBe(original.items);
  });

  it('devuelve tal cual los valores que no son objetos ni arreglos', () => {
    expect(omitSecrets(null)).toBeNull();
    expect(omitSecrets(undefined)).toBeUndefined();
    expect(omitSecrets('texto')).toBe('texto');
    const date = new Date(0);
    expect(omitSecrets(date)).toBe(date);
  });
});

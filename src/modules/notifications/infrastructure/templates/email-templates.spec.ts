import { getReceptionIncompleteTemplate } from './email-templates';

describe('getReceptionIncompleteTemplate (TSK-015-N05 C1)', () => {
  it('contains the provided plazo value and NOT hardcoded 30', () => {
    const html = getReceptionIncompleteTemplate(
      'María García',
      'Protocolo de Prueba',
      '- Documento A\n- Documento B',
      '2026-11-15',
      20,
    );
    expect(html).toContain('20 días hábiles');
    expect(html).not.toContain('30 días hábiles');
  });

  it('uses the exact plazo=30 when passed explicitly', () => {
    const html = getReceptionIncompleteTemplate(
      'Juan Pérez',
      'Protocolo Estudio',
      '- Consentimiento',
      '2026-12-01',
      30,
    );
    expect(html).toContain('30 días hábiles');
  });

  it('includes the deadline date in the output', () => {
    const html = getReceptionIncompleteTemplate(
      'Ana López',
      'Estudio X',
      '- Formulario',
      '2027-01-10',
      15,
    );
    expect(html).toContain('2027-01-10');
    expect(html).toContain('15 días hábiles');
  });
});

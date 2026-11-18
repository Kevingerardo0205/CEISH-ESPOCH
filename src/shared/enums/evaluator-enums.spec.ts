import {
  EvaluatorProfile,
  AssignmentStatus,
  ReassignmentReason,
  toEvaluatorProfile,
} from './evaluator-enums';

describe('Evaluator Domain Enums (TSK-002-01)', () => {
  it('should define all 4 mandatory evaluator profiles', () => {
    expect(EvaluatorProfile.JURIDICO).toBe('JURIDICO');
    expect(EvaluatorProfile.SOCIEDAD_CIVIL).toBe('SOCIEDAD_CIVIL');
    expect(EvaluatorProfile.METODOLOGICO).toBe('METODOLOGICO');
    expect(EvaluatorProfile.SALUD).toBe('SALUD');
  });

  it('should define all mandatory assignment statuses', () => {
    expect(AssignmentStatus.ASSIGNED).toBe('ASSIGNED');
    expect(AssignmentStatus.SUBMITTED).toBe('SUBMITTED');
    expect(AssignmentStatus.REASIGNED_VENCIMIENTO).toBe(
      'REASIGNED_VENCIMIENTO',
    );
    expect(AssignmentStatus.REASIGNED_COI).toBe('REASIGNED_COI');
  });

  it('should define all mandatory reassignment reasons', () => {
    expect(ReassignmentReason.VENCIMIENTO).toBe('VENCIMIENTO');
    expect(ReassignmentReason.CONFLICTO_INTERES).toBe('CONFLICTO_INTERES');
  });
});

const P = EvaluatorProfile;
type R = EvaluatorProfile | null;

describe('toEvaluatorProfile (TSK-002-N50)', () => {
  it.each<[string | null | undefined, R]>([
    ['Bioético', P.BIOETICO],
    ['Bioetico', P.BIOETICO],
    ['BIOÉTICA', P.BIOETICO],
    ['BIOETICA', P.BIOETICO],
    ['  Bioético  ', P.BIOETICO],
    ['Ético', null],
    ['Etico', null],
    ['ÉTICO', null],
    ['EVALUACION ETICA', null],
    ['Metodológico', P.METODOLOGICO],
    ['Salud', P.SALUD],
    ['Jurídico', P.JURIDICO],
    ['Sociedad Civil', P.SOCIEDAD_CIVIL],
    ['', null],
    ['   ', null],
    [null, null],
    [undefined, null],
    ['Desconocido', null],
  ])('%p → %p', (name, expected) => {
    expect(toEvaluatorProfile(name)).toBe(expected);
  });
});

/**
 * Tabla de equivalencia con las dos funciones que reemplaza toEvaluatorProfile:
 * resolveEvaluatorProfile (src/shared/helpers, usada por active-assignments y
 * el historial de reasignación) y mapProfileNameToEnum (adaptador de
 * asignación). Columnas: nombre, resultado de cada función ANTES de
 * TSK-002-N50 y resultado de toEvaluatorProfile. Los únicos cambios
 * permitidos (regla decidida el 18/11/2026) van marcados en `permitido`.
 */
type Fila = {
  name: string;
  helperAntes: R;
  adapterAntes: R;
  ahora: R;
  permitido?: 'helper' | 'adapter' | 'ambos';
};
const EQUIVALENCIA: Fila[] = [
  // Nombres del catálogo y variantes: las dos funciones coincidían.
  {
    name: 'Jurídico',
    helperAntes: P.JURIDICO,
    adapterAntes: P.JURIDICO,
    ahora: P.JURIDICO,
  },
  {
    name: 'JURIDICO',
    helperAntes: P.JURIDICO,
    adapterAntes: P.JURIDICO,
    ahora: P.JURIDICO,
  },
  {
    name: '  Jurídico  ',
    helperAntes: P.JURIDICO,
    adapterAntes: P.JURIDICO,
    ahora: P.JURIDICO,
  },
  {
    name: 'Sociedad Civil',
    helperAntes: P.SOCIEDAD_CIVIL,
    adapterAntes: P.SOCIEDAD_CIVIL,
    ahora: P.SOCIEDAD_CIVIL,
  },
  {
    name: 'SOCIEDAD_CIVIL',
    helperAntes: P.SOCIEDAD_CIVIL,
    adapterAntes: P.SOCIEDAD_CIVIL,
    ahora: P.SOCIEDAD_CIVIL,
  },
  {
    name: '  Sociedad Civil ',
    helperAntes: P.SOCIEDAD_CIVIL,
    adapterAntes: P.SOCIEDAD_CIVIL,
    ahora: P.SOCIEDAD_CIVIL,
  },
  {
    name: 'Metodológico',
    helperAntes: P.METODOLOGICO,
    adapterAntes: P.METODOLOGICO,
    ahora: P.METODOLOGICO,
  },
  {
    name: 'METODOLOGICO',
    helperAntes: P.METODOLOGICO,
    adapterAntes: P.METODOLOGICO,
    ahora: P.METODOLOGICO,
  },
  {
    name: ' Metodológico ',
    helperAntes: P.METODOLOGICO,
    adapterAntes: P.METODOLOGICO,
    ahora: P.METODOLOGICO,
  },
  {
    name: 'Metodología de la Investigación',
    helperAntes: P.METODOLOGICO,
    adapterAntes: P.METODOLOGICO,
    ahora: P.METODOLOGICO,
  },
  {
    name: 'Salud',
    helperAntes: P.SALUD,
    adapterAntes: P.SALUD,
    ahora: P.SALUD,
  },
  {
    name: 'SALUD',
    helperAntes: P.SALUD,
    adapterAntes: P.SALUD,
    ahora: P.SALUD,
  },
  {
    name: ' Salud ',
    helperAntes: P.SALUD,
    adapterAntes: P.SALUD,
    ahora: P.SALUD,
  },
  {
    name: 'Salud y Medicina',
    helperAntes: P.SALUD,
    adapterAntes: P.SALUD,
    ahora: P.SALUD,
  },
  { name: '', helperAntes: null, adapterAntes: null, ahora: null },
  { name: 'Desconocido', helperAntes: null, adapterAntes: null, ahora: null },
  { name: 'Ético', helperAntes: null, adapterAntes: null, ahora: null },
  { name: 'Etico', helperAntes: null, adapterAntes: null, ahora: null },
  {
    name: 'EVALUACION ETICA',
    helperAntes: null,
    adapterAntes: null,
    ahora: null,
  },
  // Sinónimos que solo reconocía el adaptador: cambian en los usuarios del helper.
  {
    name: 'Legal',
    helperAntes: null,
    adapterAntes: P.JURIDICO,
    ahora: P.JURIDICO,
    permitido: 'helper',
  },
  {
    name: 'Asesoría Legal',
    helperAntes: null,
    adapterAntes: P.JURIDICO,
    ahora: P.JURIDICO,
    permitido: 'helper',
  },
  {
    name: 'Medicina Legal',
    helperAntes: null,
    adapterAntes: P.JURIDICO,
    ahora: P.JURIDICO,
    permitido: 'helper',
  },
  {
    name: 'Civil',
    helperAntes: null,
    adapterAntes: P.SOCIEDAD_CIVIL,
    ahora: P.SOCIEDAD_CIVIL,
    permitido: 'helper',
  },
  {
    name: 'Comunidad',
    helperAntes: null,
    adapterAntes: P.SOCIEDAD_CIVIL,
    ahora: P.SOCIEDAD_CIVIL,
    permitido: 'helper',
  },
  {
    name: ' Comunidad ',
    helperAntes: null,
    adapterAntes: P.SOCIEDAD_CIVIL,
    ahora: P.SOCIEDAD_CIVIL,
    permitido: 'helper',
  },
  {
    name: 'Investigación',
    helperAntes: null,
    adapterAntes: P.METODOLOGICO,
    ahora: P.METODOLOGICO,
    permitido: 'helper',
  },
  {
    name: 'Médico',
    helperAntes: null,
    adapterAntes: P.SALUD,
    ahora: P.SALUD,
    permitido: 'helper',
  },
  {
    name: 'Clínico',
    helperAntes: null,
    adapterAntes: P.SALUD,
    ahora: P.SALUD,
    permitido: 'helper',
  },
  // Prefijo METODOL que solo reconocía el helper: cambia en el adaptador.
  {
    name: 'Metodol',
    helperAntes: P.METODOLOGICO,
    adapterAntes: null,
    ahora: P.METODOLOGICO,
    permitido: 'adapter',
  },
  // Conflicto de orden: gana el orden del adaptador.
  {
    name: 'Investigación en Salud',
    helperAntes: P.SALUD,
    adapterAntes: P.METODOLOGICO,
    ahora: P.METODOLOGICO,
    permitido: 'helper',
  },
  // Bioético → BIOETICO en todos.
  {
    name: 'Bioético',
    helperAntes: null,
    adapterAntes: null,
    ahora: P.BIOETICO,
    permitido: 'ambos',
  },
  {
    name: 'BIOÉTICA',
    helperAntes: null,
    adapterAntes: null,
    ahora: P.BIOETICO,
    permitido: 'ambos',
  },
];

describe('toEvaluatorProfile — equivalencia con las funciones anteriores (TSK-002-N50)', () => {
  it.each(EQUIVALENCIA)('$name', (f) => {
    expect(toEvaluatorProfile(f.name)).toBe(f.ahora);
    if (f.permitido !== 'helper' && f.permitido !== 'ambos') {
      expect(f.ahora).toBe(f.helperAntes);
    }
    if (f.permitido !== 'adapter' && f.permitido !== 'ambos') {
      expect(f.ahora).toBe(f.adapterAntes);
    }
  });

  it('ningún sinónimo atrapa «Bioético» ni «Ético»', () => {
    expect(toEvaluatorProfile('Bioético')).toBe(P.BIOETICO);
    expect(toEvaluatorProfile('Ético')).toBeNull();
  });
});

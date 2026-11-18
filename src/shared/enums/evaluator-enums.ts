export enum EvaluatorProfile {
  JURIDICO = 'JURIDICO',
  SOCIEDAD_CIVIL = 'SOCIEDAD_CIVIL',
  METODOLOGICO = 'METODOLOGICO',
  SALUD = 'SALUD',
  BIOETICO = 'BIOETICO',
}

/**
 * Única conversión del nombre de un perfil del catálogo a EvaluatorProfile
 * (TSK-002-N50). Normaliza tildes, mayúsculas y espacios. «Bioético» se
 * reconoce por el prefijo «BIOETIC» antes que cualquier otra regla, así que
 * «Ético» o «EVALUACION ETICA» no se resuelven como Bioético.
 */
export function toEvaluatorProfile(
  name?: string | null,
): EvaluatorProfile | null {
  if (!name) return null;
  const norm = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
  if (!norm) return null;

  if (norm.startsWith('BIOETIC')) return EvaluatorProfile.BIOETICO;
  if (norm.includes('JURIDIC') || norm.includes('LEGAL')) {
    return EvaluatorProfile.JURIDICO;
  }
  if (
    norm.includes('SOCIEDAD') ||
    norm.includes('CIVIL') ||
    norm.includes('COMUNIDAD')
  ) {
    return EvaluatorProfile.SOCIEDAD_CIVIL;
  }
  if (norm.includes('METODOL') || norm.includes('INVESTIGACION')) {
    return EvaluatorProfile.METODOLOGICO;
  }
  if (
    norm.includes('SALUD') ||
    norm.includes('MEDIC') ||
    norm.includes('CLINIC')
  ) {
    return EvaluatorProfile.SALUD;
  }
  return null;
}

export enum AssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  SUBMITTED = 'SUBMITTED',
  REASIGNED_VENCIMIENTO = 'REASIGNED_VENCIMIENTO',
  REASIGNED_COI = 'REASIGNED_COI',
}

export enum ReassignmentReason {
  VENCIMIENTO = 'VENCIMIENTO',
  CONFLICTO_INTERES = 'CONFLICTO_INTERES',
}

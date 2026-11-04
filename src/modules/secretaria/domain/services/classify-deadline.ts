import { toCalendarDateString } from '../../../../shared/services/deadline-calculator.service';
import { DeadlineGroup } from '../pending-item';

/** 12:00 en Ecuador (UTC-5) expresado en UTC: un instante seguro dentro del día. */
const NOON_ECUADOR_UTC_HOUR = 17;

/**
 * Domingo (YYYY-MM-DD) de la semana de `dateString`; la semana va de lunes a domingo.
 * Solo aritmética de calendario; el formateo usa `toCalendarDateString`.
 */
export function sundayOfWeek(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = domingo
  const daysToSunday = (7 - dayOfWeek) % 7;
  return toCalendarDateString(
    new Date(
      Date.UTC(year, month - 1, day + daysToSunday, NOON_ECUADOR_UTC_HOUR),
    ),
  );
}

/**
 * spec-003 RF-ALR.f.2: grupo de plazo de una fila.
 * `now` es NOW() de la base; las fechas de calendario se toman en America/Guayaquil.
 */
export function classifyDeadline(
  deadline: Date | null,
  now: Date,
): DeadlineGroup {
  if (!deadline) return DeadlineGroup.SIN_PLAZO;
  if (deadline.getTime() < now.getTime()) return DeadlineGroup.VENCIDO;

  const today = toCalendarDateString(now);
  const deadlineDay = toCalendarDateString(deadline);
  if (deadlineDay === today) return DeadlineGroup.HOY;
  if (deadlineDay <= sundayOfWeek(today)) return DeadlineGroup.SEMANA;
  return DeadlineGroup.PROXIMO;
}

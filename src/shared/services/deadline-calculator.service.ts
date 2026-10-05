export interface CalculateDeadlineInput {
  startDate: Date;
  businessDaysToAdd: number;
  holidays: string[];
}

export function toCalendarDateString(date: Date): string {
  const ectFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return ectFormatter.format(date);
}

export interface DeadlineCalculationResult {
  /**
   * Instante exacto de fin de día en hora de Ecuador (23:59:59.999 ECT = 04:59:59.999Z día siguiente)
   */
  deadlineInstant: Date;
  /**
   * Fecha de calendario en Ecuador formateada como YYYY-MM-DD (apropiada para columnas tipo 'date')
   */
  deadlineDateString: string;
  /**
   * Objeto Date en UTC medianoche correspondiente a la fecha de calendario de Ecuador (YYYY-MM-DD 00:00:00.000Z)
   * que garantiza que al persistir en TypeORM/PostgreSQL en columnas 'date' se guarde el día local exacto.
   */
  deadlineDate: Date;
}

/**
 * Converts a YYYY-MM-DD calendar date to the instant 23:59:59.999 ECT (UTC-5).
 * Use this when comparing a stored 'date' column against "now" so the deadline
 * day is not treated as expired until after midnight Ecuador time.
 * Example: '2026-03-12' → 2026-03-13T04:59:59.999Z
 */
export function endOfDayGuayaquil(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // ECT = UTC-5 → add 5 h to get the UTC equivalent of 23:59:59.999 ECT
  const ECUADOR_OFFSET_ABS_MS = 5 * 60 * 60 * 1000;
  return new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) + ECUADOR_OFFSET_ABS_MS,
  );
}

export class BusinessDayCalculator {
  // Offset fijo de Ecuador (America/Guayaquil): UTC-5 horas sin horario de verano
  private static readonly ECUADOR_OFFSET_HOURS = -5;

  public static calculateDetailedDeadline(
    input: CalculateDeadlineInput,
  ): DeadlineCalculationResult {
    const { startDate, businessDaysToAdd, holidays } = input;
    const holidaySet = new Set(holidays);

    // Convertir a tiempo local de Ecuador (UTC-5)
    const ecuadorShiftMs = this.ECUADOR_OFFSET_HOURS * 60 * 60 * 1000;
    const localEcuadorTime = new Date(startDate.getTime() + ecuadorShiftMs);

    let year = localEcuadorTime.getUTCFullYear();
    let month = localEcuadorTime.getUTCMonth();
    let day = localEcuadorTime.getUTCDate();

    let addedDays = 0;
    while (addedDays < businessDaysToAdd) {
      const nextDay = new Date(Date.UTC(year, month, day + 1));
      year = nextDay.getUTCFullYear();
      month = nextDay.getUTCMonth();
      day = nextDay.getUTCDate();

      const dayOfWeek = nextDay.getUTCDay();
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateString = `${year}-${monthStr}-${dayStr}`;

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dateString);

      if (!isWeekend && !isHoliday) {
        addedDays++;
      }
    }

    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const deadlineDateString = `${year}-${monthStr}-${dayStr}`;

    // Fecha UTC a medianoche para columnas PostgreSQL 'date'
    const deadlineDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));

    // 23:59:59.999 en hora de Ecuador (UTC-5) = 04:59:59.999 UTC del día siguiente
    const deadlineInstantMs =
      Date.UTC(year, month, day, 23, 59, 59, 999) - ecuadorShiftMs;
    const deadlineInstant = new Date(deadlineInstantMs);

    return {
      deadlineInstant,
      deadlineDateString,
      deadlineDate,
    };
  }

  /**
   * Retorna la fecha para columnas de tipo 'date' (alineada a medianoche UTC con la fecha local de Ecuador).
   */
  public static calculateDeadline(input: CalculateDeadlineInput): Date {
    return this.calculateDetailedDeadline(input).deadlineDate;
  }

  /**
   * Retorna la fecha local en formato string 'YYYY-MM-DD'.
   */
  public static calculateDeadlineDateString(
    input: CalculateDeadlineInput,
  ): string {
    return this.calculateDetailedDeadline(input).deadlineDateString;
  }

  /**
   * Retorna el instante exacto de fin de día (23:59:59.999 ECT = 04:59:59.999Z).
   */
  public static calculateDeadlineInstant(
    input: CalculateDeadlineInput,
  ): Date {
    return this.calculateDetailedDeadline(input).deadlineInstant;
  }
}

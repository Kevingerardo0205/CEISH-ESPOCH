export interface CalculateDeadlineInput {
  startDate: Date;
  businessDaysToAdd: number;
  holidays: string[];
}

export class BusinessDayCalculator {
  // Offset fijo de Ecuador (America/Guayaquil): UTC-5 horas sin horario de verano
  private static readonly ECUADOR_OFFSET_HOURS = -5;

  public static calculateDeadline(input: CalculateDeadlineInput): Date {
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

    // 23:59:59.999 en hora de Ecuador (UTC-5) = 04:59:59.999 UTC del día siguiente
    const deadlineUtcMs =
      Date.UTC(year, month, day, 23, 59, 59, 999) - ecuadorShiftMs;
    return new Date(deadlineUtcMs);
  }
}

export interface CalculateDeadlineInput {
  startDate: Date;
  businessDaysToAdd: number;
  holidays: string[];
}

export class BusinessDayCalculator {
  public static calculateDeadline(input: CalculateDeadlineInput): Date {
    const { startDate, businessDaysToAdd, holidays } = input;
    const holidaySet = new Set(holidays);
    const currentDate = new Date(startDate);

    currentDate.setUTCHours(0, 0, 0, 0);

    let addedDays = 0;
    while (addedDays < businessDaysToAdd) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      const dayOfWeek = currentDate.getUTCDay();
      const dateString = currentDate.toISOString().split('T')[0];

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dateString);

      if (!isWeekend && !isHoliday) {
        addedDays++;
      }
    }

    currentDate.setUTCHours(23, 59, 59, 999);
    return currentDate;
  }
}

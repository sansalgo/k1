import { differenceInCalendarDays, startOfYear, endOfYear } from "date-fns";

export function toDecimalYear(
  year: number,
  month: number,
  day: number = 1
): number {
  const date = new Date(year, month, day);
  const start = startOfYear(date);
  const end = endOfYear(date);

  const dayOfYear = differenceInCalendarDays(date, start);
  const totalDays = differenceInCalendarDays(end, start) + 1;

  const decimalYear = year + dayOfYear / totalDays;
  return parseFloat(decimalYear.toFixed(2));
}

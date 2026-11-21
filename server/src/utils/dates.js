export const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
export const monthStart = (date, offset = 0) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
export const monthKey = (date) => date.toISOString().slice(0, 7);
export function monthBounds(month) {
  const start = new Date(month + '-01T00:00:00.000Z');
  return { start, end: monthStart(start, 1) };
}
export function monday(date) {
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day;
}

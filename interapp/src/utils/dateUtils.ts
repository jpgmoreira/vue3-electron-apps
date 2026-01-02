const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * @param date Numeric date in the format YYYYMMDD.
 * @returns Array of numbers containing [day, month, year]. Month is in the range (1 - 12).
 */
function dmy(date: number): [number, number, number] {
  const day = date % 100;
  const month = Math.floor(date / 100) % 100;
  const year = Math.floor(date / 10000);
  return [day, month, year];
}

/**
 * Converts numeric date format to Date object.
 * @param date Date in the format YYYYMMDD.
 * @returns Date object for the date provided, at 00:00 UTC.
 */
function fromNumericDate(date: number): Date {
  const [d, m, y] = dmy(date);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Converts Date object to numeric date format.
 * @param date Date object.
 * @returns Number in the format YYYYMMDD, with the date provided.
 */
function toNumericDate(date: Date): number {
  const YYYY = date.getUTCFullYear();
  const MM = padZero(date.getUTCMonth() + 1);
  const DD = padZero(date.getUTCDate());
  return Number(`${YYYY}${MM}${DD}`);
}

/**
 * Converts a millisecond-based unix timestamp to date in the user's local time.
 * @param timestamp Timestamp in milliseconds.
 * @returns Date in the format "MM DD, YYYY – ${HH}:${mm}:${ss}" (month abbreviated).
 */
export function parseTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  const MM = monthNames[d.getMonth()];
  const DD = padZero(d.getDate());
  const YYYY = d.getFullYear();
  const HH = padZero(d.getHours());
  const mm = padZero(d.getMinutes());
  const ss = padZero(d.getSeconds());
  return `${MM} ${DD}, ${YYYY} – ${HH}:${mm}:${ss}`;
}

/**
 * Converts a numeric date to the format DD/MM/YYYY (month abbreviated).
 * @param date The date number in the format YYYYMMDD.
 * @returns Date in the format "DD/MM/YYYY".
 */
export function parseNumericDate(date: number): string {
  const [d, m, y] = dmy(date);
  const day = padZero(d);
  const month = monthNames[m - 1];
  return `${day}/${month}/${y}`;
}

/**
 * Add one day to the date.
 * @param date Date in the format YYYYMMDD (number).
 * @returns Date in the same format, 1 day ahead (number).
 */
export function incrementDate(date: number): number {
  const newDate = fromNumericDate(date);
  newDate.setUTCDate(newDate.getUTCDate() + 1);
  return toNumericDate(newDate);
}

/**
 * Returns a number in the format YYYYMMDD, containing the current date in the user's local time.
 */
export function getTodayDate(): number {
  const d = new Date();
  const MM = padZero(d.getMonth() + 1);
  const DD = padZero(d.getDate());
  const YYYY = d.getFullYear();
  return Number(`${YYYY}${MM}${DD}`);
}

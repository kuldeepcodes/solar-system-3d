/** Julian Date of the J2000.0 epoch (2000-01-01T12:00:00 TT). */
export const J2000 = 2451545.0;

const MS_PER_DAY = 86_400_000;

/** Julian Date of the Unix epoch (1970-01-01T00:00:00Z). */
const UNIX_EPOCH_JD = 2440587.5;

/** Convert a JavaScript `Date` to a Julian Date. */
export function dateToJulian(date: Date): number {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

/** Convert a Julian Date back to a JavaScript `Date`. */
export function julianToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * MS_PER_DAY);
}

/** Days elapsed since J2000.0 - the time variable every orbit solve uses. */
export function daysSinceJ2000(jd: number): number {
  return jd - J2000;
}

/** Julian Date "now", useful as the simulation's default start. */
export function nowJulian(): number {
  return dateToJulian(new Date());
}

/**
 * Human-readable simulation clock, e.g. "14 Mar 2026 · 08:31 UTC".
 * Always rendered in UTC so the display is reproducible across machines.
 */
export function formatJulian(jd: number): string {
  const d = julianToDate(jd);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const time = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  });
  return `${date} · ${time} UTC`;
}

/** ISO date (yyyy-mm-dd) for `<input type="date">` binding. */
export function julianToInputDate(jd: number): string {
  const iso = julianToDate(jd).toISOString();
  return iso.slice(0, 10);
}

/** Parse a `yyyy-mm-dd` string into a Julian Date at 00:00 UTC. */
export function inputDateToJulian(value: string): number | null {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return null;
  return parsed / MS_PER_DAY + UNIX_EPOCH_JD;
}

/**
 * Format a duration in days using the largest sensible unit.
 * Used by the spacecraft telemetry HUD and orbital period readouts.
 */
export function formatDuration(days: number): string {
  const abs = Math.abs(days);
  if (abs < 1 / 24) return `${(abs * 1440).toFixed(0)} minutes`;
  if (abs < 2) return `${(abs * 24).toFixed(1)} hours`;
  if (abs < 730) return `${abs.toFixed(1)} days`;
  return `${(abs / 365.25).toFixed(2)} years`;
}

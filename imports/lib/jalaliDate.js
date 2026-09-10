/**
 * Gregorian <-> Jalali (Persian / Solar Hijri) calendar display conversion.
 *
 * This is a DISPLAY-ONLY conversion helper for issue #4335: it never changes
 * how dates are stored (still native JS `Date`/Gregorian under the hood), it
 * only renders a Jalali string when the viewing user has opted in via
 * `profile.calendarSystem === 'jalali'`.
 *
 * The conversion below implements the well-known, widely published
 * astronomical/tabular algorithm for converting between the Gregorian and
 * Jalali calendars (the same public algorithm underlying many independent
 * open-source implementations, e.g. jalaali-js). It is written from scratch
 * from the algorithm's public description - it is NOT copied from any single
 * licensed source file - so there is no dependency license to track, and no
 * new npm package is added for it.
 */

// Break points of the 33-year Jalali leap-year cycle, as used by the
// standard algorithm (Kazimierz Borkowski's approximation of the Jalali
// calendar's astronomical leap-year rule).
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
  2192, 2262, 2324, 2394, 2456, 3178,
];

function div(a, b) {
  return Math.floor(a / b);
}

function mod(a, b) {
  return a - div(a, b) * b;
}

/**
 * Number of leap years from the start of Jalali era (474) up to (but not
 * including) Jalali year `jy`, using the 33-year break-point table.
 */
function jalCal(jy) {
  const bl = BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];

  if (jy < jp || jy >= BREAKS[bl - 1]) {
    throw new Error('Invalid Jalali year ' + jy);
  }

  let jump = 0;
  let jm;
  for (let i = 1; i < bl; i += 1) {
    jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;

  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, march };
}

function isGregorianLeap(gy) {
  return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
}

const GREGORIAN_DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const JALALI_DAYS_IN_MONTH = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

/**
 * Julian Day Number for a Gregorian calendar date, and its inverse.
 * Standard proleptic-Gregorian <-> JDN conversion (Fliegel & Van Flandern,
 * 1968) - a public, widely published integer algorithm, independent of the
 * Jalali-specific break-point table above.
 */
function g2d(gy, gm, gd) {
  const a = div(14 - gm, 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  return (
    gd +
    div(153 * m + 2, 5) +
    365 * y +
    div(y, 4) -
    div(y, 100) +
    div(y, 400) -
    32045
  );
}

/** Gregorian calendar date from a Julian Day Number. */
function d2g(jdn) {
  const a = jdn + 32044;
  const b = div(4 * a + 3, 146097);
  const c = a - div(146097 * b, 4);
  const d = div(4 * c + 3, 1461);
  const e = c - div(1461 * d, 4);
  const m = div(5 * e + 2, 153);
  const gd = e - div(153 * m + 2, 5) + 1;
  const gm = m + 3 - 12 * div(m, 10);
  const gy = 100 * b + d - 4800 + div(m, 10);
  return { gy, gm, gd };
}

/**
 * Convert a Gregorian calendar date to its Jalali (Solar Hijri) equivalent.
 * @param {number} gYear
 * @param {number} gMonth 1-12
 * @param {number} gDay 1-31
 * @returns {{jy: number, jm: number, jd: number}}
 */
export function gregorianToJalali(gYear, gMonth, gDay) {
  const jdn = g2d(gYear, gMonth, gDay);

  // Approximate Jalali year, then walk to the exact one via jalCal().
  let jy = gYear - 621;
  let { leap, march } = jalCal(jy);
  let jdn1f = g2d(gYear, 3, march);

  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    ({ leap, march } = jalCal(jy));
    jdn1f = g2d(gYear - 1, 3, march);
    k = jdn - jdn1f;
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  }
  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

/**
 * Convert a Jalali (Solar Hijri) calendar date to its Gregorian equivalent.
 * Provided for completeness/round-trip testing; not required by the
 * display-only scope of #4335 (input/date-pickers stay Gregorian).
 * @param {number} jy
 * @param {number} jm 1-12
 * @param {number} jd 1-31
 * @returns {{gy: number, gm: number, gd: number}}
 */
export function jalaliToGregorian(jy, jm, jd) {
  const { leap, march } = jalCal(jy);
  const jdn =
    g2d(jy + 621, 3, march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1;
  return d2g(jdn);
}

const JALALI_MONTH_NAMES_FA = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

function pad2(n) {
  return String(n).padStart(2, '0');
}

/**
 * Format a Date (or ISO string) as a Jalali display string.
 * @param {Date|string} date
 * @param {string} [formatString] - 'YYYY-MM-DD' (default), 'DD-MM-YYYY',
 *   'MM-DD-YYYY', or 'named' for "1 فروردین 1405".
 * @param {boolean} [includeTime]
 * @returns {string}
 */
export function formatJalaliDate(date, formatString = 'YYYY-MM-DD', includeTime = false) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const { jy, jm, jd } = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());

  let dateString;
  if (formatString === 'named') {
    dateString = `${jd} ${JALALI_MONTH_NAMES_FA[jm - 1]} ${jy}`;
  } else {
    const y = jy;
    const m = pad2(jm);
    const day = pad2(jd);
    switch (formatString) {
      case 'DD-MM-YYYY':
        dateString = `${day}-${m}-${y}`;
        break;
      case 'MM-DD-YYYY':
        dateString = `${m}-${day}-${y}`;
        break;
      case 'YYYY-MM-DD':
      default:
        dateString = `${y}-${m}-${day}`;
        break;
    }
  }

  if (includeTime) {
    const hours = pad2(d.getHours());
    const minutes = pad2(d.getMinutes());
    return `${dateString} ${hours}:${minutes}`;
  }

  return dateString;
}

export const JALALI_DAYS_IN_MONTH_TABLE = JALALI_DAYS_IN_MONTH;
export const GREGORIAN_DAYS_IN_MONTH_TABLE = GREGORIAN_DAYS_IN_MONTH;
export { isGregorianLeap };

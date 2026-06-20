/**
 * Pure helper that converts WeKan's stored "start day of week" user setting
 * into a FullCalendar `firstDay` value.
 *
 * Background (see issue #5521 "Calendar View does not respect the setting of
 * day of week start"):
 *
 * WeKan stores the start-of-week preference in `profile.startDayOfWeek`, read
 * via `User.getStartDayOfWeek()`. That value is already a zero-based day index
 * where 0 = Sunday, 1 = Monday, ... 6 = Saturday. This matches the convention
 * used by the user-settings dropdown (`weekDays` helper in userHeader.js, whose
 * options are Sunday..Saturday mapped to indexes 0..6) and the documented
 * default of 1 (Monday).
 *
 * FullCalendar's `firstDay` option uses the exact same convention: an integer
 * 0..6 where 0 = Sunday and 6 = Saturday. So the conversion is effectively the
 * identity, but we still validate/normalise the input here so that a bad or
 * missing setting (undefined, null, a string, an out-of-range number, or a day
 * name) can never break the calendar render. Anything we can't make sense of
 * falls back to WeKan's default of Monday (1).
 *
 * @param {number|string|undefined|null} startDayOfWeekSetting - The stored
 *   setting as returned by `User.getStartDayOfWeek()` (normally a number 0..6),
 *   or possibly a day name string.
 * @returns {number} A FullCalendar `firstDay` integer in the range 0..6
 *   (0 = Sunday .. 6 = Saturday).
 */
export function toFullCalendarFirstDay(startDayOfWeekSetting) {
  const DEFAULT_FIRST_DAY = 1; // Monday, matching User.getStartDayOfWeek()

  // Already a usable number (including numeric strings like "0").
  const asNumber = Number(startDayOfWeekSetting);
  if (
    startDayOfWeekSetting !== null &&
    startDayOfWeekSetting !== undefined &&
    startDayOfWeekSetting !== '' &&
    Number.isFinite(asNumber) &&
    Number.isInteger(asNumber) &&
    asNumber >= 0 &&
    asNumber <= 6
  ) {
    return asNumber;
  }

  // Tolerate a day name string ("sunday", "Monday", ...), just in case.
  if (typeof startDayOfWeekSetting === 'string') {
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const idx = dayNames.indexOf(startDayOfWeekSetting.trim().toLowerCase());
    if (idx !== -1) {
      return idx;
    }
  }

  return DEFAULT_FIRST_DAY;
}

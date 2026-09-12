'use strict';

// Unicode calendar identifiers implemented by Intl. Keep the existing profile
// names for Gregorian and Jalali so saved preferences remain compatible.
const CALENDAR_SYSTEMS = [
  { value: 'gregorian', intl: 'gregory' },
  { value: 'jalali', intl: 'persian' },
  ...['buddhist', 'chinese', 'coptic', 'dangi', 'ethioaa', 'ethiopic',
    'hebrew', 'indian', 'islamic', 'islamic-civil', 'islamic-rgsa',
    'islamic-tbla', 'islamic-umalqura', 'iso8601', 'japanese', 'roc']
    .map(value => ({ value, intl: value })),
].map(system => ({ ...system, labelKey: `calendar-system-${system.value}` }));
const CALENDAR_SYSTEM_IDS = CALENDAR_SYSTEMS.map(system => system.value);

function supportsCalendar(calendar) {
  try {
    return new Intl.DateTimeFormat('en', { calendar }).resolvedOptions().calendar === calendar;
  } catch (error) { return false; }
}

function availableCalendarSystems() {
  return CALENDAR_SYSTEMS.filter(system =>
    system.value === 'gregorian' || system.value === 'jalali' || supportsCalendar(system.intl));
}

function nativeCalendarParts(date, calendar, locale = 'en') {
  if (!supportsCalendar(calendar)) return null;
  try {
    let language = typeof locale === 'string' ? locale.split('@')[0].replace(/_/g, '-') : 'en';
    try { new Intl.DateTimeFormat(language); } catch (error) { language = 'en'; }
    const parts = new Intl.DateTimeFormat(language, {
      calendar, numberingSystem: 'latn', year: 'numeric', month: '2-digit',
      day: '2-digit', era: 'short',
    }).formatToParts(date).reduce((result, part) => {
      result[part.type] = part.value;
      return result;
    }, {});
    // Chinese and Korean calendars use relatedYear instead of year, and may
    // have a named leap month. Preserve those strings instead of parsing them.
    return { ...parts, year: parts.year || parts.relatedYear };
  } catch (error) { return null; }
}

function formatNativeCalendarDate(date, calendar, dateFormat, includeTime, locale = 'en') {
  const parts = nativeCalendarParts(date, calendar, locale);
  if (!parts || !parts.year || !parts.month || !parts.day) return null;
  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  let text = dateFormat === 'DD-MM-YYYY' ? `${day}-${month}-${year}`
    : dateFormat === 'MM-DD-YYYY' ? `${month}-${day}-${year}` : `${year}-${month}-${day}`;
  // Era-based years (notably Japanese and ROC) are ambiguous without the era.
  if (parts.era) text += ` ${parts.era}`;
  if (includeTime) {
    text += ` ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  return text;
}

module.exports = {
  CALENDAR_SYSTEMS, CALENDAR_SYSTEM_IDS, availableCalendarSystems,
  supportsCalendar, nativeCalendarParts, formatNativeCalendarDate,
};

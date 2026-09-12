import { ReactiveCache } from '/imports/reactiveCache';
import { formatDateByUserPreference } from '/imports/lib/dateUtils';
import { formatJalaliDate, gregorianToJalali } from '/imports/lib/jalaliDate';
import { TAPi18n } from '/imports/i18n';
const { CALENDAR_SYSTEMS, formatNativeCalendarDate, nativeCalendarParts } = require('/imports/lib/calendarSystems');
const { calendarMonthRange, shiftedDay } = require('/imports/lib/calendarMonth');

export function dateDisplayPreferences() {
  const user = ReactiveCache.getCurrentUser();
  if (user) {
    return {
      calendarSystem: user.getCalendarSystem ? user.getCalendarSystem() : 'gregorian',
      dateFormat: user.getDateFormat ? user.getDateFormat() : 'YYYY-MM-DD',
    };
  }
  try {
    return {
      calendarSystem: window.localStorage.getItem('calendarSystem') || 'gregorian',
      dateFormat: window.localStorage.getItem('dateFormat') || 'YYYY-MM-DD',
    };
  } catch (error) {
    return { calendarSystem: 'gregorian', dateFormat: 'YYYY-MM-DD' };
  }
}

// Only rendered text belongs here. ISO attributes, picker values and persisted
// dates must continue to use Gregorian formatting. A supplied callback keeps
// each existing Gregorian display's locale, precision and layout.
export function formatDateForDisplay(date, includeTime = true, gregorianFormatter) {
  if (date === null || date === undefined || date === '') return '';
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  const { calendarSystem, dateFormat } = dateDisplayPreferences();
  if (calendarSystem === 'jalali') {
    try {
      return formatJalaliDate(value, dateFormat, includeTime);
    } catch (error) {
      // Intl's Persian calendar covers dates beyond the tabular converter's
      // finite range without displaying a different calendar.
      return formatNativeCalendarDate(value, 'persian', dateFormat, includeTime, TAPi18n.getLanguage() || 'en') || '';
    }
  } else if (calendarSystem !== 'gregorian') {
    const system = CALENDAR_SYSTEMS.find(item => item.value === calendarSystem);
    const text = system && formatNativeCalendarDate(
      value, system.intl, dateFormat, includeTime, TAPi18n.getLanguage() || 'en',
    );
    if (system) return text || '';
  }
  return gregorianFormatter
    ? gregorianFormatter(value)
    : formatDateByUserPreference(value, dateFormat, includeTime);
}

// FullCalendar 5.11.5 exposes its displayed wall-calendar fields to formatting
// callbacks. Construct from those fields instead of shifting its UTC marker
// through the browser's time zone. Grid placement and navigation stay native.
export function calendarDateDisplayOptions(calendarId) {
  const { calendarSystem } = dateDisplayPreferences();
  if (calendarSystem === 'gregorian') return {};
  const system = CALENDAR_SYSTEMS.find(item => item.value === calendarSystem);
  if (!system) return {};
  const displayMarker = marker => formatDateForDisplay(
    new Date(marker.year, marker.month, marker.day, 12), false,
  );
  const navigate = direction => {
    const calendar = document.getElementById(calendarId)?._wekanCalendar;
    if (!calendar) return;
    if (calendar.view.type !== 'dayGridMonth') {
      calendar[direction < 0 ? 'prev' : 'next']();
      return;
    }
    const range = calendarMonthRange(calendar.getDate(), system.intl);
    calendar.gotoDate(direction < 0 ? shiftedDay(range.start, -1) : range.end);
  };
  return {
    views: {
      dayGridMonth: { visibleRange: date => calendarMonthRange(date, system.intl) },
    },
    customButtons: {
      prev: { text: TAPi18n.__('previous'), click: () => navigate(-1) },
      next: { text: TAPi18n.__('next'), click: () => navigate(1) },
    },
    titleFormat(info) {
      const start = displayMarker(info.start);
      const end = info.end && displayMarker(info.end);
      return end && end !== start ? `${start}${info.defaultSeparator || ' – '}${end}` : start;
    },
    dayCellContent(info) {
      try {
        if (calendarSystem !== 'jalali') {
          const parts = nativeCalendarParts(info.date, system.intl, TAPi18n.getLanguage() || 'en');
          return parts ? parts.day : info.dayNumberText;
        }
        return String(gregorianToJalali(
          info.date.getFullYear(), info.date.getMonth() + 1, info.date.getDate(),
        ).jd);
      } catch (error) {
        return info.dayNumberText;
      }
    },
    dayHeaderContent(info) {
      // Month-view column headings contain weekdays, with no date to convert.
      return info.view.type === 'dayGridMonth'
        ? info.text : formatDateForDisplay(info.date, false);
    },
    listDayFormat(info) { return displayMarker(info.date); },
    // The list header has two date slots. Use one selected-calendar date.
    listDaySideFormat() { return ''; },
  };
}

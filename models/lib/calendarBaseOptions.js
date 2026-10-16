'use strict';

// The FullCalendar options the Calendar view (boardBody.js calendarOptions) and
// the Multi Board Calendar view (multiboardCalendarView.js) share. Each view
// adds what differs - whether cards can be dragged or selected, navLinks,
// business hours, and its own events() - on top of these.
//
// Pure: everything that needs Meteor (the translation, the user's first day
// of the week, the date display options) is passed in, so the views and
// tests/multiboardCalendarRuntime.test.cjs run the same code.
function calendarBaseOptions({ id, displayOptions = {}, firstDay, weekNumberOf, translate, locale, rtl }) {
  const t = (key, fallback) => {
    const translated = translate(key);
    return translated && translated !== key ? translated : fallback;
  };
  // Use non-localized AM/PM time format to avoid confusing notations like 上/下/中
  // Use full 'am'/'pm' instead of single-letter 'a'/'p' for clarity
  const timeFormat = { hour: 'numeric', minute: '2-digit', meridiem: 'short' };
  return {
    id,
    ...displayOptions,
    initialView: displayOptions.initialView || 'dayGridMonth',
    // #5521: the user's "start day of week" setting, not the locale default.
    firstDay,
    weekNumbers: true,
    // #4946: FullCalendar's default weekNumberCalculation is locale-based
    // (Sunday-anchored for many locales), so the week-number column ignored
    // the user's start-day-of-week setting even though `firstDay` moved the
    // grid. Compute the number from the SAME firstDay so the label matches the
    // way the week is laid out.
    weekNumberCalculation: date => weekNumberOf(date, firstDay),
    eventTimeFormat: { ...timeFormat },
    slotLabelFormat: { ...timeFormat },
    // #6686: Today/Previous/Next used to sit in their own group under the
    // title, with the Day/Week/Month view toggles in a third, CENTER group
    // that pushed everything onto a second row. All the buttons now sit
    // together in ONE group on the right side of the title, which stays
    // alone on the left - see calendarView.css for the title's vertical
    // centering against that single row.
    headerToolbar: {
      left: 'title',
      center: '',
      right:
        'today prev,next timeGridDay,listDay timeGridWeek,listWeek dayGridMonth,listMonth',
    },
    buttonIcons: false,
    buttonText: {
      prev: t('previous', 'Previous'),
      next: t('next', 'Next'),
      today: t('today', 'Today'),
      day: t('day', 'Day'),
      week: t('week', 'Week'),
      month: t('month', 'Month'),
      list: t('list', 'List'),
    },
    // height: 'parent', nope, doesn't work as the parent might be small
    height: 'auto',
    nowIndicator: true,
    locale,
    direction: rtl ? 'rtl' : 'ltr',
  };
}

module.exports = { calendarBaseOptions };

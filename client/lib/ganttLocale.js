// Locale plumbing shared by the Frappe Gantt and DHTMLX Gantt board views.
//
// Neither library reads WeKan's own translations. Frappe Gantt takes a
// `language` option it hands straight to Intl.DateTimeFormat for month
// names; DHTMLX Gantt takes a locale OBJECT ({ date: { month_full, ... },
// labels: {...} }) and ships a fixed set of them. Both are fed from here so
// every one of WeKan's languages - not only the handful a library happens
// to bundle - gets its month and weekday names, from the browser's own
// Intl data. Pure (no Meteor), so tests/ganttLocale.test.cjs runs it in
// plain Node.

// WeKan language tags are mostly BCP 47 ('fi', 'pt-BR', 'zh-Hans'), but a
// few use an underscore ('ru_RU', 'ca_ES', 'yue_CN', 'zh_SG', 'km_KH'),
// which Intl rejects outright (RangeError: Incorrect locale information).
// Normalise, then fall back to the primary language subtag, then to 'en',
// so an unrecognised tag degrades to English instead of throwing inside a
// library's render loop.
function intlLocaleFor(tag) {
  const candidates = [];
  if (typeof tag === 'string' && tag.trim()) {
    const normalised = tag.trim().replace(/_/g, '-');
    candidates.push(normalised);
    const primary = normalised.split('-')[0];
    if (primary && primary !== normalised) candidates.push(primary);
  }
  for (const candidate of candidates) {
    try {
      if (Intl.DateTimeFormat.supportedLocalesOf([candidate]).length) return candidate;
    } catch (e) {
      // syntactically invalid tag - try the next candidate
    }
  }
  return 'en';
}

function capitalise(s) {
  return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}

// Month and weekday names in the shape DHTMLX Gantt's locale object uses
// (`date` sub-object; weekdays start on Sunday, as dhtmlx expects).
function intlDateNames(tag) {
  const locale = intlLocaleFor(tag);
  const names = (unit, style, count, dateFor) => {
    const fmt = new Intl.DateTimeFormat(locale, { [unit]: style });
    return Array.from({ length: count }, (_, i) => capitalise(fmt.format(dateFor(i))));
  };
  // 2023-01-01 was a Sunday; 2023-01-01 + i months keeps the day-of-month
  // at 1, so no month overflow.
  const monthDate = i => new Date(Date.UTC(2023, i, 1, 12));
  const dayDate = i => new Date(Date.UTC(2023, 0, 1 + i, 12));
  return {
    month_full: names('month', 'long', 12, monthDate),
    month_short: names('month', 'short', 12, monthDate),
    day_full: names('weekday', 'long', 7, dayDate),
    day_short: names('weekday', 'short', 7, dayDate),
  };
}

// The locale object to hand DHTMLX Gantt's i18n.setLocale(). When dhtmlx
// bundles a real translation for the language (it ships ~40, looked up by
// primary subtag), that wins - it also translates its UI labels. Otherwise
// the English label set is kept and only the date names are replaced from
// Intl, which is what the board view actually shows (labels belong to the
// lightbox editor WeKan disables).
function dhtmlxLocaleFor(gantt, tag) {
  const primary = intlLocaleFor(tag).split('-')[0];
  let bundled = null;
  try {
    bundled = primary !== 'en' ? gantt.i18n.getLocale(primary) : null;
  } catch (e) {
    bundled = null;
  }
  if (bundled && bundled.date && Array.isArray(bundled.date.month_full)) return bundled;
  const english = gantt.i18n.getLocale('en');
  return { ...english, date: intlDateNames(tag) };
}

export { intlLocaleFor, intlDateNames, dhtmlxLocaleFor };

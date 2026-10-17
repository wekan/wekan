'use strict';

// A due date typed at the END of a card title: "Call the printer company
// tomorrow", "Send invoices friday 9:30", "Soita huomenna klo 14". Trello,
// ClickUp and Jira call this AI; it is a parser. docs/Features/Cards/Dates/
// Due-Date-From-Title.md.
//
// Every word comes from the JavaScript engine's own language tables
// (Intl.RelativeTimeFormat, Intl.DateTimeFormat, Intl.PluralRules), so each of
// WeKan's languages works without a word list of its own, and English works in
// every language too. Only the end of the title is read, so a title that only
// mentions a day ("Friday party planning") keeps its words.
//
// Pure, no Meteor: parseTitleDueDate(title, { locale, now }) returns
// { title, dueAt, matched } or null. Tests: tests/titleDueDate.test.cjs.

// The due date picker's default time (client/components/cards/cardDate.js).
const DEFAULT_HOUR = 17;

const cache = new Map();

const escapeRe = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Spaces of every kind, and the apostrophe a keyboard types for the one the
// tables use ("aujourd’hui").
function normalize(text) {
  return String(text)
    .replace(/[   ]/g, ' ')
    .replace(/[‎‏]/g, '')
    .replace(/[’ʼ]/g, "'");
}

function supported(locale) {
  try {
    return Intl.RelativeTimeFormat.supportedLocalesOf([locale]).length > 0
      && Intl.DateTimeFormat.supportedLocalesOf([locale]).length > 0;
  } catch (e) {
    return false;
  }
}

// The locale's own digits, mapped to 0-9 so "٣ أيام" and "3 أيام" read alike.
function digitMap(locale) {
  const map = {};
  const format = new Intl.NumberFormat(locale, { useGrouping: false });
  for (let d = 0; d <= 9; d += 1) {
    const local = format.format(d);
    if (local.length === 1 && local !== String(d)) map[local] = String(d);
  }
  return map;
}

// "in 3 days" for every plural form the language has, with the number as a
// capture: ["in (\d+) days", "in (\d+) day"].
function relativePatterns(locale, unit, digits) {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });
  const seen = new Set();
  for (let n = 1; n <= 30; n += 1) {
    const parts = format.formatToParts(n, unit);
    const text = parts.map(part => {
      const value = [...part.value].map(ch => digits[ch] || ch).join('');
      return part.type === 'integer' ? '\u0000' : value;
    }).join('');
    seen.add(normalize(text));
  }
  return [...seen].map(text => escapeRe(text).replace('\u0000', '(\\d{1,3})'));
}

// The word a language writes between a date and its time: "at", "klo", "um",
// "kl.", "à", "в", "בשעה".
function timePrefixes(locale) {
  const prefixes = new Set();
  for (const dateStyle of ['short', 'medium', 'long', 'full']) {
    const parts = new Intl.DateTimeFormat(locale, { dateStyle, timeStyle: 'short' })
      .formatToParts(new Date(2026, 9, 23, 14, 0));
    const hourAt = parts.findIndex(part => part.type === 'hour');
    const literal = hourAt > 0 && parts[hourAt - 1].type === 'literal' ? normalize(parts[hourAt - 1].value) : '';
    const word = literal.trim().split(/\s+/).pop() || '';
    if (/\p{L}/u.test(word)) prefixes.add(word.replace(/[,،]$/, ''));
  }
  return [...prefixes];
}

function dayPeriods(locale) {
  const periods = { am: new Set(['am', 'a.m.']), pm: new Set(['pm', 'p.m.']) };
  const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true });
  for (const [key, hour] of [['am', 9], ['pm', 15]]) {
    const part = format.formatToParts(new Date(2026, 9, 23, hour)).find(p => p.type === 'dayPeriod');
    if (part) periods[key].add(normalize(part.value).toLowerCase());
  }
  return periods;
}

// The weekday names, as the language writes them alone and inside a date
// ("perjantai" and "perjantaina" where the two differ). Long names only: the
// short ones ("sun", "mar") are too often ordinary words at the end of a title.
function weekdayNames(locale) {
  const names = [];
  const alone = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const inDate = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(2024, 0, 7 + i); // 7 January 2024 is a Sunday
    const forms = new Set([normalize(alone.format(date))]);
    const part = inDate.formatToParts(date).find(p => p.type === 'weekday');
    if (part) forms.add(normalize(part.value));
    for (const form of forms) names.push({ name: form, weekday: date.getDay() });
  }
  return names;
}

// Day, month and year in the order the language writes a numeric date.
function numericDateOrder(locale) {
  const parts = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' })
    .formatToParts(new Date(2026, 9, 23));
  const order = parts.filter(p => ['day', 'month', 'year'].includes(p.type)).map(p => p.type);
  const separator = (parts.find(p => p.type === 'literal') || { value: '' }).value.trim();
  return { order, separator };
}

function vocabularyFor(locale) {
  // WeKan's tags are "af_ZA"; Intl's are "af-ZA".
  const wanted = String(locale || 'en').replace(/_/g, '-');
  const tag = supported(wanted) ? wanted : 'en';
  if (cache.has(tag)) return cache.get(tag);
  const auto = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
  const digits = digitMap(tag);
  const v = {
    tag,
    digits,
    days: [0, 1, 2].map(offset => ({ text: normalize(auto.format(offset, 'day')), offset })),
    nextWeek: normalize(auto.format(1, 'week')),
    inDays: relativePatterns(tag, 'day', digits),
    inWeeks: relativePatterns(tag, 'week', digits),
    prefixes: timePrefixes(tag),
    periods: dayPeriods(tag),
    weekdays: weekdayNames(tag),
    numeric: numericDateOrder(tag),
  };
  cache.set(tag, v);
  return v;
}

function merge(primary, english) {
  if (primary.tag === english.tag) return [primary];
  return [primary, english];
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function validDate(year, month, day) {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

// The date expressions one vocabulary knows, each with how it resolves.
function dateRules(v, now) {
  const today = startOfDay(now);
  const rules = [];
  for (const { text, offset } of v.days) {
    if (!/\d/.test(text)) rules.push({ re: escapeRe(text), resolve: () => addDays(today, offset) });
  }
  rules.push({ re: escapeRe(v.nextWeek), resolve: () => addDays(today, ((8 - today.getDay()) % 7) || 7) });
  for (const re of v.inDays) rules.push({ re, resolve: m => addDays(today, Number(m[0])) });
  for (const re of v.inWeeks) rules.push({ re, resolve: m => addDays(today, 7 * Number(m[0])) });
  for (const { name, weekday } of v.weekdays) {
    // Up to three more letters: an inflected name, "perjantaina".
    rules.push({ re: `${escapeRe(name)}\\p{L}{0,3}`,
      resolve: () => addDays(today, ((weekday - today.getDay() + 7) % 7) || 7) });
  }
  rules.push({
    re: '(\\d{4})-(\\d{1,2})-(\\d{1,2})',
    resolve: m => validDate(Number(m[0]), Number(m[1]), Number(m[2])),
  });
  const { order, separator } = v.numeric;
  if (order.length === 3 && separator && order[0] !== 'year') {
    const sep = escapeRe(separator);
    const at = type => order.indexOf(type);
    const from = (m, year) => validDate(year, Number(m[at('month')]), Number(m[at('day')]));
    rules.push({
      re: `(\\d{1,2})${sep}(\\d{1,2})${sep}(\\d{2}|\\d{4})`,
      resolve: m => {
        const y = Number(m[2]);
        return from(m, y < 100 ? 2000 + y : y);
      },
    });
    // "23.10." without a year: only where the language closes it with the
    // separator, so "Release 1.2" is never a date.
    if (separator === '.') {
      rules.push({
        re: '(\\d{1,2})\\.(\\d{1,2})\\.',
        resolve: m => {
          const date = from(m, today.getFullYear());
          return date && date < today ? from(m, today.getFullYear() + 1) : date;
        },
      });
    }
  }
  return rules;
}

function timeRule(v) {
  const am = [...v.periods.am].map(escapeRe).join('|');
  const pm = [...v.periods.pm].map(escapeRe).join('|');
  return {
    clock: `(\\d{1,2})[:.](\\d{2})(?:\\s*(${am}|${pm}))?`,
    periodOnly: `(\\d{1,2})\\s*(${am}|${pm})`,
    hourOnly: '(\\d{1,2})',
    isPm: text => v.periods.pm.has(String(text).toLowerCase()),
    isAm: text => v.periods.am.has(String(text).toLowerCase()),
  };
}

function toTime(hour, minute, period, t) {
  let h = Number(hour);
  const m = Number(minute || 0);
  if (period) {
    if (h < 1 || h > 12) return null;
    if (t.isPm(period) && h !== 12) h += 12;
    if (t.isAm(period) && h === 12) h = 0;
  }
  if (h > 23 || m > 59) return null;
  return { h, m };
}

// The regexes for the end of a title, built from one vocabulary.
// Before a date or a time: the start, a space, or a script written without
// spaces between words.
const BEFORE = '(?:^|\\s|(?<=[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Thai}\\p{Script=Lao}\\p{Script=Khmer}\\p{Script=Myanmar}]))';

function groupCount(re) {
  return new RegExp(`${re}|`).exec('').length - 1;
}

function parseWith(v, text, now) {
  const t = timeRule(v);
  const prefix = v.prefixes.length ? `(?:(?:${v.prefixes.map(escapeRe).join('|')})\\s*)?` : '';
  const prefixRequired = v.prefixes.length ? `(?:${v.prefixes.map(escapeRe).join('|')})\\s*` : null;
  const timeAlternatives = [
    { re: t.clock, read: g => toTime(g[0], g[1], g[2], t) },
    { re: t.periodOnly, read: g => toTime(g[0], 0, g[1], t) },
  ];

  // A date, optionally followed by a time: "tomorrow", "friday 9:30",
  // "huomenna klo 14".
  for (const rule of dateRules(v, now)) {
    const n = groupCount(rule.re);
    const times = [
      ...timeAlternatives.map(alt => ({ re: `\\s*${prefix}${alt.re}`, read: alt.read })),
      ...(prefixRequired ? [{ re: `\\s*${prefixRequired}${t.hourOnly}`, read: g => toTime(g[0], 0, null, t) }] : []),
      { re: '', read: () => ({ h: DEFAULT_HOUR, m: 0 }) },
    ];
    for (const time of times) {
      const re = new RegExp(`${BEFORE}(${rule.re})${time.re}\\s*[.!]?\\s*$`, 'iu');
      const m = re.exec(text);
      if (!m) continue;
      const dateGroups = m.slice(2, 2 + n);
      const day = rule.resolve(dateGroups);
      const at = time.read(m.slice(2 + n));
      if (!day || !at) continue;
      return { index: m.index, dueAt: new Date(day.getFullYear(), day.getMonth(), day.getDate(), at.h, at.m) };
    }
  }

  // A time alone: today, or tomorrow when that time has passed. Only with a
  // prefix, a day period or a colon - "Version 1.10" is not ten past one.
  const timeOnly = [
    ...(prefixRequired ? [
      { re: `${prefixRequired}${t.clock}`, read: g => toTime(g[0], g[1], g[2], t) },
      { re: `${prefixRequired}${t.hourOnly}`, read: g => toTime(g[0], 0, null, t) },
    ] : []),
    { re: t.periodOnly, read: g => toTime(g[0], 0, g[1], t) },
    { re: `(\\d{1,2}):(\\d{2})(?:\\s*(${[...v.periods.am, ...v.periods.pm].map(escapeRe).join('|')}))?`,
      read: g => toTime(g[0], g[1], g[2], t) },
  ];
  for (const alt of timeOnly) {
    const m = new RegExp(`${BEFORE}${alt.re}\\s*[.!]?\\s*$`, 'iu').exec(text);
    if (!m) continue;
    const at = alt.read(m.slice(1));
    if (!at) continue;
    const today = startOfDay(now);
    let due = new Date(today.getFullYear(), today.getMonth(), today.getDate(), at.h, at.m);
    if (due <= now) due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, at.h, at.m);
    return { index: m.index, dueAt: due };
  }
  return null;
}

function parseTitleDueDate(title, { locale = 'en', now = new Date() } = {}) {
  if (typeof title !== 'string' || !title.trim()) return null;
  const vocabularies = merge(vocabularyFor(locale), vocabularyFor('en'));
  for (const v of vocabularies) {
    // Same length as the title, so an index found here cuts the title itself.
    const text = [...normalize(title)].map(ch => v.digits[ch] || ch).join('');
    if (text.length !== title.length) continue;
    const found = parseWith(v, text, now);
    if (!found) continue;
    const rest = title.slice(0, found.index).trim();
    if (!rest) return null; // "tomorrow" alone is a title, not a date
    return { title: rest, dueAt: found.dueAt, matched: title.slice(found.index).trim() };
  }
  return null;
}

module.exports = { parseTitleDueDate, DEFAULT_HOUR };

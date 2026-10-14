'use strict';

// #687: CalDAV sync - a board's card due dates in a calendar (Nextcloud
// Calendar, or any CalDAV server). Each card with a due date is one event in
// the chosen calendar collection, `<cardId>.ics`, UID `<cardId>@wekan`:
// DTSTART is the due date, one hour long, the card's title as the summary and
// its link in the description. A card that loses its due date or is archived
// has its event removed. A due date moved in the calendar comes back to the
// card. Pure: tests/caldavSync.test.cjs.

function esc(value) {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function utc(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 75) { out.push(rest.slice(0, 75)); rest = ` ${rest.slice(75)}`; }
  out.push(rest);
  return out.join('\r\n');
}

function shouldSync(card) {
  return !!(card && card.dueAt && !card.archived && !Number.isNaN(new Date(card.dueAt).getTime()));
}

function eventIcs(card, { url = '', now = new Date() } = {}) {
  if (!shouldSync(card)) return null;
  const start = new Date(card.dueAt);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WeKan//CalDAV sync//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    fold(`UID:${card._id}@wekan`),
    `DTSTAMP:${utc(now)}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(new Date(start.getTime() + 3600 * 1000))}`,
    fold(`SUMMARY:${esc(card.title || '')}`),
  ];
  if (url) lines.push(fold(`DESCRIPTION:${esc(url)}`), fold(`URL:${url}`));
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

function resourceUrl(collectionUrl, cardId) {
  if (!/^[A-Za-z0-9]{1,40}$/.test(String(cardId || ''))) return null;
  return `${String(collectionUrl).replace(/\/+$/, '')}/${cardId}.ics`;
}

// The event's start, from a calendar's .ics text (what a person may have moved).
function eventStart(ics) {
  const unfolded = String(ics || '').replace(/\r?\n[ \t]/g, '');
  const m = unfolded.match(/^DTSTART(?:;[^:\r\n]*)?:(\d{8})(?:T(\d{6})(Z)?)?/m);
  if (!m) return null;
  const [, d, t = '000000'] = m;
  const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function cleanLink(input) {
  const i = input && typeof input === 'object' ? input : {};
  const url = typeof i.url === 'string' ? i.url.trim().slice(0, 1000) : '';
  if (url) {
    let u;
    try { u = new URL(url); } catch (e) { return { error: 'caldav-invalid-url' }; }
    if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password) return { error: 'caldav-invalid-url' };
  }
  return { value: { url, username: typeof i.username === 'string' ? i.username.trim().slice(0, 200) : '',
    enabled: i.enabled === true && !!url } };
}

module.exports = { shouldSync, eventIcs, resourceUrl, eventStart, cleanLink };

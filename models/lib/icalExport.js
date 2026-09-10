'use strict';

// Pure, Meteor-free iCalendar (RFC 5545) generator for a read-only WeKan ->
// iCal EXPORT feed (GitHub issue #2836: "CalDAV or iCal Support"). #808 added
// the in-app Calendar VIEW; this is the separate thing #2836 actually asked
// for - a subscribable .ics feed a real calendar app (Google Calendar,
// Apple Calendar, Thunderbird, Outlook...) can pull a board's dates from.
//
// Scope, deliberately: this is EXPORT only, one-way, read-only. Full CalDAV is
// a stateful two-way sync PROTOCOL with its own server (PROPFIND/REPORT, ETags,
// collections) - a much bigger feature than a card-dates feed and out of scope
// here. Every calendar client that can "subscribe to a URL" (all the ones
// above) reads a plain .ics feed like this one directly, no CalDAV needed.
//
// Mirrors the shape of models/lib/calendarFilter.js and icsImport.js: no
// Meteor/npm dependencies, so this is trivial to unit-test and reuse from
// both the server route and a future client-side preview.

// RFC 5545 §3.3.11 TEXT escaping: backslash, semicolon, comma and embedded
// newlines are escaped; everything else passes through unchanged.
function escapeText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

// RFC 5545 §3.3.5 DATE-TIME, UTC form: 20260910T120000Z.
function formatDateUtc(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const pad = n => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

// RFC 5545 §3.1 content lines are folded at 75 octets; not required for
// correctness at WeKan's line lengths, but long titles/descriptions do occur,
// so fold rather than emit an oversized line some readers choke on.
function foldLine(line) {
  const CRLF_INDENT = '\r\n ';
  const MAX = 75;
  if (line.length <= MAX) return line;
  let out = line.slice(0, MAX);
  let rest = line.slice(MAX);
  while (rest.length > 0) {
    const chunk = rest.slice(0, MAX - 1);
    out += CRLF_INDENT + chunk;
    rest = rest.slice(MAX - 1);
  }
  return out;
}

function buildEvent({ uid, dtstamp, start, end, summary, description, url }) {
  const startFmt = formatDateUtc(start);
  if (!startFmt) return null;
  const endFmt = formatDateUtc(end || start);
  const lines = [
    'BEGIN:VEVENT',
    foldLine(`UID:${uid}`),
    foldLine(`DTSTAMP:${dtstamp}`),
    foldLine(`DTSTART:${startFmt}`),
    foldLine(`DTEND:${endFmt || startFmt}`),
    foldLine(`SUMMARY:${escapeText(summary)}`),
  ];
  if (description) lines.push(foldLine(`DESCRIPTION:${escapeText(description)}`));
  if (url) lines.push(foldLine(`URL:${url}`));
  lines.push('END:VEVENT');
  return lines;
}

/**
 * Build a VCALENDAR feed of a board's cards' dates.
 *
 * @param {Array} cards plain card-shaped objects: {_id, title, description,
 *   startAt, dueAt, endAt, receivedAt, url}. Any object missing every date is
 *   silently skipped - one card can contribute up to four events (received,
 *   start/end span, due), the same four dates the Calendar view (#808) draws.
 * @param {object} options {calendarName, prodId, now}
 * @returns {string} CRLF-terminated .ics text
 */
export function cardsToIcs(cards, options = {}) {
  const calendarName = options.calendarName || 'WeKan';
  const prodId = options.prodId || '-//WeKan//iCal Export//EN';
  const dtstamp = formatDateUtc(options.now || new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    foldLine(`PRODID:${prodId}`),
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    foldLine(`X-WR-CALNAME:${escapeText(calendarName)}`),
  ];

  (cards || []).forEach(card => {
    if (!card) return;
    const base = { title: card.title || '(untitled card)', url: card.url };

    if (card.startAt || card.endAt) {
      const evt = buildEvent({
        uid: `${card._id}-span@wekan`,
        dtstamp,
        start: card.startAt || card.endAt,
        end: card.endAt || card.startAt,
        summary: base.title,
        description: card.description,
        url: base.url,
      });
      if (evt) lines.push(...evt);
    }
    if (card.dueAt) {
      const evt = buildEvent({
        uid: `${card._id}-due@wekan`,
        dtstamp,
        start: card.dueAt,
        end: card.dueAt,
        summary: `${base.title} (due)`,
        description: card.description,
        url: base.url,
      });
      if (evt) lines.push(...evt);
    }
    if (card.receivedAt) {
      const evt = buildEvent({
        uid: `${card._id}-received@wekan`,
        dtstamp,
        start: card.receivedAt,
        end: card.receivedAt,
        summary: `${base.title} (received)`,
        description: card.description,
        url: base.url,
      });
      if (evt) lines.push(...evt);
    }
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export { escapeText, formatDateUtc, foldLine };

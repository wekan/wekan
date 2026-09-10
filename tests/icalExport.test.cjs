'use strict';
(async () => {

// Plain-Node unit test (no Meteor) for the iCal EXPORT feed generator
// (models/lib/icalExport.js), added for GitHub issue #2836 ("CalDAV or iCal
// Support"). #808 added the in-app Calendar VIEW; this is the separate
// EXPORT/subscribe direction the issue actually asked for - a per-board .ics
// feed a real calendar app can subscribe to. Run: node tests/icalExport.test.cjs

const assert = require('assert');
const { cardsToIcs, escapeText, formatDateUtc, foldLine } = await import('../models/lib/icalExport.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('formatDateUtc produces a valid RFC 5545 UTC DATE-TIME', () => {
  const s = formatDateUtc(new Date(Date.UTC(2026, 8, 10, 12, 0, 0)));
  assert.strictEqual(s, '20260910T120000Z');
});

test('formatDateUtc returns null for an invalid date', () => {
  assert.strictEqual(formatDateUtc(new Date('not-a-date')), null);
});

test('escapeText escapes backslash, semicolon, comma and newlines per RFC 5545 3.3.11', () => {
  assert.strictEqual(escapeText('a;b,c\\d\ne'), 'a\\;b\\,c\\\\d\\ne');
});

test('escapeText handles null/undefined as empty string', () => {
  assert.strictEqual(escapeText(null), '');
  assert.strictEqual(escapeText(undefined), '');
});

test('foldLine leaves short lines alone and folds long ones at 75 octets with a leading space', () => {
  const short = 'SUMMARY:short';
  assert.strictEqual(foldLine(short), short);
  const long = 'SUMMARY:' + 'x'.repeat(100);
  const folded = foldLine(long);
  assert.ok(folded.includes('\r\n '));
  // Rejoining the fold (removing the CRLF + single leading space) must
  // reconstruct the original content line exactly.
  const rejoined = folded.split('\r\n ').join('');
  assert.strictEqual(rejoined, long);
});

test('cardsToIcs produces a valid VCALENDAR wrapper with the board name', () => {
  const ics = cardsToIcs([], { calendarName: 'WeKan - My Board', now: new Date(Date.UTC(2026, 0, 1)) });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /VERSION:2\.0\r\n/);
  assert.match(ics, /X-WR-CALNAME:WeKan - My Board\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

test('a card with a due date produces one VEVENT with the correct DTSTART/DTEND', () => {
  const dueAt = new Date(Date.UTC(2026, 5, 15, 9, 0, 0));
  const ics = cardsToIcs([
    { _id: 'card1', title: 'Ship the release', dueAt, url: 'https://example.com/b/x/y/card1' },
  ], { now: new Date(Date.UTC(2026, 0, 1)) });
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /UID:card1-due@wekan/);
  assert.match(ics, /DTSTART:20260615T090000Z/);
  assert.match(ics, /DTEND:20260615T090000Z/);
  assert.match(ics, /SUMMARY:Ship the release \(due\)/);
  assert.match(ics, /URL:https:\/\/example\.com\/b\/x\/y\/card1/);
  assert.match(ics, /END:VEVENT/);
});

test('a card with start and end dates produces a spanning VEVENT distinct from its due event', () => {
  const startAt = new Date(Date.UTC(2026, 5, 10));
  const endAt = new Date(Date.UTC(2026, 5, 12));
  const dueAt = new Date(Date.UTC(2026, 5, 12));
  const ics = cardsToIcs([{ _id: 'card2', title: 'Sprint', startAt, endAt, dueAt }]);
  assert.match(ics, /UID:card2-span@wekan/);
  assert.match(ics, /DTSTART:20260610T000000Z/);
  assert.match(ics, /DTEND:20260612T000000Z/);
  assert.match(ics, /UID:card2-due@wekan/);
  // Two distinct VEVENT blocks for the one card (span + due), not one merged event.
  assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
});

test('a card with a received date produces its own VEVENT (matches the Calendar view\'s four date types)', () => {
  const receivedAt = new Date(Date.UTC(2026, 5, 1));
  const ics = cardsToIcs([{ _id: 'card3', title: 'Intake', receivedAt }]);
  assert.match(ics, /UID:card3-received@wekan/);
  assert.match(ics, /SUMMARY:Intake \(received\)/);
});

test('a card with no dates at all contributes no VEVENT', () => {
  const ics = cardsToIcs([{ _id: 'card4', title: 'No dates' }]);
  assert.strictEqual((ics.match(/BEGIN:VEVENT/g) || []).length, 0);
});

test('special characters in a title/description are escaped, not left to break the VEVENT', () => {
  const dueAt = new Date(Date.UTC(2026, 5, 15));
  const ics = cardsToIcs([{
    _id: 'card5',
    title: 'Fix bug; urgent, please',
    description: 'line one\nline two',
    dueAt,
  }]);
  assert.match(ics, /SUMMARY:Fix bug\\; urgent\\, please \(due\)/);
  assert.match(ics, /DESCRIPTION:line one\\nline two/);
});

// --- negative test: the server route this feeds must exist and be wired to
// the same generator, so the fix is not just a standalone unused module. ----
test('the server export route serves the feed via cardsToIcs, scoped and access-checked', () => {
  const fs = require('fs');
  const path = require('path');
  const exportJs = fs.readFileSync(path.join(__dirname, '..', 'models/export.js'), 'utf8');
  assert.match(exportJs, /\/api\/boards\/:boardId\/calendar\.ics/);
  assert.match(exportJs, /cardsToIcs/);
  assert.match(exportJs, /exporter\.canExport\(user\)/);
  assert.match(exportJs, /text\/calendar/);
});

console.log(`\n${passed} tests passed`);

})().catch(e => { console.error(e); process.exit(1); });

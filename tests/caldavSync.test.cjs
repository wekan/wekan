'use strict';

// #687: CalDAV sync of card due dates.
// Run: node tests/caldavSync.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const c = require('../models/lib/caldavSync.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const card = { _id: 'abc123', title: 'Ship; it, now', dueAt: new Date('2026-10-20T10:00:00Z') };

// Positive.
const ics = c.eventIcs(card, { url: 'https://w.example/b/x/y/abc123', now: new Date('2026-10-14T00:00:00Z') });
assert.match(ics, /\r\nUID:abc123@wekan\r\n/);
assert.match(ics, /\r\nDTSTART:20261020T100000Z\r\nDTEND:20261020T110000Z\r\n/);
assert.match(ics, /\r\nSUMMARY:Ship\\; it\\, now\r\n/, 'escaped');
assert.doesNotMatch(ics, /Ship;/, 'a bare semicolon would split the TEXT value (RFC 5545 3.3.11)');
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1, 'one event per calendar resource');
assert.equal(c.resourceUrl('https://cloud.example/remote.php/dav/calendars/u/wekan/', 'abc123'), 'https://cloud.example/remote.php/dav/calendars/u/wekan/abc123.ics');
assert.deepEqual(c.eventStart(ics), card.dueAt, 'what was written reads back');
assert.deepEqual(c.eventStart('DTSTART;VALUE=DATE:20261021'), new Date('2026-10-21T00:00:00Z'));
assert.deepEqual(c.eventStart('BEGIN:VEVENT\r\nDTSTART:20261022T\r\n 090000Z\r\n'), new Date('2026-10-22T09:00:00Z'), 'folded lines');
assert.deepEqual(c.cleanLink({ url: 'https://cloud.example/cal/', username: 'u', enabled: true }).value, { url: 'https://cloud.example/cal/', username: 'u', enabled: true });
console.log('  ok - one event per card, escaped, and its start reads back');

// Negative.
assert.equal(c.eventIcs({ ...card, archived: true }), null, 'an archived card has no event');
assert.equal(c.eventIcs({ _id: 'x' }), null, 'nor one without a due date');
assert.equal(c.resourceUrl('https://cloud.example/cal', '../../etc'), null, 'no path tricks');
assert.equal(c.eventStart('nothing'), null);
for (const url of ['javascript:alert(1)', 'ftp://cloud.example/x', 'https://u:p@cloud.example/x', 'nonsense']) {
  assert.equal(c.cleanLink({ url }).error, 'caldav-invalid-url', url);
}
assert.equal(c.cleanLink({ url: '', enabled: true }).value.enabled, false, 'no address, not on');
console.log('  ok - archived or undated cards, path tricks and bad addresses refused');

const server = read('server/caldavSync.js');
assert.match(server, /CalDavLinks\.deny\(\{ insert: \(\) => true, update: \(\) => true, remove: \(\) => true \}\);/);
assert.match(server, /const \{ webhookFetch \} = require\('\/server\/sandstormEgress'\);/, 'through the SSRF guard');
assert.doesNotMatch(server, /(^|[^A-Za-z])fetch\(/);
assert.match(server, /return \{ url: [\s\S]{0,200}hasPassword: !!\(link && link\.password\) \};/, 'the password never goes back to the browser');
for (const m of ['getCalDavLink', 'saveCalDavLink', 'syncCalDavNow']) {
  assert.match(server, new RegExp(`async ${m}\\([\\s\\S]{0,300}await requireBoardAdmin\\(this\\.userId, boardId\\);`), m);
}
assert.match(server, /Cards\.updateAsync\(\{ _id: state\._id, boardId: link\._id, archived: false \}, \{ \$set: \{ dueAt: start \} \}\)/, 'read-back only changes this board\'s cards');
assert.match(read('server/imports.js'), /import '\/server\/caldavSync';/);
console.log('  ok - board admins only, password kept server-side, read-back confined to the board');
console.log('\ncaldavSync: all tests passed');

'use strict';

// Nextcloud Deck-style auto-archive (models/lib/autoArchive.js,
// server/autoArchiveCards.js). Run: node tests/autoArchive.test.cjs
// The job itself runs against real collections in
// server/lib/tests/autoArchiveCards.tests.js (meteor test).

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  AUTO_ARCHIVE_MAX_DAYS, AUTO_ARCHIVE_BOARD_SELECTOR, normalizeAutoArchiveDays, autoArchiveCutoff, autoArchiveCardSelector,
} = require('../models/lib/autoArchive.js');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

assert.equal(normalizeAutoArchiveDays(30), 30);
assert.equal(normalizeAutoArchiveDays('14'), 14);
assert.equal(normalizeAutoArchiveDays(AUTO_ARCHIVE_MAX_DAYS), AUTO_ARCHIVE_MAX_DAYS);
// Negative: anything else is off, never "archive everything now".
for (const off of [null, undefined, '', 0, -1, 1.5, 'x', AUTO_ARCHIVE_MAX_DAYS + 1, NaN, Infinity, {}]) {
  assert.equal(normalizeAutoArchiveDays(off), null, String(off));
}
const now = new Date('2026-09-29T12:00:00Z');
assert.equal(autoArchiveCutoff(30, now).toISOString(), '2026-08-30T12:00:00.000Z');
assert.deepEqual(autoArchiveCardSelector('b', 30, now), {
  boardId: 'b', archived: false, type: { $ne: 'template-card' }, dateLastActivity: { $lt: autoArchiveCutoff(30, now) },
});
assert.deepEqual(AUTO_ARCHIVE_BOARD_SELECTOR, { autoArchiveInactiveDays: { $gte: 1 }, archived: false, type: 'board' });
console.log('  ok - only whole days from 1 to 3650 turn it on, and only stale non-template cards match');

const job = read('server/autoArchiveCards.js');
assert.match(job, /name: 'wekan-card-auto-archive',[\s\S]*?parser\.text\('every 1 hour'\)/);
assert.match(job, /const days = normalizeAutoArchiveDays\(board\.autoArchiveInactiveDays\);\s*if \(!days\) return 0;/);
assert.match(job, /await asUser\(board\.createdBy, \(\) => card\.archive\(\)\);/, 'archived with its subtasks and activity');
assert.match(job, /limit: AUTO_ARCHIVE_BATCH/);
assert.match(read('server/imports.js'), /import '\/server\/autoArchiveCards';/);
const boards = read('models/boards.js');
assert.match(boards, /autoArchiveInactiveDays: \{[\s\S]*?type: SimpleSchema\.Integer,\s*optional: true,\s*min: 1,\s*max: 3650,/);
assert.match(boards, /async setAutoArchiveInactiveDays\(value\) \{\s*const days = normalizeAutoArchiveDays\(value\);/);
assert.match(read('client/components/sidebar/sidebar.jade'), /input#auto-archive-days\.js-auto-archive-days\(type="number" min="1" max="3650"/);
assert.match(read('server/lib/tests/index.js'), /import '\.\/autoArchiveCards\.tests';/);
console.log('  ok - the hourly job, the board field and the Board Settings input are wired');

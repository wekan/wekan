'use strict';

// #2111 / #1604: every change to any field of a card is marked unread, with a
// per-user switch.
// Run: node tests/unreadChanges.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { latestChangeTime, hasUnreadChanges } = require('../models/lib/unreadChanges.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const T = s => new Date(`2026-10-14T${s}:00Z`);

const card = { modifiedAt: T('10:00') };
// Positive: a change anywhere, after the last view, marks it.
assert.equal(latestChangeTime({ card, items: [{ modifiedAt: T('11:00') }] }), T('11:00').getTime(), 'a checklist item counts');
assert.equal(latestChangeTime({ card, attachments: [{ uploadedAt: T('12:00') }] }), T('12:00').getTime(), 'an attachment counts');
const enabledAt = T('08:00');
assert.equal(hasUnreadChanges(latestChangeTime({ card }), { lastViewedAt: T('09:00'), enabledAt }), true, 'the title changed after I looked');
assert.equal(hasUnreadChanges(latestChangeTime({ card, comments: [{ createdAt: T('10:30') }] }), { lastViewedAt: T('10:15'), enabledAt }), true);
console.log('  ok - any change after the last view marks the card');

// Negative.
assert.equal(hasUnreadChanges(latestChangeTime({ card }), { lastViewedAt: T('10:30'), enabledAt }), false, 'seen since');
assert.equal(hasUnreadChanges(latestChangeTime({ card }), { lastViewedAt: T('09:00') }), false, 'off by default');
assert.equal(hasUnreadChanges(latestChangeTime({ card }), { lastViewedAt: null, enabledAt: T('11:00') }), false,
  'turning it on does not mark every card never opened');
assert.equal(hasUnreadChanges(latestChangeTime({ card: { modifiedAt: 'junk' } }), { enabledAt }), false);
console.log('  ok - seen, switched off, or older than the switch: not marked');

// Wiring.
assert.match(read('models/users.js'), /'profile\.unreadChangesSince': \{[\s\S]{0,300}type: Date,\s*optional: true,/);
assert.match(read('server/models/users.js'), /async toggleUnreadChanges\(\) \{\s*if \(!this\.userId\) throw[\s\S]{0,400}\$set: \{ 'profile\.unreadChangesSince': new Date\(\) \}/);
const minicard = read('client/components/cards/minicard.js');
assert.match(minicard, /hasUnreadChanges\(\) \{[\s\S]{0,400}if \(!enabledAt\) return false;/);
assert.match(read('client/components/cards/minicard.jade'), /class="\{\{#if hasUnreadChanges\}\}minicard-unread-changes\{\{\/if\}\}"/);
// In onDestroyed, after the #6686 popup handling (labelsPopupStaleCardContext
// reads that handling from the top of the function).
const destroyed = read('client/components/cards/cardDetails.js').split('Template.cardDetails.onDestroyed(function () {')[1].split('\n});')[0];
assert.match(destroyed, /\/\/ #2111[\s\S]{0,400}closingUser\.setCardLastViewed\(this\.openedCardId\);/,
  'closing a card counts as seen, so own edits do not mark it');
assert.match(read('client/components/users/userHeader.jade'), /a\.js-toggle-unread-changes/);
console.log('  ok - the switch, the minicard mark and closing a card');
console.log('\nunreadChanges: all tests passed');

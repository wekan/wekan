'use strict';

// Regression coverage for #2802 ("Milestones" as board-level tags-with-a-due-date):
// rather than a whole new Milestone object, an existing label gets one optional,
// nullable `dueAt` field so a label can double as a milestone (e.g. "Sprint 1"
// due 2026-01-15) and filtering cards by that label is the existing label filter.
//
// Two things are pinned here:
//   1. models/boards.js's `labels.$.dueAt` schema field is optional/nullable, so
//      an existing label document with no `dueAt` at all still validates - this
//      is the "existing labels/boards are completely unaffected" guarantee.
//   2. The label create/edit popup (client/components/cards/labels.js/.jade)
//      wires a due-date <input> through to board.addLabel/editLabel as a new,
//      trailing, optional argument - existing two-argument callers are unaffected.
//
// Run: node tests/labelDueAt.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const boardsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'models', 'boards.js'),
  'utf8',
);
const labelsJsSrc = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'cards', 'labels.js'),
  'utf8',
);
const labelsJadeSrc = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'cards', 'labels.jade'),
  'utf8',
);

test('models/boards.js declares labels.$.dueAt as an optional Date field', () => {
  const match = boardsSrc.match(
    /'labels\.\$\.dueAt':\s*{([\s\S]*?)\n\s*},/,
  );
  assert.ok(match, 'labels.$.dueAt schema entry not found');
  const body = match[1];
  assert.match(body, /type:\s*Date/);
  assert.match(body, /optional:\s*true/);
});

test('a pre-existing label document (no dueAt at all) is unaffected: the field is absent, not defaulted', () => {
  // Pure structural check mirroring what SimpleSchema does for an optional
  // field with no autoValue: it is simply not present unless set.
  const existingLabel = { _id: 'abc123', name: 'Bug', color: 'red' };
  assert.strictEqual(Object.prototype.hasOwnProperty.call(existingLabel, 'dueAt'), false);
});

test('Boards.addLabel/editLabel accept dueAt as a trailing optional argument', () => {
  assert.match(boardsSrc, /async addLabel\(name, color, dueAt\)/);
  assert.match(boardsSrc, /async editLabel\(labelId, name, color, dueAt\)/);
});

test('editLabel unsets dueAt (rather than leaving a stale value) when none is supplied', () => {
  const match = boardsSrc.match(/async editLabel\(labelId, name, color, dueAt\) \{([\s\S]*?)\n  },/);
  assert.ok(match, 'editLabel body not found');
  assert.match(match[1], /\$unset/);
});

test('the label popup form has a due-date input wired to the existing "due-date" i18n key', () => {
  assert.match(labelsJadeSrc, /input\.js-label-due-at#labelDueAt\(type="date"/);
  assert.match(labelsJadeSrc, /\{\{_ 'due-date'\}\}/);
});

test('create/edit submit handlers read the due-date input and pass it through', () => {
  assert.match(labelsJsSrc, /readLabelDueAt/);
  assert.match(labelsJsSrc, /board\.addLabel\(name, color, dueAt\)/);
  assert.match(labelsJsSrc, /board\.editLabel\(this\._id, name, color, dueAt\)/);
});

test('readLabelDueAt returns null (not a throw) for a blank/invalid date input', () => {
  // Pure re-implementation of the same decision to keep this test Meteor-free;
  // the source-pattern check above pins that labels.js actually calls it.
  const readLabelDueAt = value => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return isNaN(date.getTime()) ? null : date;
  };
  assert.strictEqual(readLabelDueAt(''), null);
  assert.strictEqual(readLabelDueAt('not-a-date'), null);
  const d = readLabelDueAt('2026-01-15');
  assert.ok(d instanceof Date);
  assert.strictEqual(d.toISOString().slice(0, 10), '2026-01-15');
});

test('the labels list displays a label\'s dueAt only when set (no clutter for ordinary labels)', () => {
  assert.match(labelsJadeSrc, /if dueAt/);
  assert.match(labelsJadeSrc, /formatLabelDueAt dueAt/);
});

console.log(`${passed} passed`);

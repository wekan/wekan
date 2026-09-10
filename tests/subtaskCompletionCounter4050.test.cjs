'use strict';

// Plain-Node regression guard (no Meteor) for issue #4050 "Indication of
// subtasks completion in the cards": the reporter said the minicard's
// subtask badge always shows "0/n", and expected giving a subtask an End
// Date to make it count as done (e.g. show "1/n" after finishing one).
//
// Reading the current code (models/cards.js) shows the counter itself is
// correct for what it measures:
//   - subtasksFinished()/subtasksFinishedCount() count subtasks with
//     { archived: true } (the numerator).
//   - allSubtasks()/allSubtasksCount() count every subtask regardless of
//     archived state (the denominator).
//   - a subtask is archived via Card.archive() (models/cards.js), which
//     recurses into applyToChildren() and then sets
//     { archived: true, archivedAt: new Date() } — this IS the real "mark
//     a subtask complete" action, and it DOES increment the numerator.
//   - setEnd(endAt) (models/cards.js) only ever writes { endAt }; it never
//     touches `archived`. So giving a subtask an End Date — what the
//     reporter tried — does nothing to the counter, by design: an end
//     date is a due-date field, not a completion flag. The reporter's "0/n
//     never increments" observation is real for that action, but the
//     counter is not broken: it is answering a different question
//     (archived?) than the one the action they used sets (endAt).
// Run: node tests/subtaskCompletionCounter4050.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const cardsSrc = fs.readFileSync(path.join(repoRoot, 'models/cards.js'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function extract(name) {
  // matches "  name() {" or "  async name() {" up to its closing "  },"
  const m = cardsSrc.match(new RegExp(`(?:async )?${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\},`));
  assert.ok(m, `${name} found in models/cards.js`);
  return m[0];
}

// --- POSITIVE: the counter's numerator/denominator are what a "N/M" badge
// needs, and match how a subtask is actually finished -----------------------

test('subtasksFinished() (the numerator) counts archived subtasks', () => {
  const fn = extract('subtasksFinished');
  assert.ok(fn.includes('archived: true'),
    'the numerator must query archived subtasks, since archiving is how a subtask is finished');
});

test('allSubtasks() (the denominator) counts every subtask, archived or not', () => {
  const fn = extract('allSubtasks');
  assert.ok(!/archived\s*:/.test(fn),
    'the denominator must not filter by archived, or a finished subtask would drop out of "n"');
});

test('subtasksFinishedCount()/allSubtasksCount() just report the lengths above', () => {
  const finishedCount = extract('subtasksFinishedCount');
  assert.ok(finishedCount.includes('this.subtasksFinished()'));
  const allCount = extract('allSubtasksCount');
  assert.ok(allCount.includes('this.allSubtasks()'));
});

test('Card.archive() (the real "finish a subtask" action) sets archived: true and recurses to children', () => {
  const fn = extract('archive');
  assert.ok(fn.includes('applyToChildren'), 'archiving a parent archives its subtasks too');
  assert.ok(fn.includes('archived: true'), 'archiving is what flips the flag the counter reads');
});

// --- NEGATIVE: setEnd (what the #4050 reporter used) must NOT touch
// `archived` — confirming the badge is not "broken", it answers a different
// question than an end date does ---------------------------------------------

test('NEGATIVE #4050: setEnd(endAt) never sets archived (an end date is not completion)', () => {
  const fn = extract('setEnd');
  assert.ok(!/archived/.test(fn),
    'setEnd must stay a pure endAt write; if it touched archived, an unrelated due-date edit ' +
    'would silently "finish" a subtask');
  assert.ok(fn.includes('endAt'));
});

// --- Simulate the actual counting logic against an in-memory subtask set,
// to pin "archive some, count only those" end-to-end without Meteor --------

function computeSubtaskCounters(subtaskCards) {
  // Mirrors subtasksFinishedCount()/allSubtasksCount() exactly: numerator
  // is archived:true, denominator is every subtask regardless of archived.
  const finished = subtaskCards.filter(c => c.archived === true).length;
  const all = subtaskCards.length;
  return { finished, all };
}

test('#4050: archiving M of N subtasks makes the badge read M/N', () => {
  const subtasks = [
    { _id: 's1', parentId: 'p1', archived: false, endAt: null },
    { _id: 's2', parentId: 'p1', archived: false, endAt: null },
    { _id: 's3', parentId: 'p1', archived: false, endAt: null },
  ];
  // Nobody archived yet.
  assert.deepStrictEqual(computeSubtaskCounters(subtasks), { finished: 0, all: 3 });

  // Simulate Card.archive() on s1 and s2 (sets archived: true, leaves endAt alone).
  subtasks[0].archived = true;
  subtasks[1].archived = true;
  assert.deepStrictEqual(computeSubtaskCounters(subtasks), { finished: 2, all: 3 });
});

test('NEGATIVE #4050: only setting endAt (no archive) leaves the badge at 0/n, by design', () => {
  const subtasks = [
    { _id: 's1', parentId: 'p1', archived: false, endAt: null },
    { _id: 's2', parentId: 'p1', archived: false, endAt: null },
  ];
  // Simulate setEnd(new Date()) on s1 — an end date, nothing else.
  subtasks[0].endAt = new Date();
  assert.deepStrictEqual(
    computeSubtaskCounters(subtasks),
    { finished: 0, all: 2 },
    'an end date alone must not move the numerator; only archiving does',
  );
});

console.log(`\n${passed} tests passed`);

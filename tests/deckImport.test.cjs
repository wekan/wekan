'use strict';

// Nextcloud Deck import field fidelity (models/lib/externalParsers.js).
// Run: node tests/deckImport.test.cjs
//
// The Deck parser used to keep title, description, due date, one assignee and
// label names. It now keeps every assignee, comments embedded from the OCS
// comments API, archive state, done and creation times and the stack/card
// order; trashed stacks and cards are skipped rather than resurrected, and
// sharing rules and attachments are reported as losses. ACL entries never
// become board members: a file naming a user must not grant them access.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const { parseNextcloudDeck } = await import('../models/lib/externalParsers.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/deck.json')));
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/import-formats/expectations.json')));

  const parsed = parseNextcloudDeck(fixture);
  assert.equal(parsed.tasks.length, 1, 'the trashed card is skipped');
  const [task] = parsed.tasks;
  assert.equal(task.title, expected.title);
  assert.equal(task.description, expected.description);
  assert.equal(task.owner_username, 'deck-a');
  assert.deepEqual(task.assignees, ['deck-b']);
  assert.equal(task.requested_by, 'deck-owner');
  assert.deepEqual(task.tags, [expected.label]);
  assert.deepEqual(parsed.warnings, [{ path: '/stacks/0/cards', reason: '1 deleted card(s) skipped' }]);
  assert.deepEqual(parsed.unsupported.map(u => u.path), ['/acl', '/stacks/0/cards/0/attachments']);

  const plan = planImportedTask(task, { members: { 'deck-a': 'uA', 'deck-b': 'uB', 'deck-guest': 'uG' } });
  assert.deepEqual(plan.memberIds, ['uA', 'uB'], 'assignees become members; the ACL guest does not');
  assert.equal(plan.card.createdAt.toISOString(), '2026-09-01T00:00:00.000Z');
  assert.equal(plan.card.archived, false);
  assert.equal(plan.card.endAt, undefined, 'done: null is not a completion date');
  assert.deepEqual(plan.comments.map(c => [c.text, c.createdAt.toISOString()]),
    [[`deck-user: ${expected.comment}`, '2026-09-30T12:34:56.000Z']]);

  // Order, archive, done and trashed stacks.
  const ordered = parseNextcloudDeck({
    board: { title: 'B' },
    stacks: [
      { title: 'Later', order: 2, cards: [] },
      { title: 'Gone', order: 0, deletedAt: 5, cards: [{ title: 'ghost' }] },
      { title: 'First', order: 1, cards: [
        { title: 'second', order: 9, archived: true, done: '2026-09-30T12:34:56+00:00' },
        { title: 'first', order: 1, labels: ['plain'] },
      ] },
    ],
  });
  assert.deepEqual(ordered.columns.map(c => c.title), ['First', 'Later']);
  assert.deepEqual(ordered.tasks.map(t => t.title), ['first', 'second']);
  assert.equal(ordered.tasks[1].archived, true);
  assert.equal(planImportedTask(ordered.tasks[1]).card.endAt.toISOString(), '2026-09-30T12:34:56.000Z');
  assert.deepEqual(ordered.tasks[0].tags, ['plain']);
  assert.deepEqual(ordered.warnings, [{ path: '/stacks', reason: '1 deleted stack(s) skipped' }]);

  // Negative: malformed members and comments are ignored, not thrown on.
  const odd = parseNextcloudDeck({ stacks: [{ title: 'S', cards: [{ assignedUsers: [null, {}, 'plain-uid'], comments: 'x', archived: 'true', attachmentCount: 2 }] }] });
  assert.equal(odd.tasks[0].owner_username, 'plain-uid');
  assert.deepEqual(odd.tasks[0].comments, []);
  assert.equal(odd.tasks[0].archived, false, 'only a real boolean archives');
  assert.match(odd.unsupported[0].reason, /^2 attachment/);
  assert.deepEqual(parseNextcloudDeck({}).tasks, []);

  console.log('  ok - Deck assignees, comments, order, archive/done state and losses import');
}

main().catch(error => { console.error(error); process.exitCode = 1; });

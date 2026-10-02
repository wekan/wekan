'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { copiedCardScrum } = require('../models/lib/scrumCopy');
const { copiedScrumMetadata } = require('../models/lib/scrumCopy');
const card = { boardId: 'source', scrumRevision: 42, scrum: {
  sprintId: 'sprint', pastSprintIds: ['past'], releaseId: 'release', backlogRank: 10,
  issueType: 'Story', acceptanceCriteria: 'Verified outcome',
} };
test('same-board copies retain independent metadata with a fresh revision', () => {
  const result = copiedCardScrum(card, 'source');
  assert.deepEqual(result.scrum, card.scrum); assert.equal(result.scrumRevision, 1);
  result.scrum.pastSprintIds.push('other');
  assert.deepEqual(card.scrum.pastSprintIds, ['past']);
});
test('cross-board copies preserve descriptive fields without foreign planning links or rank', () => {
  assert.deepEqual(copiedCardScrum(card, 'destination'), { scrum: {
    issueType: 'Story', acceptanceCriteria: 'Verified outcome',
  }, scrumRevision: 1 });
  assert.equal(card.scrum.sprintId, 'sprint'); assert.equal(card.scrumRevision, 42);
});
test('deferred, excluded and absent metadata do not inherit a revision', () => {
  assert.deepEqual(copiedCardScrum(card, 'source', { omit: true }), {});
  assert.deepEqual(copiedCardScrum({ scrumRevision: 42 }, 'destination'), {});
});
test('subtask copies apply the same board boundary', async () => {
  const { buildCopiedSubtaskFields } = await import('../models/lib/subtaskCopy.js');
  for (const boardId of ['source', 'destination']) {
    const copy = buildCopiedSubtaskFields(card, { boardId, newParentId: 'parent' });
    assert.deepEqual(copy.scrum, copiedCardScrum(card, boardId).scrum);
    assert.equal(copy.scrumRevision, 1); assert.equal(copy.parentId, 'parent');
  }
});
test('container copies preserve category and purpose and omit foreign planning links', () => {
  const list = { boardId: 'source', scrum: { category: 'done' }, scrumRevision: 9 };
  assert.deepEqual(copiedScrumMetadata(list, 'destination'), { scrum: { category: 'done' }, scrumRevision: 1 });
  const lane = { boardId: 'source', scrum: { sprintId: 's', releaseId: 'r', purpose: 'Team' } };
  assert.deepEqual(copiedScrumMetadata(lane, 'source').scrum, lane.scrum);
  assert.deepEqual(copiedScrumMetadata(lane, 'destination').scrum, { purpose: 'Team' });
  assert.deepEqual(copiedScrumMetadata(lane, 'destination', { omit: true }), {});
});

// Moves to another board (2026-10-02): the same references go as for a copy,
// written by server hooks, since Scrum fields are not the client's to write.
{
  const assert = require('node:assert/strict');
  const fs = require('node:fs'), path = require('node:path');
  const { movedScrumMetadata } = require('../models/lib/scrumCopy');
  const scrum = { sprintId: 's', pastSprintIds: ['p'], releaseId: 'r', backlogRank: 2, issueType: 'Bug', purpose: 'x' };
  assert.deepEqual(movedScrumMetadata({ boardId: 'a', scrum, scrumRevision: 4 }, 'b'),
    { scrum: { issueType: 'Bug', purpose: 'x' }, scrumRevision: 5 });
  // Negative: the same board, no Scrum, or nothing board-scoped - no write.
  assert.deepEqual(movedScrumMetadata({ boardId: 'a', scrum }, 'a'), {});
  assert.deepEqual(movedScrumMetadata({ boardId: 'a' }, 'b'), {});
  assert.deepEqual(movedScrumMetadata({ boardId: 'a', scrum: { issueType: 'Bug' } }, 'b'), {});
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.match(read('server/models/cards.js'), /const moved = movedScrumMetadata\(\{ \.\.\.doc, boardId: oldBoardId \}, doc\.boardId, planning\);\n  if \(!moved\.scrum\) return;\n  await Cards\.direct\.updateAsync\(\{ _id: doc\._id, boardId: doc\.boardId, \.\.\.scrumRevisionSelector\(doc\) \}, \{ \$set: moved \}\);/);
  assert.match(read('server/models/swimlanes.js'), /Swimlanes\.before\.update\(async \(userId, doc, fieldNames, modifier\) => \{\n  const boardId = modifier && modifier\.\$set && modifier\.\$set\.boardId;[\s\S]{0,400}Object\.assign\(modifier\.\$set, movedScrumMetadata\(doc, boardId, planning\)\);/);
  // Negative: the client-callable Card.move never writes Scrum fields itself,
  // or the deny rule would refuse every cross-board move from the browser.
  const move = read('models/cards.js').split('  async move(boardId, swimlaneId, listId')[1].split('\n  },\n')[0];
  assert.ok(!/scrum/.test(move.replace(/\/\/.*$/gm, '')), 'Card.move writes no Scrum field');
  console.log('  ok - moves to another board drop the board-scoped Scrum references');
}

// Maintainer decision of 2026-10-02: on another board, link the sprint and
// release of the same name when exactly one matches; drop them otherwise.
{
  const assert = require('node:assert/strict');
  const { movedScrumMetadata, copiedScrumMetadata } = require('../models/lib/scrumCopy');
  const planning = {
    from: { sprints: [{ _id: 's', name: 'Sprint 7' }], releases: [{ _id: 'r', name: '1.0' }] },
    to: { sprints: [{ _id: 'S', name: 'Sprint 7', state: 'planned' }], releases: [{ _id: 'R', name: ' 1.0 ', state: 'planned' }] },
  };
  const doc = { boardId: 'a', scrum: { sprintId: 's', pastSprintIds: ['p'], releaseId: 'r', backlogRank: 2, issueType: 'Bug' } };
  assert.deepEqual(movedScrumMetadata(doc, 'b', planning).scrum, { issueType: 'Bug', sprintId: 'S', releaseId: 'R' },
    'linked by name; past sprints and rank always go');
  assert.deepEqual(copiedScrumMetadata(doc, 'b', { planning }).scrum, { issueType: 'Bug', sprintId: 'S', releaseId: 'R' });
  // Negative: two of the same name, a finished sprint, a cancelled release,
  // or no planning loaded - dropped.
  const twice = { ...planning, to: { ...planning.to, sprints: [...planning.to.sprints, { _id: 'S2', name: 'Sprint 7', state: 'active' }] } };
  assert.equal(movedScrumMetadata(doc, 'b', twice).scrum.sprintId, undefined);
  const closed = { ...planning, to: { sprints: [{ _id: 'S', name: 'Sprint 7', state: 'closed' }],
    releases: [{ _id: 'R', name: '1.0', state: 'cancelled' }] } };
  assert.deepEqual(movedScrumMetadata(doc, 'b', closed).scrum, { issueType: 'Bug' });
  assert.deepEqual(movedScrumMetadata(doc, 'b').scrum, { issueType: 'Bug' });
  // The ordinary move's hook leaves a move that set the revision itself alone.
  const fs = require('node:fs'), path = require('node:path');
  assert.match(fs.readFileSync(path.join(__dirname, '../server/models/cards.js'), 'utf8'),
    /if \(!fieldNames\.includes\('boardId'\) \|\| fieldNames\.includes\('scrumRevision'\)\) return;/);
  console.log('  ok - sprint and release are linked by name when exactly one matches');
}

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

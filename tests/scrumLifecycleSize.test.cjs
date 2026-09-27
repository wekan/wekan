const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertScrumLifecycleSize, SCRUM_DOCUMENT_BUDGET: budget } = require('../server/lib/scrumLifecycleSize');
const before = { _id: 's', boardId: 'b', state: 'planned' };
test('normal lifecycle plans and complete ten-thousand-card history fit', () => {
  const rows = Array.from({ length: 10000 }, (_, i) => ({ cardId: `c${i}`, revision: 1,
    before: { sprintId: 's' }, after: { sprintId: null, pastSprintIds: ['s'] } }));
  assert.doesNotThrow(() => assertScrumLifecycleSize(before,
    { ...before, state: 'closed', rolloverPending: rows }));
});
test('BSON size includes multibyte text and rejects oversized rollover before copying History', () => {
  const text = '漢'.repeat(Math.ceil(budget / 3));
  assert.ok(text.length < budget);
  assert.throws(() => assertScrumLifecycleSize(before,
    { ...before, rolloverPending: [{ cardId: 'c', before: { acceptanceCriteria: text }, after: {} }] }),
  /sprint\/rollover plan exceeds/);
});
test('compound History size is checked even when each sprint document fits', () => {
  const text = 'x'.repeat(budget / 2);
  assert.throws(() => assertScrumLifecycleSize({ ...before, goal: text }, { ...before, goal: text }),
    /compound History exceeds/);
});
test('asymmetric History reserves enough room for restoration and its journal', () => {
  assert.throws(() => assertScrumLifecycleSize(before,
    { ...before, goal: 'x'.repeat(budget / 2) }), /History recovery exceeds/);
});

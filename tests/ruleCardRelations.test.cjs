'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ruleCardRelations: relations } = require('../server/lib/ruleCardRelations');
test('canonical and legacy targets are grouped without losing distinct relationship types', () => {
  assert.deepEqual(relations({ cardDependencies: ['target', { cardId: 'target', type: 'blocks' }, { cardId: 'target', type: 'blocks' }],
    targetId_gantt: ['target', 'other', 'other'], linkType_gantt: [0, 1, 2], linkId_gantt: ['PRIVATE-ID'] }), [
    { cardId: 'target', label: 'related-to / blocks / Gantt finish-to-start' },
    { cardId: 'other', label: 'Gantt start-to-start / Gantt finish-to-finish' },
  ]);
  assert.equal(relations({ targetId_gantt: ['last'], linkType_gantt: [3] })[0].label, 'Gantt start-to-finish');
});
test('misaligned arrays and unknown types preserve targets without inventing a relation', () => {
  for (const types of [[], [0, 1], [999], ['0']]) {
    assert.deepEqual(relations({ targetId_gantt: ['target'], linkType_gantt: types }), [{ cardId: 'target', label: 'Gantt target' }]);
  }
  assert.deepEqual(relations({ cardDependencies: [null, {}, 1, { cardId: {}, type: 'blocks' }], targetId_gantt: ['', null, {}] }), []);
});

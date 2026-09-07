'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
  EXTERNAL_RULE_FORMATS,
  parseN8n,
  parseNodeRed,
  parseTrelloButler,
  parseWorkflowData,
} = require('../models/lib/ruleExternalImport');

test('Trello Butler maps known lines and reports every unknown line', () => {
  const result = parseTrelloButler([
    'when a card is added to list "Inbox", move the card to the top',
    'when somebody sings, launch a rocket',
  ].join('\n'));
  assert.equal(result.rules.length, 1);
  assert.equal(result.rules[0].trigger.activityType, 'createCard');
  assert.equal(result.rules[0].trigger.listName, 'inbox');
  assert.equal(result.rules[0].action.actionType, 'moveCardToTop');
  assert.deepEqual(result.unmapped, ['when somebody sings, launch a rocket']);
});

test('n8n maps only recognized, connected trigger/action pairs', () => {
  const result = parseN8n({
    nodes: [
      { name: 'Daily', type: 'scheduleTrigger' },
      { name: 'Archive', type: 'archive card' },
      { name: 'Unknown', type: 'rocket' },
    ],
    connections: { Daily: { main: [[{ node: 'Archive' }, { node: 'Unknown' }]] } },
  });
  assert.equal(result.rules.length, 1);
  assert.equal(result.rules[0].trigger.scheduleKind, 'calendar');
  assert.equal(result.rules[0].action.actionType, 'archive');
  assert.deepEqual(result.unmapped, ['Daily → Unknown']);
});

test('Node-RED supports arrays and flows wrappers without following missing nodes', () => {
  const nodes = [
    { id: 'a', type: 'inject', name: 'Timer', wires: [['b', 'missing']] },
    { id: 'b', type: 'complete', name: 'Done' },
  ];
  for (const input of [nodes, { flows: nodes }]) {
    const result = parseNodeRed(input);
    assert.equal(result.rules.length, 1);
    assert.equal(result.rules[0].action.actionType, 'markCardComplete');
    assert.equal(result.unmapped.length, 0);
  }
});

test('workflow auto-detection is strict and formats are allowlisted', () => {
  assert.deepEqual([...EXTERNAL_RULE_FORMATS].sort(),
    ['n8n', 'nodered', 'trello', 'workflow-auto']);
  assert.equal(parseWorkflowData({ nodes: [], connections: {} }, 'workflow-auto').rules.length, 0);
  assert.equal(parseWorkflowData([], 'workflow-auto').rules.length, 0);
  assert.throws(() => parseWorkflowData({}, 'workflow-auto'), /Unknown workflow format/);
  assert.throws(() => parseWorkflowData({}, 'other'), /Unknown workflow format/);
});


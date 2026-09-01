#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const design = read('docs/Design/Design-WeKan-Trello-Jira.md');
const cardDetails = read('client/components/cards/cardDetails.jade');
const boardsList = read('client/components/boards/boardsList.jade');
const scheduledTriggers = read(
  'client/components/rules/triggers/scheduledTriggers.jade',
);
const boardHeader = read('client/components/boards/boardHeader.jade');

assert.match(design, /Checked against the current source.*2026-08-17/);
assert.match(design, /\| 1 \| Personal Inbox \|/);
assert.match(design, /\| 2 \| My Work and advanced checklist items \|/);
assert.match(design, /\| 3 \| Personal Planner \|/);
assert.match(design, /\| 4 \| Dashboard, Map and saved searches \|/);
assert.match(design, /\| 5 \| Capture integrations and extension surface \|/);

assert.match(cardDetails, /currentBoard\.allowsDueComplete/);
assert.match(cardDetails, /if isLinkedCard/);
assert.match(boardsList, /\+workspaceTree\(/);
for (const schedule of ['once', 'daily', 'weekday', 'weekly', 'monthly']) {
  assert.match(scheduledTriggers, new RegExp(`value="${schedule}"`));
}
for (const view of ['swimlanes', 'lists', 'cal', 'gantt', 'table', 'stats']) {
  assert.match(boardHeader, new RegExp(`board-view-${view}`));
}

console.log('trelloParityRoadmap: current parity and phased gaps are pinned');

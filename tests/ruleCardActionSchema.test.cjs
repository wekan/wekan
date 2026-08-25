'use strict';

// Regression guard for #6630. Action descriptions belong to Actions; putting
// the same `desc` key in a Rules.insert document makes SimpleSchema reject the
// whole rule with keyNotInSchema.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/rules/actions/cardActions.js'),
  'utf8',
);

function handler(selector, nextSelector) {
  const start = source.indexOf(`'click ${selector}'`);
  assert.notEqual(start, -1, `${selector} handler exists`);
  const end = source.indexOf(`'click ${nextSelector}'`, start + selector.length);
  assert.notEqual(end, -1, `${nextSelector} follows ${selector}`);
  return source.slice(start, end);
}

function insertedObjects(block, collection) {
  return [...block.matchAll(new RegExp(`${collection}\\.insert\\(\\{([\\s\\S]*?)\\}\\);`, 'g'))]
    .map((match) => match[1]);
}

const cases = [
  ['set current date', '.js-set-date-action', '.js-remove-datevalue-action'],
  ['remove date value', '.js-remove-datevalue-action', '.js-add-label-action'],
  ['add member', '.js-add-member-action', '.js-add-removeall-action'],
];

for (const [name, selector, nextSelector] of cases) {
  const block = handler(selector, nextSelector);
  const actions = insertedObjects(block, 'Actions');
  const rules = insertedObjects(block, 'Rules');

  assert.ok(actions.some((object) => /\bdesc\b/.test(object)), `${name}: Action keeps desc`);
  assert.ok(rules.length > 0, `${name}: inserts a Rule`);
  assert.ok(rules.every((object) => !/\bdesc\b/.test(object)), `${name}: Rule rejects desc`);
}

// Negative guard: no Rules.insert in this action module may reintroduce an
// Action-only description later.
assert.ok(
  insertedObjects(source, 'Rules').every((object) => !/\bdesc\b/.test(object)),
  'no card-action Rule document contains desc',
);

console.log('\nruleCardActionSchema: 7 checks passed');

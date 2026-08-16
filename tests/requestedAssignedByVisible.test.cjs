'use strict';

// Assigned By shows when there IS an assigner.
// Run: node tests/requestedAssignedByVisible.test.cjs
//
// The read-only branch of Assigned By - what a reader who may not edit the card
// sees - was written `else if getRequestedBy` above `= getAssignedBy`. So a card
// with an assigner and no requester showed neither, and the section drew its
// heading with nothing under it.
//
// The two fields are otherwise the same shape as Members and Assignee: the same
// round + button, opening the same kind of editor. Combining them into one
// template, with member-style avatars, is the next piece of work and is not done
// here.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jade = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/cards/cardDetails.jade'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('requestedAssignedByVisible:');

test('each field\'s read-only branch is gated by its OWN value', () => {
  for (const [label, getter] of [['requested-by', 'getRequestedBy'],
    ['assigned-by', 'getAssignedBy']]) {
    const block = jade.slice(jade.indexOf(`| {{_ '${label}'}}`));
    const branch = /else if (get\w+)\s*\n\s*\+viewer\s*\n\s*= (get\w+)/.exec(block.slice(0, 1400));
    assert.ok(branch, `${label} must have a read-only branch`);
    assert.strictEqual(branch[1], branch[2],
      `${label} is shown when ${branch[2]} has a value, not when ${branch[1]} does`);
    assert.strictEqual(branch[2], getter, `${label} shows ${getter}`);
  }
});

test('and both are added the way a person is added', () => {
  // The same round + Members and Assignee use. This is what makes combining the
  // four into one template the obvious next step rather than a rewrite.
  for (const label of ['requested-by', 'assigned-by']) {
    const block = jade.slice(jade.indexOf(`| {{_ '${label}'}}`), jade.indexOf(`| {{_ '${label}'}}`) + 1200);
    assert.ok(/a\.member\.add-member\.card-details-item-add-button/.test(block),
      `${label} keeps the + button`);
  }
});

console.log(`\nrequestedAssignedByVisible: ${passed} tests passed`);

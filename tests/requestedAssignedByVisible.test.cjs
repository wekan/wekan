'use strict';

// Assigned By shows when there IS an assigner.
// Run: node tests/requestedAssignedByVisible.test.cjs
//
// The read-only branch of Assigned By - what a reader who may not edit the card
// sees - was written `else if getRequestedBy` above `= getAssignedBy`. So a card
// with an assigner and no requester showed neither, and the section drew its
// heading with nothing under it.
//
// The two fields also carry selected board members, so read-only cards show
// their avatars whether or not the optional free-text value is present.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const jade = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/cards/cardDetails.jade'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('requestedAssignedByVisible:');

test('each read-only branch shows its own selected people and optional text', () => {
  for (const [label, people, text] of [
    ['requested-by', 'getRequesters', 'getRequestedBy'],
    ['assigned-by', 'getAssigners', 'getAssignedBy'],
  ]) {
    const block = jade.slice(jade.indexOf(`| {{_ '${label}'}}`));
    const readOnly = block.slice(block.indexOf('\n                  else\n'), 1600);
    assert.ok(new RegExp(`each userId in ${people}`).test(readOnly), `${label} avatars`);
    assert.ok(new RegExp(`if ${text}[\\s\\S]*= ${text}`).test(readOnly), `${label} text`);
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

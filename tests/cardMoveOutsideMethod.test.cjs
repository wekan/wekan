'use strict';

// A card move outside a Meteor method - a REST request moving a swimlane or a
// card, a migration - must not throw on the server. Meteor.userId() throws
// there ("can only be invoked in method calls or publications"), and an
// unguarded call in the card move's position history turned every REST
// swimlane move into a 500 after the first card had already moved, leaving the
// swimlane half moved (found with GHSA-394w-8q99-q4qx).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'models', 'cards.js'), 'utf8');

// Every Meteor.userId() call in the given source that is not guarded: not on a
// line that also has `try {`, and not behind an `isClient` / `Meteor.userId &&`
// check on the same line.
function unguardedCalls(text) {
  return text.split('\n')
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => /Meteor\.userId\(\)/.test(line)
      && !/try \{/.test(line) && !/Meteor\.userId &&/.test(line) && !/isClient/.test(line));
}

test('the card move reads its user without throwing outside a method', () => {
  const at = src.indexOf('let moverId = null;');
  assert.ok(at > 0, 'the move keeps its guarded read of the user');
  const block = src.slice(at, src.indexOf("console.warn('Failed to track card move in history:'", at));
  assert.match(block, /try \{ moverId = Meteor\.userId\(\); \} catch \(e\) \{ moverId = null; \}/);
  assert.match(block, /userId: moverId,/);
  assert.deepStrictEqual(unguardedCalls(block), [], 'no bare Meteor.userId() left in the move\'s history block');
});

test('negative: the detector flags a bare call', () => {
  assert.strictEqual(unguardedCalls("if (Meteor.isServer && Meteor.userId()) {").length, 1);
  assert.strictEqual(unguardedCalls("try { id = Meteor.userId(); } catch (e) {}").length, 0);
});

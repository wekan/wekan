'use strict';

// #6825: the hourly recurring-card job reads the cards with a
// recurrenceInterval; with no index that was a full scan of every card (1.1
// million, 1.1 s on one instance). A partial index holds only the recurring
// cards.
// Run: node tests/recurrenceIndex.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('cards have a partial index on recurrenceInterval', () => {
  assert.match(read('server/models/cards.js'),
    /await ensureIndex\(Cards, \{ recurrenceInterval: 1 \},\s+\{ partialFilterExpression: \{ recurrenceInterval: \{ \$exists: true \} \} \}\);/);
});

test('the job selector asks $exists: true, which lets MongoDB use the partial index', () => {
  // negative: a selector without $exists: true could not use a partial index
  // and would go back to scanning every card
  assert.match(read('server/cardRecurrenceSchedule.js'),
    /recurrenceInterval: \{ \$exists: true, \$nin: \[null, 'none'\] \}/);
});

console.log(`\n${passed} tests passed`);

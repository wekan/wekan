'use strict';

// The collections a card is made of are indexed.
// Run: node tests/cardQueryIndexes.test.cjs
//
// Reported by email against 10.91: "Still slow on loading cards. Test server
// with me as only user." One user is the part that says what it is not: with
// nobody else on the server there is no contention, no queue and no lock - so
// the time is going into the queries themselves.
//
// It was. `cards`, `activities`, `cardComments`, `checklists` and
// `checklistItems` - everything a board draws and everything an opened card
// pulls in - had NO index at all. Every "the cards of this list", "the comments
// of this card", "the newest activities of this board" walked the whole
// collection. That is invisible on a demo board and expensive on a real one,
// and worse on FerretDB, whose SQLite backend has to walk the same documents.
//
// The publication for activities even explains that its selector is kept flat
// "so both push down to FerretDB v1 (SQLite)'s index instead of forcing a
// full-collection scan" - and there was no index for it to push down to.
//
// Each index below matches a selector the app really makes, with the sort it
// really uses, so it can serve both the filter and the order.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardQueryIndexes:');

// model file -> the indexes it must ensure at startup
const WANTED = {
  'models/cards.js': [
    '{ boardId: 1, archived: 1 }',   // the board and its windows
    '{ listId: 1, sort: 1 }',        // a list's cards, in the order drawn
    '{ swimlaneId: 1, sort: 1 }',    // a swimlane's
    '{ parentId: 1 }',               // subtasks
    '{ boardId: 1, cardNumber: 1 }', // search by card number (#5006)
  ],
  'models/activities.js': [
    '{ cardId: 1, createdAt: -1 }',  // the card's Activities feed
    '{ boardId: 1, createdAt: -1 }', // the board sidebar's
    '{ checklistId: 1 }',
  ],
  'models/cardComments.js': [
    '{ cardId: 1, createdAt: -1 }',
    '{ boardId: 1 }',
  ],
  'models/checklists.js': [
    '{ cardId: 1, sort: 1 }',
    '{ boardId: 1 }',
  ],
  'models/checklistItems.js': [
    '{ checklistId: 1, sort: 1 }',
    '{ cardId: 1 }',
  ],
};

test('every collection a card is made of has its indexes', () => {
  for (const [file, indexes] of Object.entries(WANTED)) {
    const source = read(file);
    for (const index of indexes) {
      assert.ok(source.includes(`ensureIndex(`) && source.includes(index),
        `${file} is missing ${index}`);
    }
  }
});

test('they are created the way every other index here is', () => {
  // ensureIndex waits for the replica-set primary and is idempotent, so a
  // restart does not rebuild them and a backend that refuses one logs it
  // instead of stopping the server.
  for (const file of Object.keys(WANTED)) {
    const source = read(file);
    assert.ok(/if \(Meteor\.isServer\) \{/.test(source), `${file} guards on the server`);
    assert.ok(/require\('\/server\/lib\/mongoStartup'\)/.test(source),
      `${file} uses the shared helper`);
    assert.ok(/Meteor\.startup\(async \(\) => \{/.test(source), `${file} waits for startup`);
  }
  const helper = read('server/lib/mongoStartup.js');
  assert.ok(/Index creation must be IDEMPOTENT/.test(helper), 'which is idempotent');
  assert.ok(/failed to ensure index/.test(helper), 'and survives a backend that refuses one');
});

test('the index matches the sort, not only the filter (negative)', () => {
  // An index on the filter alone still leaves an in-memory sort of everything
  // it matched - which for a board with a year of activities is the slow half.
  const activities = read('models/activities.js');
  assert.ok(/\{ cardId: 1, createdAt: -1 \}/.test(activities),
    'the activities feed sorts by createdAt descending, and the index says so');
  const publication = read('server/publications/activities.js');
  assert.ok(/sort: \{ createdAt: -1 \}/.test(publication), 'which is the sort it uses');
  const cards = read('models/cards.js');
  assert.ok(/\{ listId: 1, sort: 1 \}/.test(cards), 'and a list draws its cards by sort');
});

test('the reason is written where the next reader will be (negative)', () => {
  const cards = read('models/cards.js');
  assert.ok(/collection scan/.test(cards), 'what was happening');
  assert.ok(/FerretDB/.test(cards), 'and why it is worse there');
  assert.ok(/one user on a test server/i.test(cards),
    'and why one user was enough to feel it');
});

console.log(`\ncardQueryIndexes: ${passed} tests passed`);

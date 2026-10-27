'use strict';

// A card created over REST is placed on the board in the URL, so its list and
// its swimlane must belong to that board. The PUT route refused another
// board's list or swimlane since #6572, but its create siblings - POST cards
// and POST cards/bulk - wrote them onto the new card, which then pointed at a
// list and a swimlane its own board does not have and showed on neither board.
// Run: node tests/restCardPlacement.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const cards = read('server/models/cards.js');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

// The body of the WebApp handler registered for `route`.
function handler(src, method, route) {
  const at = src.indexOf(`WebApp.handlers.${method}(`, src.indexOf(`'${route}'`) - 40);
  assert.ok(at >= 0 && src.indexOf(`'${route}'`) > 0, `${method} ${route} not found`);
  const next = src.indexOf('\nWebApp.handlers.', at + 10);
  return src.slice(at, next < 0 ? undefined : next);
}

test('the check looks the list and the swimlane up on the board in the URL', () => {
  const at = cards.indexOf('async function restPlacementError(boardId, listId, swimlaneId)');
  assert.ok(at > 0);
  const body = cards.slice(at, cards.indexOf('\n}\n', at));
  assert.match(body, /ReactiveCache\.getList\(\{ _id: listId, boardId \}\)/);
  assert.match(body, /ReactiveCache\.getSwimlane\(\{ _id: swimlaneId, boardId \}\)/);
  // negative: an object such as { $ne: null } is not an id and cannot match any swimlane
  assert.match(body, /typeof listId !== 'string'/);
  assert.match(body, /typeof swimlaneId !== 'string'/);
});

test('POST cards checks the list and the body swimlane before inserting', () => {
  const body = handler(cards, 'post', '/api/boards/:boardId/lists/:listId/cards');
  const check = body.indexOf('restPlacementError(paramBoardId, paramListId, req.body.swimlaneId)');
  assert.ok(check > 0, 'no placement check');
  assert.ok(check < body.indexOf('Cards.direct.insertAsync('), 'the check comes before the insert');
});

test('POST cards/bulk checks the list once and each entry\'s swimlane', () => {
  const body = handler(cards, 'post', '/api/boards/:boardId/lists/:listId/cards/bulk');
  assert.match(body, /restPlacementError\(paramBoardId, paramListId\);/);
  const check = body.indexOf('restPlacementError(paramBoardId, paramListId, swimlaneId)');
  assert.ok(check > 0 && check < body.indexOf('Cards.direct.insertAsync('));
});

test('negative: every REST handler in server/ that inserts a card checks where it goes', () => {
  const offenders = [];
  let inserting = 0;
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || entry.name === '_build') continue;
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.js$/.test(entry.name)) continue;
      const src = read(rel);
      for (const part of src.split('\nWebApp.handlers.').slice(1)) {
        const route = (part.match(/^\w+\(\s*'([^']+)'/) || [])[1] || '?';
        if (!/Cards\.(?:direct\.)?insertAsync\(/.test(part)) continue;
        inserting += 1;
        if (!/restPlacementError\(|createLinkedCardFor\(/.test(part)) offenders.push(`${rel} ${route}`);
      }
    }
  };
  walk('server');
  assert.ok(inserting >= 2, `expected POST cards and cards/bulk among the inserting handlers, saw ${inserting}`);
  assert.deepStrictEqual(offenders, []);
});

console.log(`\n${passed} tests passed`);

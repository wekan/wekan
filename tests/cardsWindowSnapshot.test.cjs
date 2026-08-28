'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(
  path.resolve(__dirname, '../server/publications/cardsWindow.js'),
  'utf8',
);

test('the limited card window refreshes snapshots instead of live-observing', () => {
  const start = source.indexOf('// The window\'s cards.');
  const end = source.indexOf('// The window\'s comments', start);
  const child = source.slice(start, end);

  assert.match(child, /\{ sort: sortOpt, limit: lim \},\s*false/);
  assert.doesNotMatch(child, /\{ sort: sortOpt, limit: lim \},\s*true/);
  assert.match(child, /publication\.added\('cards', _id, fields\)/);
  assert.match(child, /publication\.changed\('cards', card\._id, card\.fields\)/);
  assert.match(child, /publication\.removed\('cards', cardId\)/);
  assert.match(child, /Cards\.find\(windowSel\(board\)\)\.observeChangesAsync/);
  assert.doesNotMatch(child, /setInterval/);
  assert.match(child, /observerHandle\.stop\(\)/);
  assert.match(child, /return null;/);
});

test('the client re-subscribes with limit, filter and sort changes', () => {
  const client = fs.readFileSync(
    path.resolve(__dirname, '../client/components/lists/listBody.js'),
    'utf8',
  );
  assert.match(client, /subscribe\('boardCardsWindow', list\.boardId, mongoSelector, sortBy, limit\)/);
});

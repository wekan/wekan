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
  // #6745: the membership observer watches WHICH cards match and their sort
  // keys only - a full copy of every card of the list per window held the
  // whole board in server memory - and a second observer watches every field
  // of the cards that ARE in the window, so an edit still re-reads it.
  assert.match(child, /Cards\.find\(windowSel\(board\), \{\s*fields: windowOrderFields\(sortOpt\),\s*\}\)\.observeChangesAsync/);
  assert.doesNotMatch(child, /Cards\.find\(windowSel\(board\)\)\.observeChangesAsync/);
  assert.match(child, /Cards\.find\(\{ _id: \{ \$in: ids \} \}\)\.observeChangesAsync/);
  assert.match(child, /await watchWindowContent\(cards\.map\(card => card\._id\)\)/);
  assert.match(child, /if \(contentHandle\) contentHandle\.stop\(\);/);
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

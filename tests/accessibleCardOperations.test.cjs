'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('accessible card writes repeat authorization and placement consistency', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  assert.match(source, /if \(!userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(source, /list\.boardId !== boardId/);
  assert.match(source, /swimlane\.boardId !== boardId/);
  assert.match(source, /allowIsBoardMemberWithWriteAccess\(userId, board\)/);
  assert.match(source, /tripCanary\('board\.write-without-capability'/);
  assert.ok(source.indexOf('allowIsBoardMemberWithWriteAccess(userId, board)')
    < source.indexOf('Cards.direct.insertAsync'), 'authorization precedes the first write');
});

test('card creation preserves common defaults and activity history', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  assert.match(source, /title[\s\S]*trim\(\)\.slice\(0, 1000\)/);
  assert.match(source, /computeSortForIndex\(siblings, position\)/);
  assert.match(source, /await board\.getNextCardNumber\(\)/);
  assert.match(source, /automaticallyOnCard \|\| field\.alwaysOnCard/);
  assert.match(source, /await cardCreation\(userId, card\)/);
});

test('up and down use one acknowledged server operation', () => {
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/minicard.js');
  const legacy = read('server/legacyHtml4.js');
  assert.match(methods, /async moveCardUp\(cardId\)/);
  assert.match(methods, /async moveCardDown\(cardId\)/);
  assert.match(client, /Meteor\.call\(delta < 0 \? 'moveCardUp' : 'moveCardDown'/);
  assert.doesNotMatch(client, /target\.move\(/);
  assert.match(legacy, /moveAccessibleCard\(session\.userId/);
  assert.match(legacy, /DDP\._CurrentMethodInvocation\.withValue/);
});

test('content edits authorize both the pointer and linked target', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  assert.match(source, /await canEditCardOrLinkedCard\(userId, card\)/);
  assert.match(source, /card\.type === 'cardType-linkedCard'/);
  assert.match(source, /card\.type === 'cardType-linkedBoard'/);
  assert.match(source, /allowIsBoardAdmin\(userId, target\)/);
  assert.match(source, /\['title', 'description'\]\.includes\(field\)/);
  assert.match(source, /description-too-long/);
  assert.match(methods, /async updateAccessibleCardContent\(input\)/);
  assert.match(client, /Meteor\.callAsync\('updateAccessibleCardContent'/);
});

test('archive checks every descendant before the first write', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const archives = read('client/components/sidebar/sidebarArchives.js');
  assert.match(source, /await editableCardTree\(userId, card\);\s*if \(archived\) await card\.archive\(\)/);
  assert.match(source, /if \(seen\.size > 10000\)/);
  assert.match(source, /if \(seen\.has\(card\._id\)\)/);
  assert.match(source, /Cards\.find\(\{ parentId: card\._id, deletedAt: null \}\)/);
  assert.match(methods, /async setAccessibleCardArchived\(input\)/);
  assert.match(client, /Meteor\.callAsync\('setAccessibleCardArchived'/);
  assert.match(archives, /Meteor\.callAsync\('setAccessibleCardArchived'/);
});

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
  assert.match(source, /relativeIndex = siblings\.findIndex\(card => card\._id === relativeCardId\)/);
  assert.match(source, /relative card did not belong to the submitted destination/);
  assert.match(source, /relativeIndex \+ \(input\?\.position === 'below' \? 1 : 0\)/);
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

test('list selection uses one server-authorized placement move', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  assert.match(source, /async function moveAccessibleCardToList/);
  assert.match(source, /await editableCard\(userId, input\?\.cardId, boardId\)/);
  assert.match(source, /await editablePlacement\(userId, boardId, String\(input\?\.listId/);
  assert.match(source, /_id: \{ \$ne: card\._id \}/);
  assert.match(source, /computeSortForIndex\(siblings, position\)/);
  assert.match(methods, /async moveAccessibleCardToList\(input\)/);
  assert.match(client, /Meteor\.callAsync\('moveAccessibleCardToList'/);
  assert.doesNotMatch(client, /getMinSort\(listId, card\.swimlaneId\)/);
  assert.match(legacy, /moveAccessibleCardToList\(session\.userId/);
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

test('card dates use one strict acknowledged boundary in HTML5 and HTML4', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDate.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /CARD_DATE_FIELDS = \['receivedAt', 'startAt', 'dueAt', 'endAt'\]/);
  assert.match(source, /await editableCard\(userId, input\?\.cardId/);
  assert.match(source, /await authorizeContentTarget\(userId, card\)/);
  assert.match(source, /invalid-card-date-field/);
  assert.match(source, /Number\.isFinite\(date\.getTime\(\)\)/);
  assert.match(methods, /async updateAccessibleCardDate\(input\)/);
  assert.match(client, /Meteor\.callAsync\('updateAccessibleCardDate'/);
  assert.doesNotMatch(client, /currentCard\.(?:set|unset)(?:Received|Start|Due|End)\(/);
  assert.match(legacy, /legacyOperation === 'edit-card-date'/);
  assert.match(page, /name: 'cardDateValue'/);
  assert.match(page, /cardDateField: field/);
});

test('card color uses one allowlisted acknowledged boundary in HTML5 and HTML4', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /CARD_COLORS\.includes\(color\)/);
  assert.match(source, /\^#\[0-9a-f\]\{6\}\$/);
  assert.match(source, /await authorizeContentTarget\(userId, card\)/);
  assert.match(source, /await card\.setColor\(color \|\| null\)/);
  assert.match(methods, /async updateAccessibleCardColor\(input\)/);
  assert.match(client, /Meteor\.callAsync\('updateAccessibleCardColor'/);
  assert.match(legacy, /legacyOperation === 'edit-card-color'/);
  assert.match(page, /name: 'cardColor'/);
});

test('card labels bind the requested label to the real content board', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/labels.js');
  const legacy = read('server/legacyHtml4.js');
  assert.match(source, /async function setAccessibleCardLabel/);
  assert.match(source, /card\.type === 'cardType-linkedCard'/);
  assert.match(source, /board\.labels \|\| \[\]\)\.some\(label => label\._id === labelId\)/);
  assert.match(source, /card label did not belong to the content board/);
  assert.match(source, /if \(input\.enabled\) await target\.addLabel\(labelId\)/);
  assert.match(methods, /async setAccessibleCardLabel\(input\)/);
  assert.match(client, /Meteor\.callAsync\('setAccessibleCardLabel'/);
  assert.doesNotMatch(client, /await card\.toggleLabel\(/);
  assert.match(legacy, /legacyOperation === 'toggle-card-label'/);
});

test('card people use desired state, content-board membership and worker self policy', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /\['members', 'assignees'\]\.includes\(field\)/);
  assert.match(source, /workerSelfAssignment = field === 'assignees'/);
  assert.match(source, /targetUserId === userId/);
  assert.match(source, /routeBoard\.hasWorker\(userId\)/);
  assert.match(source, /canAssignCardMember\(targetBoard, targetUserId\)/);
  assert.match(source, /card person was not an active content-board member/);
  assert.match(source, /await target\[method\]\(targetUserId\)/);
  assert.match(methods, /async setAccessibleCardPerson\(input\)/);
  assert.match(client, /Meteor\.callAsync\('setAccessibleCardPerson'/);
  assert.doesNotMatch(client, /card\.toggle(?:Member|Assignee)\(/);
  assert.match(legacy, /legacyOperation === 'toggle-card-person'/);
  assert.match(page, /cardPersonField: 'members'/);
  assert.match(page, /cardPersonField: 'assignees'/);
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

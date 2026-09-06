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

test('card sort uses one strictly parsed acknowledged boundary in HTML5 and HTML4', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const details = read('client/components/cards/cardDetails.js');
  const minicard = read('client/components/cards/minicard.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /async function updateAccessibleCardSort/);
  assert.match(source, /await editableCard\(userId, input\?\.cardId, boardId\)/);
  assert.match(source, /await editablePlacement\(userId, boardId, card\.listId, card\.swimlaneId\)/);
  assert.match(source, /Number\.isFinite\(sort\)/);
  assert.match(source, /Math\.abs\(sort\) > 1e15/);
  assert.match(source, /await card\.move\(boardId, card\.swimlaneId, card\.listId, sort\)/);
  assert.match(methods, /async updateAccessibleCardSort\(input\)/);
  assert.match(details, /Meteor\.callAsync\('updateAccessibleCardSort'/);
  assert.match(minicard, /Meteor\.callAsync\('updateAccessibleCardSort'/);
  assert.doesNotMatch(details, /card\.move\(card\.boardId, card\.swimlaneId, card\.listId, sort\)/);
  assert.doesNotMatch(minicard, /card\.move\(card\.boardId, card\.swimlaneId, card\.listId, sort\)/);
  assert.match(legacy, /legacyOperation === 'edit-card-sort'/);
  assert.match(page, /name: 'cardSort'/);
});

test('card locations share bounded exact-scope operations in HTML5 and HTML4', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /MAX_CARD_LOCATIONS = 100/);
  assert.match(source, /async function accessibleLocationTarget/);
  assert.match(source, /await editableCard\(userId, input\?\.cardId/);
  assert.match(source, /await authorizeContentTarget\(userId, card\)/);
  assert.match(source, /Number\.isFinite\(coordinate\)/);
  assert.match(source, /card location did not belong to the content card/);
  assert.match(source, /\$set: \{ locations, locationName: '', locationAddress: '' \}/);
  assert.match(methods, /async saveAccessibleCardLocation\(input\)/);
  assert.match(methods, /async removeAccessibleCardLocation\(input\)/);
  assert.match(client, /Meteor\.callAsync\('saveAccessibleCardLocation'/);
  assert.match(client, /Meteor\.callAsync\('removeAccessibleCardLocation'/);
  assert.doesNotMatch(client, /card\.(?:addLocation|updateLocation|removeLocation)\(/);
  assert.match(legacy, /legacyOperation === 'save-card-location'/);
  assert.match(legacy, /legacyOperation === 'remove-card-location'/);
  assert.match(page, /uiFieldsetForm\(/);
  assert.match(page, /mapLinkFor\(currentUser\?\.profile\?\.mapProvider/);
});

test('card stickers use the shared catalog and acknowledged exact-scope operations', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const details = read('client/components/cards/cardDetails.js');
  const picker = read('client/components/cards/cardStickers.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /MAX_CARD_STICKERS = 200/);
  assert.match(source, /STICKER_PICKER\.find\(sticker => sticker\.icon === icon/);
  assert.match(source, /await authorizeContentTarget\(userId, card\)/);
  assert.match(source, /card sticker index did not belong to the content card/);
  assert.match(source, /stickers\.forEach\(\(sticker, position\) => \{ sticker\.position = position; \}\)/);
  assert.match(methods, /async setAccessibleCardSticker\(input\)/);
  assert.match(methods, /async removeAccessibleCardStickerAt\(input\)/);
  assert.match(details, /Meteor\.callAsync\('removeAccessibleCardStickerAt'/);
  assert.match(picker, /Meteor\.callAsync\('setAccessibleCardSticker'/);
  assert.doesNotMatch(details, /card\.removeStickerAt\(/);
  assert.doesNotMatch(picker, /card\.toggleSticker\(/);
  assert.match(legacy, /stickerParts\.length !== 2/);
  assert.match(legacy, /legacyOperation === 'remove-card-sticker'/);
  assert.match(page, /name: 'stickerChoice'/);
  assert.match(page, /STICKER_PICKER\.map/);
});

test('all seven custom field types share one definition-driven write boundary', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardCustomFields.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /MAX_CARD_CUSTOM_FIELDS = 500/);
  assert.match(source, /async function accessibleCustomFieldTarget/);
  assert.match(source, /boardIds: target\.boardId/);
  assert.match(source, /board\.allowsCustomFields === false/);
  assert.match(source, /case 'text'/);
  assert.match(source, /case 'number'/);
  assert.match(source, /case 'currency'/);
  assert.match(source, /case 'checkbox'/);
  assert.match(source, /case 'date'/);
  assert.match(source, /case 'dropdown'/);
  assert.match(source, /case 'stringtemplate'/);
  assert.match(source, /Number\.isFinite\(value\)/);
  assert.match(source, /custom-field-not-on-card/);
  assert.match(methods, /async setAccessibleCardCustomFieldAssigned\(input\)/);
  assert.match(methods, /async updateAccessibleCardCustomField\(input\)/);
  assert.match(client, /Meteor\.callAsync\('setAccessibleCardCustomFieldAssigned'/);
  assert.match(client, /Meteor\.callAsync\('updateAccessibleCardCustomField'/);
  assert.doesNotMatch(client, /(?:card|tpl\.card)\.setCustomField\(/);
  assert.match(legacy, /legacyOperation === 'assign-card-custom-field'/);
  assert.match(legacy, /legacyOperation === 'edit-card-custom-field-checkbox'/);
  assert.match(page, /buildCustomFieldsWD/);
  assert.match(page, /customFieldDisplayValue/);
});

test('card dependencies share one catalog-bound acknowledged write boundary', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /MAX_CARD_DEPENDENCIES = 500/);
  assert.match(source, /async function accessibleDependencyTarget/);
  assert.match(source, /boardId: target\.boardId/);
  assert.match(source, /DEPENDENCY_TYPE_IDS\.includes\(type\)/);
  assert.match(source, /DEPENDENCY_ICON_CHOICES\.includes\(icon\)/);
  assert.match(source, /\^#\[0-9a-f\]\{6\}\$/);
  assert.match(source, /card-dependency-not-found/);
  assert.match(methods, /async saveAccessibleCardDependency\(input\)/);
  assert.match(methods, /async removeAccessibleCardDependency\(input\)/);
  assert.match(client, /Meteor\.callAsync\('saveAccessibleCardDependency'/);
  assert.match(client, /Meteor\.callAsync\('removeAccessibleCardDependency'/);
  assert.doesNotMatch(client, /card\.(?:addDependency|setDependencyProps|removeDependency)\(/);
  assert.match(legacy, /legacyOperation === 'save-card-dependency'/);
  assert.match(legacy, /legacyOperation === 'remove-card-dependency'/);
  assert.match(page, /normalizeDependencies\(contentCard\?\.cardDependencies\)/);
  assert.match(page, /dependencyTypeOptions/);
  assert.match(page, /dependencyIconOptions/);
});

test('card voting shares one actor-bound acknowledged state machine', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /MAX_BALLOT_QUESTION_LENGTH = 10000/);
  assert.match(source, /async function accessibleBallotTarget/);
  assert.match(source, /canUserSeeBoard\(userId, card\.boardId\)/);
  assert.match(source, /allowIsBoardMember\(userId, board\)/);
  assert.match(source, /vote\.end\.getTime\(\) <= Date\.now\(\)/);
  assert.match(source, /state !== true && state !== false && state !== null/);
  assert.match(methods, /async castAccessibleCardVote\(input\)/);
  assert.match(methods, /async updateAccessibleCardVote\(input\)/);
  assert.match(client, /Meteor\.callAsync\('castAccessibleCardVote'/);
  assert.match(client, /Meteor\.callAsync\('updateAccessibleCardVote'/);
  assert.doesNotMatch(client, /Meteor\.call\('cards\.(?:vote|setVote|unsetVote)/);
  assert.match(legacy, /legacyOperation === 'cast-card-vote'/);
  assert.match(legacy, /legacyOperation === 'configure-card-vote'/);
  assert.match(page, /requestFields\.confirmVoteRemove === card\._id/);
  assert.match(page, /vote\.public[\s\S]*names\(vote\.positive\)/);
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

test('planning poker uses one scoped atomic boundary in HTML5 and HTML4', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /POKER_STATES = \[/);
  assert.match(source, /async function updateAccessibleCardPoker/);
  assert.match(source, /async function castAccessibleCardPoker/);
  assert.match(source, /await accessibleBallotTarget\(userId, input, true\)/);
  assert.match(source, /poker\.end\.getTime\(\) <= Date\.now\(\)/);
  assert.match(source, /!allowIsBoardMember\(userId, board\)/);
  assert.match(source, /\['finish', 'replay', 'estimation', 'remove'\]\.includes\(action\)/);
  assert.match(source, /allowIsBoardAdmin\(userId, routeBoard\)/);
  assert.match(source, /\$pull: pull/);
  assert.match(source, /\$addToSet = \{ \[`poker\.\$\{state\}`\]: userId \}/);
  assert.match(methods, /async castAccessibleCardPoker\(input\)/);
  assert.match(methods, /async updateAccessibleCardPoker\(input\)/);
  assert.match(client, /Meteor\.callAsync\('castAccessibleCardPoker'/);
  assert.match(client, /Meteor\.callAsync\('updateAccessibleCardPoker'/);
  assert.doesNotMatch(client, /Meteor\.call\('cards\.pokerVote'/);
  assert.match(legacy, /legacyOperation === 'cast-card-poker'/);
  assert.match(legacy, /legacyOperation === 'replay-card-poker'/);
  assert.match(page, /legacyOperation: 'configure-card-poker'/);
  assert.match(page, /legacyOperation: 'estimate-card-poker'/);
  assert.match(page, /requestFields\.confirmPokerRemove === card\._id/);
});

test('card completion and time use one validated linked-content boundary', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const details = read('client/components/cards/cardDetails.js');
  const time = read('client/components/cards/cardTime.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /async function accessibleCardMetricTarget/);
  assert.match(source, /card\.type === 'cardType-linkedBoard'/);
  assert.match(source, /card\.type === 'cardType-linkedCard'/);
  assert.match(source, /routeBoard\?\.allowsDueComplete !== true/);
  assert.match(source, /typeof input\?\.value !== 'boolean'/);
  assert.match(source, /completeCustomFieldNumber\(raw, false\)/);
  assert.match(source, /if \(spentTime < 0\)/);
  assert.match(source, /\$unset: \{ spentTime: '' \}.*isOvertime: false/);
  assert.match(methods, /async updateAccessibleCardMetric\(input\)/);
  assert.match(details, /Meteor\.callAsync\('updateAccessibleCardMetric'/);
  assert.match(time, /Meteor\.callAsync\('updateAccessibleCardMetric'/);
  assert.doesNotMatch(details, /card\.setDueComplete\(/);
  assert.doesNotMatch(time, /card\.set(?:SpentTime|IsOvertime)\(/);
  assert.match(legacy, /legacyOperation === 'set-card-due-complete'/);
  assert.match(legacy, /legacyOperation === 'set-card-spent-time'/);
  assert.match(page, /legacyOperation: 'clear-card-spent-time'/);
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

test('Requested By and Assigned By share scoped text and identity boundaries', () => {
  const source = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /\['requestedBy', 'assignedBy'\]\.includes\(field\)/);
  assert.match(source, /\['requesters', 'assigners'\]\.includes\(field\)/);
  assert.match(source, /card-identity-text-too-long/);
  assert.match(source, /board\?\.allowsRequestedBy !== false/);
  assert.match(source, /board\?\.allowsAssignedBy !== false/);
  assert.match(source, /canAssignCardMember\(board, targetUserId\)/);
  assert.match(methods, /async updateAccessibleCardIdentityText\(input\)/);
  assert.match(methods, /async setAccessibleCardIdentity\(input\)/);
  assert.match(client, /Meteor\.callAsync\('updateAccessibleCardIdentityText'/);
  assert.match(client, /Meteor\.callAsync\('setAccessibleCardIdentity'/);
  assert.doesNotMatch(client, /card\.(?:setRequestedBy|setAssignedBy|toggleRequester|toggleAssigner)\(/);
  assert.match(legacy, /legacyOperation === 'edit-card-identity-text'/);
  assert.match(legacy, /legacyOperation === 'toggle-card-identity'/);
  assert.match(page, /cardIdentityField: 'requesters'/);
  assert.match(page, /cardIdentityField: 'assigners'/);
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

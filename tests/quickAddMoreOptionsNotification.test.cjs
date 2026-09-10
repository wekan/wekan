'use strict';

// #3967: quick-add's "More options" panel lets description, due date and
// assignees be filled in BEFORE the card is created, so they travel in the
// SAME Cards.insert call as the title rather than as separate Cards.update
// calls made right after. That matters because every watcher-notification
// email is triggered from a single place — the Activities.after.insert hook
// in server/models/activities.js, which fires once per Activities document.
// A bare-title card followed by N field edits creates 1 (createCard) + N
// activities, i.e. N+1 separate e-mails; a card created with those N fields
// already set creates exactly 1 (createCard) activity, i.e. 1 e-mail.
//
// This is proven two ways:
//  1. server/models/cards.js's card-creation hook (cardCreation) is shown to
//     insert exactly ONE Activities document per Cards.insert, regardless of
//     how many optional fields the inserted doc carries — it does not loop
//     over doc fields the way the customField update hook does.
//  2. client/components/lists/listBody.js's addCard() is shown to fold the
//     "More options" description/due date/assignees into the SAME cardFields
//     object passed to the single Cards.insert call, not into a follow-up
//     Cards.update.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cardsServerSource = fs.readFileSync(
  path.join(__dirname, '..', 'models/cards.js'),
  'utf8',
);
const cardsServerHookSource = fs.readFileSync(
  path.join(__dirname, '..', 'server/models/cards.js'),
  'utf8',
);

// --- 1. Card creation inserts exactly one Activities document -------------

const creationStart = cardsServerSource.indexOf('async function cardCreation(userId, doc) {');
assert.notEqual(creationStart, -1, 'cardCreation must exist');
const creationEnd = cardsServerSource.indexOf('\nasync function cardRemover', creationStart);
assert.notEqual(creationEnd, -1);
const creationBody = cardsServerSource.slice(creationStart, creationEnd);

const insertCalls = creationBody.match(/Activities\.insertAsync/g) || [];
assert.equal(insertCalls.length, 1,
  'positive: card creation inserts exactly one Activities document, ' +
  'no matter how many fields (description, dueAt, assignees, members, ' +
  'labelIds, customFields) were set on the inserted card doc');

assert.doesNotMatch(creationBody, /for\s*\(|\.forEach\(|\.map\(/,
  'negative: cardCreation must not loop over the card\'s fields to fire a ' +
  'per-field activity - that loop is what would turn a single insert into ' +
  'several notification emails');

// Cards.after.insert calls cardCreation and nothing else that inserts an
// Activities document (trackOriginalPosition only updates card position).
const afterInsertStart = cardsServerHookSource.indexOf('Cards.after.insert(async (userId, doc) => {');
assert.notEqual(afterInsertStart, -1);
const afterInsertEnd = cardsServerHookSource.indexOf('\n});', afterInsertStart);
const afterInsertBody = cardsServerHookSource.slice(afterInsertStart, afterInsertEnd);
assert.match(afterInsertBody, /await cardCreation\(userId, doc\)/,
  'positive: Cards.after.insert calls cardCreation once');
assert.equal((afterInsertBody.match(/Activities\.insertAsync/g) || []).length, 0,
  'negative: Cards.after.insert itself never inserts an Activities document ' +
  '(only cardCreation does, exactly once)');

// --- 2. The quick-add "More options" fields flow into the SAME insert -----

const listBodySource = fs.readFileSync(
  path.join(__dirname, '..', 'client/components/lists/listBody.js'),
  'utf8',
);

const addCardStart = listBodySource.indexOf('this.addCard = async (evt) => {');
assert.notEqual(addCardStart, -1);
const addCardEnd = listBodySource.indexOf('\n  this.clickOnMiniCard', addCardStart);
const addCardBody = listBodySource.slice(addCardStart, addCardEnd);

assert.match(addCardBody, /formComponent\.description\?\.get\(\)/,
  'positive: description is read from the same form that supplies the title');
assert.match(addCardBody, /formComponent\.dueAt\?\.get\(\)/,
  'positive: due date is read from the same form that supplies the title');
assert.match(addCardBody, /formComponent\.assignees\?\.get\(\)/,
  'positive: assignees are read from the same form that supplies the title');

const cardFieldsStart = addCardBody.indexOf('const cardFields = {');
assert.notEqual(cardFieldsStart, -1);
const insertCallStart = addCardBody.indexOf('Cards.insert(cardFields)', cardFieldsStart);
assert.notEqual(insertCallStart, -1);
const insertSetup = addCardBody.slice(cardFieldsStart, insertCallStart);

assert.match(insertSetup, /cardFields\.description = description/,
  'positive: description is assigned onto cardFields before the single insert');
assert.match(insertSetup, /cardFields\.dueAt = dueAt/,
  'positive: dueAt is assigned onto cardFields before the single insert');
assert.match(insertSetup, /cardFields\.assignees = assignees/,
  'positive: assignees is assigned onto cardFields before the single insert');

// Negative: none of these three fields are ever sent through a *separate*
// Cards.update/updateAsync call from addCard - that would be the per-field
// notification-email pattern this feature exists to avoid.
assert.doesNotMatch(addCardBody, /Cards\.updateAsync?\(/,
  'negative: addCard never calls Cards.update/updateAsync - description, ' +
  'due date and assignees must travel in the single Cards.insert call, not ' +
  'as follow-up edits that would each fire their own notification email');

console.log('quickAddMoreOptionsNotification: single-insert / single-notification wiring verified for #3967');

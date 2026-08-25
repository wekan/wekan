'use strict';

// Regression coverage for the high-volume query shapes used by search and the
// lazy card window. These assertions deliberately inspect the server query
// construction: a projection or board predicate applied after fetch is already
// too late to prevent database/network over-fetching.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cardsPublication = fs.readFileSync(
  path.join(root, 'server/publications/cards.js'),
  'utf8',
);
const cardsModel = fs.readFileSync(path.join(root, 'server/models/cards.js'), 'utf8');
const dueCardsClient = fs.readFileSync(
  path.join(root, 'client/components/main/dueCards.js'),
  'utf8',
);

assert.match(
  cardsPublication,
  /const attachmentScope = Array\.isArray\(boardIds\)[\s\S]*?'meta\.boardId': \{ \$in: boardIds \}/,
  'has:attachment must be restricted to the authorized card board scope',
);
assert.match(cardsPublication, /Meteor\.publish\('dueCards',[\s\S]*?limit: Math\.max\([\s\S]*?skip:/,
  'Due Cards is database-paginated rather than an unlimited live cursor');
assert.match(dueCardsClient, /Meteor\.subscribe\([\s\S]*?'dueCards'[\s\S]*?page \* PAGE_SIZE/,
  'the Due Cards client requests one database page at a time');
assert.match(dueCardsClient, /js-due-cards-previous-page/);
assert.match(dueCardsClient, /js-due-cards-next-page/);
assert.match(
  cardsPublication,
  /const checklistScope = Array\.isArray\(boardIds\)[\s\S]*?boardId: \{ \$in: boardIds \}/,
  'has:checklist must be restricted to the authorized card board scope',
);

const filenameQueries = cardsPublication.match(
  /getAttachments\(\s*attachmentSelector,\s*\{ fields: \{ cardId: 1 \} \},\s*\)/g,
) || [];
assert.strictEqual(
  filenameQueries.length,
  2,
  'both free-text and attachment: filename searches fetch cardId only',
);

assert.match(
  cardsModel,
  /ensureIndex\(Cards, \{\s*boardId: 1,\s*archived: 1,\s*listId: 1,\s*swimlaneId: 1,\s*sort: 1,\s*_id: 1,\s*\}\)/,
  'the lazy window has equality keys followed by sort and its _id tie-breaker',
);
assert.match(
  cardsModel,
  /ensureIndex\(Cards, \{ boardId: 1, archived: 1, type: 1, dueAt: 1 \}\)/,
  'Due Cards has an authorized-board/equality/date compound index',
);

console.log('database query bounds tests passed');

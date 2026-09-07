'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('HTML5 and HTML4 permanent card delete share one guarded operation', () => {
  const service = read('server/lib/accessibleCardOperations.js');
  const methods = read('server/models/cards.js');
  const client = read('client/components/cards/cardDetails.js');
  const route = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(service, /async function permanentlyDeleteAccessibleCard/);
  assert.match(service, /_id: cardId, boardId, deletedAt: null/);
  assert.match(service, /allowIsBoardAdmin\(userId, board\)/);
  assert.match(service, /Cards\.findOneAsync\(\{ linkedId: card\._id, deletedAt: null \}/);
  assert.match(service, /await Cards\.removeAsync\(card\._id\)/);
  assert.match(service, /CARD_PERMANENTLY_DELETED/);
  assert.match(methods, /async permanentlyDeleteAccessibleCard\(input\)/);
  assert.match(client, /Meteor\.callAsync\('permanentlyDeleteAccessibleCard'/);
  assert.doesNotMatch(client, /Cards\.remove\(card\._id\)/);
  assert.match(route, /legacyOperation === 'permanently-delete-card'/);
  assert.match(route, /confirm-permanently-delete-card/);
  assert.match(page, /confirmPermanentCardDelete === card\._id/);
});

test('card deletion success and failure are both visible to Recovery', () => {
  const events = read('models/recoveryEvents.js');
  const service = read('server/lib/accessibleCardOperations.js');
  assert.match(events, /CARD_PERMANENTLY_DELETED: 'card-permanently-deleted'/);
  assert.match(service, /done: true, deletedData: true/);
  assert.match(service, /done: false/);
  assert.match(service, /user, connection/);
});

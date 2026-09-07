'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..',
  'server/lib/legacyHtml4Pages.js'), 'utf8');
const details = source.match(/async function cardDetailsPage[\s\S]*?\nasync function /)?.[0] || '';

assert.ok(details, 'the Legacy HTML4 card-details renderer exists');
assert.match(details,
  /const sourceRef = await Cards\.findOneAsync\([\s\S]*?fields: \{ boardId: 1 \}/,
  'a linked source is first read as a board-id-only reference');
assert.match(details,
  /if \(sourceRef && await canUserSeeBoard\(userId, sourceRef\.boardId\)\) \{[\s\S]*?contentCard = await Cards\.findOneAsync/,
  'full source content is fetched only inside the successful visibility branch');
assert.doesNotMatch(details,
  /const contentCard = card\.type === 'cardType-linkedCard'[\s\S]{0,160}?Cards\.findOneAsync/,
  'the former unconditional full-source lookup cannot return');

for (const field of ['title', 'description', 'color', 'members', 'assignees', 'userId',
  'receivedAt', 'startAt', 'dueAt', 'endAt', 'createdAt', 'modifiedAt']) {
  assert.match(details, new RegExp(`contentCard\\?\\.${field}`),
    `${field} is rendered from the ACL-authorized real card or safe snapshot`);
}
assert.match(details, /const contentCardId = contentCard\?\._id \|\| card\._id/,
  'child collections stay attached to the authorized content identity');
assert.match(details, /const contentBoardId = contentCard\?\.boardId \|\| card\.boardId/,
  'child collection queries cannot cross into a hidden source board');

console.log('legacyHtml4LinkedCardVisibility: authorized source or safe snapshot passed');

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const cards = fs.readFileSync(path.join(root, 'models/cards.js'), 'utf8');
const minicard = fs.readFileSync(
  path.join(root, 'client/components/cards/minicard.js'),
  'utf8',
);
const details = fs.readFileSync(
  path.join(root, 'client/components/cards/cardDetails.js'),
  'utf8',
);
const publication = fs.readFileSync(
  path.join(root, 'server/publications/boards.js'),
  'utf8',
);

test('linked cards resolve every directly rendered content collection', () => {
  assert.match(cards, /getRealCard\(\)[\s\S]*ReactiveCache\.getCard\(this\.linkedId\)/);
  assert.match(cards, /labels\(\)[\s\S]*const card = this\.getRealCard\(\)/);
  assert.match(cards, /customFieldsWD\(\)[\s\S]*const card = this\.getRealCard\(\)/);
  assert.match(cards, /getDependencies\(\)[\s\S]*this\.getRealCard\(\)\.cardDependencies/);
  assert.match(cards, /getStickers\(\)[\s\S]*this\.getRealCard\(\)\.stickers/);
  assert.match(cards, /addLabel\(labelId\)[\s\S]*Cards\.updateAsync\(this\.getRealId\(\)/);
  assert.match(cards, /getLocations\(\)[\s\S]*const card = this\.getRealCard\(\)/);
  assert.match(cards, /getSubTasksWithParentId\(this\.getRealId\(\)/);
});

test('minicard and opened-card raw helpers use the source card', () => {
  assert.match(minicard, /dependencyBadge\(\)[\s\S]*this\.getDependencies\(\)/);
  assert.match(minicard, /stickers\(\)\s*\{\s*return this\.getStickers\(\)/);
  assert.match(minicard, /isWatching\(\)[\s\S]*this\.getRealCard\(\)\.findWatcher/);
  assert.match(minicard, /hasActiveUploads\(\)[\s\S]*this\.getRealId\(\)/);
  assert.match(details, /stickers\(\)[\s\S]*card\.getStickers\(\)/);
  assert.match(details, /showActivities\(\)[\s\S]*card\.getRealCard\(\)/);
});

test('linked source definitions are published only after visibility filtering', () => {
  const linkedChildren = publication.slice(
    publication.indexOf('// Linked cards (cardType-linkedCard)'),
    publication.indexOf('// Comments for linked cards'),
  );
  assert.match(linkedChildren, /visibleLinkedCardIds\(board\)/);
  assert.match(linkedChildren, /fields: \{ title: 1, slug: 1, labels: 1 \}/);
  assert.match(linkedChildren, /getCustomFields\(/);
  assert.match(linkedChildren, /profile\.avatarUrl/);
  assert.match(linkedChildren, /parentId: \{ \$in: linkedCardIds \}/);
  assert.match(linkedChildren, /cardDependencies: 1/);
  assert.match(linkedChildren, /boardId: \{ \$in: sourceBoardIds \}/,
    'source children stay constrained to authorized boards');
  assert.doesNotMatch(linkedChildren, /token:\s*1|emails:\s*1|services:\s*1/);
});

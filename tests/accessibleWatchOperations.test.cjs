'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('watching uses one visible actor-bound service in HTML5 and HTML4', () => {
  const source = read('server/notifications/watch.js');
  const client = read('client/components/cards/cardDetails.js');
  const legacy = read('server/legacyHtml4.js');
  const page = read('server/lib/legacyHtml4Pages.js');
  assert.match(source, /export async function updateAccessibleWatch/);
  assert.match(source, /if \(!userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(source, /getFeatureFlags\(\)\.disableWatch/);
  assert.match(source, /await canSeeBoard\(userId, board\)/);
  assert.match(source, /level !== null && level !== 'watching'/);
  assert.match(source, /\['watching', 'tracking', 'muted'\]\.includes\(level\)/);
  assert.match(source, /await watchableObj\.setWatcher\(userId, level\)/);
  assert.match(source, /return updateAccessibleWatch\(this\.userId, watchableType, id, level\)/);
  assert.match(client, /await Meteor\.callAsync\('watch', 'card'/);
  assert.match(legacy, /updateAccessibleWatch\(session\.userId, 'card'/);
  assert.match(page, /legacyOperation: 'set-card-watch'/);
  assert.match(page, /watchCardId: contentCardId/);
  assert.match(page, /cardWatch: isWatching \? 'false' : 'true'/);
});

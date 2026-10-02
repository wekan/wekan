'use strict';

// Guard: HookUrlBleed (2026-10-02). The board publication sent every integration of the
// board, URL included, to everybody who could read the board - read-only
// members, and on a public board anonymous visitors. A Slack/Mattermost/Teams
// incoming-webhook URL carries its secret in the path, so reading a board was
// enough to post as that board's integration from anywhere.
// Run: node tests/webhookUrlPublication.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('only the board\'s admins are published an integration\'s URL', () => {
  const pub = read('server/publications/boards.js');
  const at = pub.indexOf('ReactiveCache.getIntegrations(');
  const child = pub.slice(pub.lastIndexOf('async find(board)', at), pub.indexOf('true,', at));
  assert.match(child, /findWhere\(board\.members \|\| \[\], \{ userId: thisUserId, isActive: true, isAdmin: true \}\)/);
  assert.match(child, /fields: isBoardAdmin \? \{ token: 0 \} : \{ boardId: 1, enabled: 1, activities: 1 \}/);
});

test('the card-opened hook still works from the _id alone (negative)', () => {
  const outgoing = read('server/notifications/outgoing.js');
  assert.match(outgoing, /typeof integration\._id === 'string'\n\s*\? \{ _id: integration\._id, boardId: integration\.boardId \}/);
  // What the client filters on is exactly what a non-admin receives.
  const card = read('client/components/cards/cardDetails.js');
  const query = card.slice(card.indexOf('ReactiveCache.getIntegrations({'), card.indexOf('});', card.indexOf('ReactiveCache.getIntegrations({')));
  for (const field of [...query.matchAll(/^\s*(\w+):/gm)].map(m => m[1])) {
    assert.ok(['boardId', 'enabled', 'activities'].includes(field), field);
  }
});

test('negative: no publication sends integrations with their URL to non-admins', () => {
  const dir = path.join(ROOT, 'server/publications');
  for (const file of fs.readdirSync(dir)) {
    const src = fs.readFileSync(path.join(dir, file), 'utf8');
    if (!/getIntegrations\(|Integrations\.find\(/.test(src)) continue;
    // settings.js publishes the global webhooks to site admins only.
    if (file === 'settings.js') {
      assert.match(src, /if \(!user \|\| !user\.isAdmin\) \{\n\s*return this\.ready\(\);/);
      continue;
    }
    assert.match(src, /isBoardAdmin \? \{ token: 0 \}/, file);
  }
});

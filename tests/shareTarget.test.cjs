'use strict';

// #1293: an Android share target that makes a card on a chosen board and list.
// Run: node tests/shareTarget.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sharedCard, SHARE_TARGET, MAX_TITLE } = require('../models/lib/shareTarget.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Positive: what browsers, notes and chat apps share.
assert.deepEqual(sharedCard({ title: 'WeKan', url: 'https://wekan.fi/' }), { title: 'WeKan', description: 'https://wekan.fi/' });
assert.deepEqual(sharedCard({ text: 'Buy milk\nand bread' }), { title: 'Buy milk', description: 'Buy milk\nand bread' });
assert.deepEqual(sharedCard({ title: 'Article', text: 'Look at this https://ex.example/a', url: 'https://ex.example/a' }),
  { title: 'Article', description: 'Look at this https://ex.example/a' }, 'the address once');
assert.deepEqual(sharedCard({ url: 'https://ex.example/only' }), { title: 'https://ex.example/only', description: '' });
assert.deepEqual(sharedCard({ title: 'Same', text: 'Same' }), { title: 'Same', description: '' }, 'no repeated title');
console.log('  ok - a title and description from whatever an app shares');

// Negative.
assert.deepEqual(sharedCard({}), { title: '', description: '' });
assert.deepEqual(sharedCard({ title: 5, text: null }), { title: '', description: '' });
assert.equal(sharedCard({ url: 'javascript:alert(1)' }).title, '', 'only http(s) addresses');
assert.equal(sharedCard({ title: 'x'.repeat(5000) }).title.length, MAX_TITLE);
assert.equal(sharedCard({ title: 'a\n\n  b' }).title, 'a b', 'one-line title');
console.log('  ok - nothing to share makes no card; bad addresses dropped; bounded');

// The manifest declares it, as the module says.
const manifest = JSON.parse(read('public/site.webmanifest.default'));
assert.deepEqual(manifest.share_target, JSON.parse(JSON.stringify(SHARE_TARGET)));
assert.ok(fs.existsSync(path.join(ROOT, 'public/pwa-service-worker.js')), 'an installable app (service worker)');

// Server: the same right as adding a card in that list.
const server = read('server/shareTarget.js');
assert.match(server, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\);/);
assert.match(server, /Lists\.findOneAsync\(\{ _id: input\.listId, boardId: board\._id, archived: \{ \$ne: true \} \}\)/, 'the list must be on that board');
assert.match(server, /if \(!\(await canWriteInList\(this\.userId, board, list\._id\)\)\) throw new Meteor\.Error\('not-authorized'\);/);
assert.match(server, /if \(!board \|\| board\.archived \|\| !list\) throw/);
assert.match(read('server/imports.js'), /import '\/server\/shareTarget';/);

// Client: the route and the page.
const router = read('config/router.js');
assert.match(router, /FlowRouter\.route\('\/share-target', \{\s*name: 'share-target',\s*triggersEnter: \[ensureSignedInUnlessSandstorm\],/);
const jade = read('client/components/main/shareTarget.jade');
assert.match(jade, /select\.js-share-target-board/);
assert.match(jade, /select\.js-share-target-list\(disabled=noBoard\)/);
assert.match(read('client/components/main/shareTarget.js'), /Meteor\.callAsync\('shareTargetCreateCard', \{ boardId, listId, \.\.\.shared\(\) \}\)/);
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
for (const k of ['share-target-title', 'share-target-pick-board', 'share-target-create', 'share-target-empty']) assert.ok(en[k], k);
console.log('  ok - manifest, route, page and a server check of the list\'s write right');

console.log('\nshareTarget: all tests passed');

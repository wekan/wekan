'use strict';

// A board restored from WeKan 6.09 (attachments in CollectionFS) that showed
// only the loading animation (upgrade report, 2026-10). Three faults on that
// path, each pinned here:
//   - the board page waited forever when the board publication stopped with
//     an error; it says so now (tests/boardRefreshReadiness.test.cjs drives it);
//   - the client cache took the async legacy-lookup stub's Promise for an
//     attachment, so a 6.09 card's coverId became a "cover" whose link() threw;
//   - the legacy attachments publication threw on a record with a non-string type.
// Run: node tests/legacyBoardLoad.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

test('a failed board load is shown, not an endless spinner', () => {
  const jade = read('client/components/boards/boardBody.jade');
  assert.match(jade, /else if isBoardReady[\s\S]*?else if boardLoadError\n\s+\+message\(label="board-load-failed"\)\n\s+else\n\s+\+spinner/);
  const js = read('client/components/boards/boardBody.js');
  assert.match(js, /onStop: \(error\) => \{\n\s+if \(error && this\.subscriptionBoardId === currentBoardId\)/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.match(en['board-load-failed'], /server log/);
});

test('negative: the client cache never takes a Promise for an attachment', () => {
  const src = read('imports/reactiveCache.js');
  const client = src.slice(src.indexOf('const ReactiveCacheClient = {'), src.indexOf('const ReactiveCache = {'));
  assert.ok(client.length > 1000, 'found the client cache');
  // Every legacy lookup is async (models/attachments.js stubs, attachments.server.js
  // real ones): a synchronous client cache cannot call one.
  assert.doesNotMatch(client, /WithBackwardCompatibility\(/);
  assert.match(read('models/attachments.js'), /Attachments\.getAttachmentWithBackwardCompatibility = async \(\) => null;/);
  // The server cache awaits it.
  const server = src.slice(src.indexOf('const ReactiveCacheServer = {'), src.indexOf('const ReactiveCacheClient = {'));
  assert.match(server, /await Attachments\.getAttachmentWithBackwardCompatibility\(/);
  for (const line of server.split('\n').filter(l => /WithBackwardCompatibility\(/.test(l))) {
    assert.match(line, /await /, `not awaited: ${line.trim()}`);
  }
});

test('negative: the legacy publication reads its type as a string', () => {
  const src = read('server/publications/legacyAttachments.js');
  assert.match(src, /const type = String\(\(rec\.original && rec\.original\.type\) \|\| copy\.type \|\| 'application\/octet-stream'\);/);
  // and so does nothing else in it call a string method on a raw record field
  assert.doesNotMatch(src, /rec\.(?:original|copies)[\w.]*\.(?:startsWith|endsWith|toLowerCase|split)\(/);
});

test('negative: renaming a migrated attachment never appends "undefined"', () => {
  const src = read('client/components/cards/attachments.js');
  assert.match(src, /const suffix = this\.extensionWithDot \|\| \(this\.extension \? `\.\$\{this\.extension\}` : ''\);/);
  assert.doesNotMatch(src, /\.trim\(\) \+ this\.extensionWithDot/);
});

console.log(`# ${passed} passed`);

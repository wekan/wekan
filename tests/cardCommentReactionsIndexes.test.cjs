'use strict';

// Regression guard for the WeKan-side finding in a reported MongoDB crash log
// (.tools/crash): card_comment_reactions had no index at all, and every board
// open queried it by `cardId: { $in: [...] }` (the card publication) and by
// `boardId` (the board publication) as a full collection scan - 3,397
// COLLSCANs of that one collection in a single log, up to 1.6 s each. The
// crash itself (WiredTiger checkpoint fsync returning ENOSPC on an SMB/DFS
// mount) is a storage problem, documented in
// docs/Databases/MongoDB/Storage-Requirements.md rather than fixable in code.
//
// Source-read test: pins the startup indexes, that the server module is in the
// import list (this app has an explicit server mainModule - a file not
// imported there never runs), and that the storage page exists and is linked.
//
// Run: node tests/cardCommentReactionsIndexes.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('cardCommentReactionsIndexes:');

test('card_comment_reactions gets cardId, boardId and cardCommentId indexes at startup', () => {
  const src = read('server/models/cardCommentReactions.js');
  assert.ok(/import CardCommentReactions from '\/models\/cardCommentReactions'/.test(src));
  assert.ok(/import \{ ensureIndex \} from '\/server\/lib\/mongoStartup'/.test(src));
  for (const key of ['cardId', 'boardId', 'cardCommentId']) {
    assert.ok(src.includes(`await ensureIndex(CardCommentReactions, { ${key}: 1 });`), `index on ${key}`);
  }
  assert.ok(/Meteor\.startup\(async \(\) => \{/.test(src));
});

test('the server module is imported, so the startup hook actually runs', () => {
  assert.ok(read('server/imports.js').includes("import '/server/models/cardCommentReactions';"));
});

test('the queries the log showed scanning are the ones now indexed (negative: none is unindexed)', () => {
  // The two publications read reactions by cardId (card) and boardId (board).
  const boards = read('server/publications/boards.js');
  assert.ok(/getCardCommentReactions\(\{ boardId: board\._id \}/.test(boards));
  const schema = read('models/cardCommentReactions.js');
  for (const field of ['boardId', 'cardId', 'cardCommentId']) {
    assert.ok(new RegExp(`^\\s*${field}: \\{`, 'm').test(schema), `${field} is a schema field`);
  }
});

test('the storage-requirements page exists and the MongoDB docs index links it', () => {
  const page = read('docs/Databases/MongoDB/Storage-Requirements.md');
  assert.ok(/fsync/.test(page) && /SMB/.test(page) && /No space left on device/.test(page));
  assert.ok(read('docs/Databases/MongoDB/README.md').includes('[Storage-Requirements.md](Storage-Requirements.md)'));
  assert.ok(fs.existsSync(path.join(ROOT, 'docs/Backup/Repair-MongoDB.md')), 'the repair page it links to');
});

console.log(`\ncardCommentReactionsIndexes: ${passed} tests passed`);

'use strict';

// Guard: ArchiveBleed (2026-10-02). On Sandstorm, importBoard and cloneBoard archive the
// board the import was started from - `currentBoard`, an id the client sends.
// Nothing checked it, so any user could archive any board by naming it in an
// import of their own. Now only a board admin's board is replaced.
// Run: node tests/sandstormReplaceBoard.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const src = read('models/import.js');

function loadHelper(boards) {
  const start = src.indexOf('async function replaceableBoardId(');
  const body = src.slice(start, src.indexOf('\n}\n', start) + 2);
  const ReactiveCache = { getBoard: async id => boards[id] || undefined };
  // eslint-disable-next-line no-new-func
  return new Function('ReactiveCache', `${body}\nreturn replaceableBoardId;`)(ReactiveCache);
}
const board = admins => ({ hasAdmin: id => admins.includes(id) });

test('the reported shape: naming someone else\'s board no longer archives it', async () => {
  const replaceable = loadHelper({ victim: board(['owner']), mine: board(['me']) });
  assert.equal(await replaceable('me', 'victim'), undefined);
  assert.equal(await replaceable('me', 'missing'), undefined);
  assert.equal(await replaceable(null, 'mine'), undefined);
  // The importer's own board is still replaced (negative).
  assert.equal(await replaceable('me', 'mine'), 'mine');
  assert.equal(await replaceable('me', undefined), undefined);
});

test('negative: every creator.create in the import methods passes a checked board id', () => {
  const calls = [...src.matchAll(/creator\.create\(([^\n]*)\)/g)].map(m => m[1]);
  assert.equal(calls.length, 3);
  for (const args of calls) assert.match(args, /, await replaceableBoardId\(this\.userId, currentBoard(Id)?\)\)?$/, args);
  // Server-side callers never name a board to replace.
  for (const file of ['server/trelloApiImport.js', 'server/routes/importTrelloZip.js']) {
    for (const m of read(file).matchAll(/creator\.create\(([^)]*)\)/g)) assert.match(m[1], /, null$/, file);
  }
});

'use strict';
// #2906 "Adding / Archiving Lists via Script": lists could be added, edited and
// deleted through REST, but not archived or restored - the PUT edits only live
// lists and has no `archived` field. Two routes now do what the list menu does.
//
// Run: node tests/restListArchive.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const src = read('server/models/lists.js');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('restListArchive:');

const route = name => {
  const start = src.indexOf(`WebApp.handlers.post('/api/boards/:boardId/lists/:listId/${name}'`);
  assert.ok(start !== -1, name);
  return src.slice(start, src.indexOf('\n});', start));
};

test('archive: a live list of this board, archived the way the board does it', () => {
  const body = route('archive');
  assert.match(body, /await Authentication\.checkBoardWriteAccess\(req\.userId, paramBoardId\);/);
  assert.match(body, /getList\(\{ _id: paramListId, boardId: paramBoardId, archived: false \}\)/);
  assert.match(body, /await list\.archive\(\);/);
});

test('unarchive: an archived list of this board, restored', () => {
  const body = route('unarchive');
  assert.match(body, /await Authentication\.checkBoardWriteAccess\(req\.userId, paramBoardId\);/);
  assert.match(body, /getList\(\{ _id: paramListId, boardId: paramBoardId, archived: true \}\)/);
  assert.match(body, /await list\.restore\(\);/);
});

test('negative: write access is checked before the list is read, and errors are answered, not thrown', () => {
  for (const name of ['archive', 'unarchive']) {
    const body = route(name);
    assert.ok(body.indexOf('checkBoardWriteAccess') < body.indexOf('getList('), name);
    assert.match(body, /sendJsonResult\(res, \{ code: 404, data: \{ error: 'List not found' \} \}\);/);
    assert.match(body, /\} catch \(error\) \{\s*sendJsonResult\(res, publicErrorData\(error\)\);/);
  }
  assert.match(read('docs/API/Lists.md'), /lists\/:listId\/unarchive/);
});

console.log(`\nrestListArchive: ${passed} tests passed`);

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'models/lib/multilineTitles.js'), 'utf8');
const helpers = import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('one title preserves line breaks; separate titles ignore blank lines and normalize CRLF', async () => {
  const { creationTitles, splitTitleLines } = await helpers;
  assert.deepEqual(creationTitles('  Alpha\r\n\r\nBeta  '), ['Alpha\n\nBeta']);
  assert.deepEqual(creationTitles('  Alpha\r\n\r\nBeta  ', true), ['Alpha', 'Beta']);
  assert.deepEqual(splitTitleLines('A\rB\nC\r\nD'), ['A', 'B', 'C', 'D']);
  assert.deepEqual(creationTitles(' \n\t ', true), []);
  assert.deepEqual(creationTitles(' \n\t '), []);
  assert.deepEqual(creationTitles('<script>x</script>\n[Label] title', true), ['<script>x</script>', '[Label] title']);
});
test('batch positions preserve pasted order at top, bottom, between neighbours and on empty boards', async () => {
  const { titleSortIndexes } = await helpers;
  for (const [prev, next] of [[null, null], [null, -2], [5, null], [-2, -1], [0, 1]]) {
    const indexes = titleSortIndexes(prev, next, 4);
    assert.equal(new Set(indexes).size, 4);
    assert.deepEqual([...indexes].sort((a, b) => a - b), indexes);
    if (prev !== null) assert.ok(indexes.every(i => i > prev));
    if (next !== null) assert.ok(indexes.every(i => i < next));
  }
  assert.deepEqual(titleSortIndexes(0, 1, 0), []);
});
test('all creation paths share the choice; editing names uses textareas', () => {
  for (const file of ['lists/listBody', 'lists/listHeader', 'swimlanes/swimlanes', 'swimlanes/swimlaneHeader']) {
    assert.match(fs.readFileSync(path.join(root, `client/components/${file}.jade`), 'utf8'), /\+multilineTitleChoice/);
    assert.match(fs.readFileSync(path.join(root, `client/components/${file}.js`), 'utf8'), /titlesFromComposer/);
  }
  for (const file of ['lists/listHeader', 'swimlanes/swimlaneHeader']) {
    const jade = fs.readFileSync(path.join(root, `client/components/${file}.jade`), 'utf8');
    assert.match(jade, /textarea\.list-name-input/);
    assert.doesNotMatch(jade, /input\.(?:list|swimlane)-name-input/);
  }
});

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/swimlanes/swimlaneHeader.js', 'utf8');
const start = source.indexOf('  async submit(event, tpl)', source.indexOf('Template.swimlaneAddPopup.events'));
const handler = source.slice(start, source.indexOf("  'click .js-swimlane-template'", start));
const helpers = import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('models/lib/multilineTitles.js', 'utf8')).toString('base64'));
async function insert(lanes, current, above, titles) {
  const rows = [];
  const { titleSortIndexes } = await helpers;
  const input = { value: titles.join('\n'), focus() {}, dispatchEvent() {} };
  const board = { swimlanes: () => lanes, isTemplatesBoard: () => false };
  const context = { Utils: { getCurrentBoard: () => board }, Session: { get: () => 'board' }, titleSortIndexes,
    titlesFromComposer: () => titles, Swimlanes: { insertAsync: async row => rows.push(row) },
    Popup: { back() {} }, Event: class {}, console };
  const events = vm.runInNewContext(`({${handler}})`, context);
  await events.submit({ preventDefault() {} }, { currentSwimlane: current,
    find: selector => selector.includes(':checked') ? { value: above ? 'above' : 'below' } : input });
  return rows;
}
test('above and below preserve multiline order between neighbors', async () => {
  const lanes = [{ _id: 'a', sort: 0 }, { _id: 'b', sort: 10 }, { _id: 'c', sort: 20 }];
  for (const above of [true, false]) {
    const rows = await insert(lanes, lanes[1], above, ['First', 'Second']);
    assert.deepEqual(rows.map(r => r.title), ['First', 'Second']);
    assert.ok(rows[0].sort > (above ? 0 : 10));
    assert.ok(rows[1].sort < (above ? 10 : 20));
    assert.ok(rows[0].sort < rows[1].sort);
    assert.ok(rows.every(r => r.boardId === 'board'));
  }
});
test('first, last, empty board and empty input have defined behavior', async () => {
  const lane = { _id: 'only', sort: 0 };
  assert.ok((await insert([lane], lane, true, ['Top']))[0].sort < 0);
  assert.ok((await insert([lane], lane, false, ['Bottom']))[0].sort > 0);
  assert.equal((await insert([], { _id: 'board' }, false, ['First']))[0].sort, 0);
  assert.deepEqual(await insert([lane], lane, true, []), []);
});

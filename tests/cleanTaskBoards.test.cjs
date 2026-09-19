'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { CARD_SETTINGS_ROWS, rowsForSide } = require('../models/lib/cardSettingsRows');
const { DEFAULT_CARD_ORDER, DEFAULT_MINICARD_ORDER } = require('../models/lib/cardFieldOrder');
const { DATE_FORMATS, resolveDateFormat } = require('../models/lib/dateFormatPolicy');
const read = name => fs.readFileSync(name, 'utf8');
const fields = { allowsMinicardCollapse: true, labelsAboveTitleOnMinicard: false,
  allowsChecklistDueDate: true, allowsChecklistTitle: true };
for (const [field, defaultValue] of Object.entries(fields)) {
  assert.match(read('models/boards.js'), new RegExp(`${field}: \\{\\s*type: Boolean,\\s*defaultValue: ${defaultValue}`));
  assert.ok(read('server/models/boards.js').includes(`'${field}'`), 'board settings API exposes the flag');
  assert.ok(CARD_SETTINGS_ROWS.some(row => Object.values(row).some(spec => spec?.field === field)));
}
for (const [side, order] of [['card', DEFAULT_CARD_ORDER], ['minicard', DEFAULT_MINICARD_ORDER]]) {
  const rows = rowsForSide(side, order);
  for (const row of rows.filter(row => row[side].after)) {
    assert.ok(rows.findIndex(other => other.key === row[side].after) < rows.indexOf(row));
  }
}
// Exercise the real helper: hiding the caret cannot strand a saved collapsed card.
const source = read('client/components/cards/minicard.js');
const body = source.match(/  minicardCollapsed\(\) \{([^]*?)\n  \},/)[1];
let board = {}; let collapsed = true;
const helper = vm.runInNewContext(`(function () {${body}})`, {
  ReactiveCache: { getBoard: () => board }, Utils: { getCardCollapseState: () => collapsed },
});
assert.equal(helper.call({ boardId: 'board' }), true);
board.allowsMinicardCollapse = false;
assert.equal(helper.call({ boardId: 'board' }), false);
board.allowsMinicardCollapse = true;
assert.equal(helper.call({ boardId: 'board' }), true);
collapsed = false;
assert.equal(helper.call({ boardId: 'board' }), false);
for (const fmt of DATE_FORMATS) assert.equal(resolveDateFormat(fmt, {}), fmt);
assert.equal(resolveDateFormat('unsupported', {}), 'YYYY-MM-DD');
assert.equal(resolveDateFormat('YYYY-MM-DD-date-only', { hideDateFormat: true, globalDateFormat: 'DD-MM-YYYY-date-only' }), 'DD-MM-YYYY-date-only');
console.log('cleanTaskBoards: compatible defaults, modifier rows, collapse recovery and date format validation passed');

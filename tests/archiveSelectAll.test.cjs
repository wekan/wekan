'use strict';

// Archive Select All / Select None act on the board icons currently displayed.
// Run: node tests/archiveSelectAll.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const jade = read('client/components/boards/boardsList.jade');
const js = read('client/components/boards/boardsList.js');
const css = read('client/components/boards/boardsList.css');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('archiveSelectAll:');

test('the two buttons are above the archive board icons', () => {
  const title = jade.indexOf('+paneTitle(allBoardsPaneTitle)');
  const controls = jade.indexOf('.archive-multiselection-controls', title);
  const icons = jade.indexOf('ul.board-list.clearfix', controls);
  assert.ok(title < controls && controls < icons,
    'the controls belong between the pane title and board icons');
  assert.ok(/button\.primary\.js-archive-select-all[^\n]*\{\{_ 'select-all'\}\}/.test(jade));
  assert.ok(/button\.js-archive-select-none[^\n]*\{\{_ 'select-none'\}\}/.test(jade));
  assert.strictEqual(en['select-all'], 'Select all');
  assert.strictEqual(en['select-none'], 'Select none');
});

test('they appear only for Archive with Multi-Selection enabled (negative)', () => {
  assert.ok(/isArchiveMultiSelection\(\)[\s\S]{0,140}selectedMenu\.get\(\) === 'archive'[\s\S]{0,80}BoardMultiSelection\.isActive\(\)/.test(js));
  assert.ok(/if isArchiveMultiSelection\n\s+\.archive-multiselection-controls/.test(jade));
});

test('Select All checks exactly the currently displayed boards', () => {
  const at = js.indexOf("'click .js-archive-select-all'");
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/BoardMultiSelection\.add\(boardsForView\(tpl\)\.map\(board => board\._id\)\)/.test(body),
    'the same filtered list the icons render supplies the ids');
});

test('Select None clears every checked board', () => {
  const at = js.indexOf("'click .js-archive-select-none'");
  const body = js.slice(at, js.indexOf('\n  },', at));
  assert.ok(/BoardMultiSelection\.reset\(\)/.test(body));
});

test('the controls form one compact row', () => {
  const at = css.indexOf('.archive-multiselection-controls {');
  const rule = css.slice(at, css.indexOf('}', at));
  assert.ok(/display: flex/.test(rule) && /gap: 8px/.test(rule));
});

console.log(`\narchiveSelectAll: ${passed} tests passed`);

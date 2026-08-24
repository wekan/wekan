'use strict';

// Regression coverage for #6628.
// Run: node tests/issue6628.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const jade = read('client/components/boards/boardsList.jade');
const tableBranch = jade.slice(
  jade.indexOf("if isAllBoardsView 'table'"),
  jade.indexOf('+tablePage(tablePageData)') + '+tablePage(tablePageData)'.length,
);
assert.ok(/if showsAddBoardTile/.test(tableBranch));
assert.ok(/button\.primary\.js-add-board/.test(tableBranch));
assert.ok(/add-template-container/.test(tableBranch));
assert.ok(/add-board/.test(tableBranch));

const js = read('client/components/boards/boardsList.js');
const helper = js.slice(
  js.indexOf('  showsAddBoardTile() {'),
  js.indexOf('\n  },', js.indexOf('  showsAddBoardTile() {')),
);
assert.ok(/sel !== 'archive' && sel !== 'home'/.test(helper));

console.log('issue6628: all tests passed');

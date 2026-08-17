'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(
  path.join(root, 'client/components/boards/boardsList.js'),
  'utf8',
);
const jade = fs.readFileSync(
  path.join(root, 'client/components/boards/boardsList.jade'),
  'utf8',
);

test('an existing Workspace shows Select All and Select None during Multi-Selection', () => {
  const helperAt = js.indexOf('  showsBoardSelectionControls()');
  const helper = js.slice(helperAt, js.indexOf('\n  },', helperAt));

  assert.match(helper, /Boolean\(tpl\.selectedWorkspaceIdVar\.get\(\)\)/);
  assert.match(helper, /\(namedSection \|\| workspace\) && BoardMultiSelection\.isActive\(\)/);
  assert.match(jade, /if showsBoardSelectionControls[\s\S]*?js-board-select-all[\s\S]*?js-board-select-none/);
});

test('Workspace Select All uses exactly the boards rendered by its current view', () => {
  const eventAt = js.indexOf("  'click .js-board-select-all'");
  const event = js.slice(eventAt, js.indexOf('\n  },', eventAt));

  assert.match(event, /boardsForView\(tpl\)\.map\(board => board\._id\)/);
});

test('Select None clears the shared selection in a Workspace too', () => {
  const eventAt = js.indexOf("  'click .js-board-select-none'");
  const event = js.slice(eventAt, js.indexOf('\n  },', eventAt));

  assert.match(event, /BoardMultiSelection\.reset\(\)/);
});

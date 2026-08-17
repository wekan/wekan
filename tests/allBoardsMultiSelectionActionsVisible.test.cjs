'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const jade = read('client/components/boards/allBoardsSidebar.jade');
const events = read('client/components/boards/allBoardsSidebar.js');
const english = JSON.parse(read('imports/i18n/data/en.i18n.json'));

test('the hint and selection actions are always rendered', () => {
  const view = jade.slice(jade.indexOf('template(name="allBoardsMultiSelectionSidebar")'));

  assert.doesNotMatch(view, /if hasBoardsSelected/);
  assert.match(view, /sidebar-multiselection-hint/);
  for (const action of ['star', 'home', 'archive', 'duplicate', 'multiselection-reset']) {
    assert.match(view, new RegExp(`js-${action}`));
  }
});

test('bulk board actions reject an empty selection with the requested message', () => {
  assert.equal(english['no-boards-selected'], 'You did not select any boards.');
  assert.match(events, /if \(!ids\.length\) \{\s*alert\(TAPi18n\.__\('no-boards-selected'\)\)/);

  for (const action of [
    'delete-selected-boards',
    'star-selected',
    'archive-selected-boards',
    'duplicate-selected-boards',
  ]) {
    const start = events.indexOf(`'click .js-${action}'`);
    const body = events.slice(start, events.indexOf('\n  },', start));
    assert.match(body, /selectedBoardIdsOrWarn\(\)/, `${action} must use the guard`);
  }
});

test('Home accepts exactly one selected board', () => {
  assert.equal(english['select-only-one-board'], 'Please select only one board');
  assert.match(
    events,
    /function selectedHomeBoardIdOrWarn\(\) \{\s*const ids = BoardMultiSelection\.getSelectedBoardIds\(\);\s*if \(ids\.length !== 1\) \{\s*alert\(TAPi18n\.__\('select-only-one-board'\)\);\s*return null;/,
    'zero and multiple selections must receive the same exact-one warning',
  );

  const start = events.indexOf("'click .js-home-selected'");
  const body = events.slice(start, events.indexOf('\n  },', start));
  assert.match(body, /const boardId = selectedHomeBoardIdOrWarn\(\)/);
  assert.match(body, /if \(!boardId\) return;/);
  assert.match(body, /Meteor\.call\('toggleDefaultBoard', boardId\)/);
  assert.doesNotMatch(body, /ids\[0\]/, 'many selected boards must not silently use the first');
});

test('the Home section offers unset without archive or duplicate', () => {
  assert.equal(english['unset-selected-home'], 'Unset as Home board');
  assert.match(events, /isHomeSelection\(\) \{\s*return allBoardsMenuVar\.get\(\) === SECTION_HOME/);
  assert.match(
    jade,
    /if isHomeSelection\s+span \{\{_ 'unset-selected-home'\}\}\s+else\s+span \{\{_ 'set-selected-home'\}\}/,
  );
  assert.match(
    jade,
    /unless isHomeSelection\s+hr\s+a\.sidebar-btn\.js-archive-selected-boards[\s\S]*?a\.sidebar-btn\.js-duplicate-selected-boards/,
  );
});

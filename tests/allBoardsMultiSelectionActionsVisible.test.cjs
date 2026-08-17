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

test('every board action rejects an empty selection with the requested message', () => {
  assert.equal(english['no-boards-selected'], 'You did not select any boards.');
  assert.match(events, /if \(!ids\.length\) \{\s*alert\(TAPi18n\.__\('no-boards-selected'\)\)/);

  for (const action of [
    'delete-selected-boards',
    'star-selected',
    'home-selected',
    'archive-selected-boards',
    'duplicate-selected-boards',
  ]) {
    const start = events.indexOf(`'click .js-${action}'`);
    const body = events.slice(start, events.indexOf('\n  },', start));
    const guard = action === 'home-selected'
      ? /selectedHomeBoardIdOrWarn\(\)/
      : /selectedBoardIdsOrWarn\(\)/;
    assert.match(body, guard, `${action} must use its empty-selection guard`);
  }
});

test('Home accepts exactly one selected board', () => {
  assert.equal(english['select-only-one-board'], 'Please select only one board');
  assert.match(
    events,
    /function selectedHomeBoardIdOrWarn\(\) \{\s*const ids = selectedBoardIdsOrWarn\(\)/,
    'the single-board guard must preserve the empty-selection message',
  );
  assert.match(
    events,
    /if \(ids\.length > 1\) \{\s*alert\(TAPi18n\.__\('select-only-one-board'\)\);\s*return null;/,
  );

  const start = events.indexOf("'click .js-home-selected'");
  const body = events.slice(start, events.indexOf('\n  },', start));
  assert.match(body, /const boardId = selectedHomeBoardIdOrWarn\(\)/);
  assert.match(body, /if \(!boardId\) return;/);
  assert.match(body, /Meteor\.call\('toggleDefaultBoard', boardId\)/);
  assert.doesNotMatch(body, /ids\[0\]/, 'many selected boards must not silently use the first');
});

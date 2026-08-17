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
    assert.match(body, /selectedBoardIdsOrWarn\(\)/, `${action} must use the guard`);
  }
});

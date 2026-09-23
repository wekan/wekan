'use strict';
const assert = require('node:assert/strict');
const { inventory } = require('./helpers/menuAuditInventory.cjs');
// These selectors delegate to a form, native navigation, drag adapter, or a
// second action class on the same element. A new unmatched action requires review.
const delegated = new Map([
  ['cardLocationsPopup/js-submit-location', 'form submission'],
  ['cardTextNoteEditPopup/js-submit-text-note', 'form submission'],
  ['editCardSpentTimePopup/js-submit-time', 'form submission'],
  ['addListPopup/js-submit-add-list', 'form submission'],
  ['importDependenciesPopup/js-import-dependencies-submit', 'form submission'],
  ['listHeader/js-list-handle', 'sortable drag handle'],
  ['swimlaneFixedHeader/js-swimlane-header-handle', 'sortable drag handle'],
  ['header/js-header-collapsible-icon', 'styling; another action class handles click'],
  ['tablePageMapPopup/js-open-map', 'native map URL link'],
  ['chooseBoardSourcePopup/js-open-import-page', 'native import route link'],
  ['searchSidebar/js-minilist', 'native search result link'],
  ['memberMenuPopup/js-global-search', 'native global search route link'],
]);
const missing = actions => actions.filter(a => !a.handlers.length && !delegated.has(`${a.template}/${a.selector}`));
const actions = inventory();
assert.ok(actions.length > 400, 'menu inventory must not silently become empty');
assert.deepEqual(missing(actions), [], 'menu action has no located implementation; audit it');
assert.equal(missing([{ template: 'newMenuPopup', selector: 'js-disconnected', handlers: [] }]).length, 1,
  'negative control: an unimplemented action must fail the audit');
assert.equal(missing([{ template: 'newMenuPopup', selector: 'js-working', handlers: ['implementation.js'] }]).length, 0);
console.log(`${actions.length} menu action selectors audited; ${actions.filter(a => !a.testReferences.length).length} have no literal browser-spec reference (not a runtime coverage claim).`);

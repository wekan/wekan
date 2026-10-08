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
  // #6732: Member Settings / Import - the submit of form.js-import-member-dependencies-form.
  ['importMemberDependenciesPopup/js-import-member-dependencies-submit', 'form submission'],
  // 58d166029: the per-board due-reminder Save is a type=submit button inside
  // form.js-due-reminder-form; 'submit .js-due-reminder-form' handles it.
  ['notificationSettingsPopup/js-due-reminder-save', 'form submission'],
  // #1566: the board announcement's Save is a type=submit button inside
  // form.js-board-announcement-form; 'submit .js-board-announcement-form' handles it.
  ['boardAnnouncementPopup/js-board-announcement-save', 'form submission'],
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
// A 'form submission' delegation is only true while the form handler exists and
// the button is still inside that form.
{
  const fs = require('node:fs');
  const js = fs.readFileSync('client/components/settings/notificationSettingsPopup.js', 'utf8');
  const jade = fs.readFileSync('client/components/settings/notificationSettingsPopup.jade', 'utf8');
  assert.match(js, /'submit \.js-due-reminder-form'\(event, instance\)/, 'the due-reminder form has a submit handler');
  const form = jade.slice(jade.indexOf('form.js-due-reminder-form'));
  const formIndent = jade.slice(jade.lastIndexOf('\n', jade.indexOf('form.js-due-reminder-form')) + 1).search(/\S/);
  const save = form.split('\n').find(line => line.includes('js-due-reminder-save'));
  assert.ok(save && /type="submit"/.test(save), 'Save is a submit button');
  assert.ok(save.search(/\S/) > formIndent, 'and it is nested inside the form it submits');
}
{
  const fs = require('node:fs');
  const js = fs.readFileSync('client/components/boards/boardAnnouncement.js', 'utf8');
  const jade = fs.readFileSync('client/components/boards/boardAnnouncement.jade', 'utf8');
  assert.match(js, /'submit \.js-board-announcement-form'\(event, tpl\)/, 'the announcement form has a submit handler');
  const formAt = jade.indexOf('form.js-board-announcement-form');
  const formIndent = jade.slice(jade.lastIndexOf('\n', formAt) + 1).search(/\S/);
  const save = jade.slice(formAt).split('\n').find(line => line.includes('js-board-announcement-save'));
  assert.ok(save && /type="submit"/.test(save), 'Save is a submit button');
  assert.ok(save.search(/\S/) > formIndent, 'and it is nested inside the form it submits');
}
console.log(`${actions.length} menu action selectors audited; ${actions.filter(a => !a.testReferences.length).length} have no literal browser-spec reference (not a runtime coverage claim).`);

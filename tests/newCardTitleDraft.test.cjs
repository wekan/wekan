'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/lists/listBody.js', 'utf8');
const start = source.indexOf("  this.subscribe('unsaved-edits');", source.indexOf('Template.addCardForm.onCreated'));
const setup = source.slice(start, source.indexOf('  this.labels = ', start));
test('draft writes are owned, scoped to list/swimlane/position and cleared only explicitly', () => {
  let owner = 'author'; const writes = [];
  const context = { Meteor: { userId: () => owner }, clearTimeout() {},
    Template: { currentData: () => ({ listId: 'list', swimlaneId: 'lane', position: 'top' }) },
    UnsavedEdits: { set: (key, value) => writes.push({ ...key, value }), reset: key => writes.push({ ...key, cleared: true }) } };
  const tpl = { subscribe() {} };
  vm.runInNewContext(`(function () {${setup}})`, context).call(tpl);
  tpl.saveTitleDraft('Unfinished');
  assert.deepEqual(writes[0], { fieldName: 'newCardTitle:lane:top', docId: 'list', value: 'Unfinished' });
  owner = 'other'; tpl.saveTitleDraft('Must not save'); assert.equal(writes.length, 1);
  owner = null; tpl.saveTitleDraft(''); assert.equal(writes.length, 1);
  owner = 'author'; tpl.saveTitleDraft(''); assert.equal(writes[1].cleared, true);
});
test('draft clears after insertion succeeds and flushes on composer teardown', () => {
  assert.ok(source.indexOf('formComponent.saveTitleDraft(') > source.indexOf('const _id = await Cards.insertAsync(cardFields)'));
  assert.match(source, /Template.addCardForm.onDestroyed[\s\S]*?titleDraftPending !== undefined[\s\S]*?saveTitleDraft/);
  assert.match(source, /titleDraftEdited\) return/);
});

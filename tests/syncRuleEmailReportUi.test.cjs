'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
test('report ignores stale callbacks and destroyed views while sending the current filter', () => {
  const source = fs.readFileSync(require.resolve('../client/components/settings/adminProblems'), 'utf8');
  let created; const calls = [];
  // The legacy rule email review and the stuck List Sync operations follow in
  // the same file; they are exercised by tests/syncRuleEmailLegacy.test.cjs,
  // tests/listSyncStuck.test.cjs, tests/importRuns.test.cjs and their
  // Playwright specs.
  const context = { Template: { syncRuleEmailRecoveryReports: { onCreated(fn) { created = fn; }, helpers() {}, events() {} },
    syncRuleEmailLegacyCommands: { onCreated() {}, helpers() {}, events() {} },
    listSyncStuckOperations: { onCreated() {}, helpers() {}, events() {} },
    interruptedImports: { onCreated() {}, helpers() {}, events() {} } },
    ReactiveVar: class { constructor(value) { this.value = value; } get() { return this.value; } set(value) { this.value = value; } },
    TAPi18n: { __: key => key }, Meteor: { call(method, query, callback) { calls.push({ method, query, callback }); } } };
  vm.runInNewContext(source.slice(source.indexOf('Template.syncRuleEmailRecoveryReports.onCreated')), context);
  const t = { view: { isDestroyed: false } }; created.call(t);
  t.status.set('sent'); t.search.set('abc'); t.load(2);
  assert.equal(calls[1].query.page, 2); assert.equal(calls[1].query.status, 'sent'); assert.equal(calls[1].query.search, 'abc');
  const current = { rows: [{ commandId: 'current' }], total: 21, page: 2, pageSize: 10 };
  calls[1].callback(null, current); calls[0].callback(new Error('stale failure'));
  assert.equal(t.result.get(), current); assert.equal(t.error.get(), '');
  t.load(); calls[2].callback(new Error('failure')); assert.equal(t.error.get(), 'rule-email-recovery-unavailable');
  t.load(); t.view.isDestroyed = true; calls[3].callback(null, current);
  assert.equal(t.result.get().rows.length, 0);
});

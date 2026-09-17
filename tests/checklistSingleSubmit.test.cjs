'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  const source = fs.readFileSync('client/components/cards/checklists.js', 'utf8');
  const handler = source.slice(source.indexOf("  async 'submit .js-add-checklist'"), source.indexOf("  'submit .js-edit-checklist-title'"));
  let finish, inserts = 0, closes = 0, failures = 0;
  const context = {
    Template: { currentData: () => ({ cardId: 'card', position: 'top' }) },
    ReactiveCache: { getCard: () => ({ isLinkedCard: () => false, firstChecklist: () => null }) },
    Utils: { calculateIndexData: () => ({ base: 0 }) },
    Checklists: { insert: (doc, callback) => { inserts++; finish = { resolve: id => callback(null, id), reject: error => callback(error) }; } },
    alert: () => { failures++; },
    setTimeout() {},
  };
  const submit = vm.runInNewContext(`({${handler}})['submit .js-add-checklist']`, context);
  const textarea = { value: ' Test ' };
  const form = { dataset: {}, querySelector: () => textarea };
  const event = { currentTarget: form, preventDefault() {} };
  const tpl = { $: () => ({ click: () => { closes++; } }) };
  const first = submit(event, tpl);
  await submit(event, tpl);
  assert.equal(inserts, 1, 'a second submit during the write does not insert');
  finish.resolve('id');
  await first;
  assert.equal(closes, 1);
  assert.equal(textarea.value, '');
  form.dataset = {};
  textarea.value = 'Retry';
  const failed = submit(event, tpl);
  finish.reject(new Error('denied'));
  await failed;
  assert.equal(failures, 1);
  assert.equal(closes, 1, 'a rejected write leaves the editor open');
  assert.equal(textarea.value, 'Retry');
  assert.equal(form.dataset.submitting, undefined, 'a failed write can be retried');
  const inline = fs.readFileSync('client/lib/inlinedform.js', 'utf8');
  const keyHandler = inline.match(/'keydown form textarea'\(evt, tpl\) \{([\s\S]*?)\n  \},/)[1];
  let stopped = 0, prevented = 0, clicks = 0;
  const run = vm.runInNewContext(`(function(evt, tpl) {${keyHandler}})`, {
    ReactiveCache: { getCurrentUser: () => ({ hasSubmitOnEnter: () => true }) },
    isSubmitKey: evt => evt.key === 'Enter' && !evt.shiftKey,
  });
  const key = { key: 'Enter', preventDefault: () => prevented++, stopPropagation: () => stopped++ };
  const keyTpl = { find: () => ({ click: () => clicks++ }) };
  run(key, keyTpl);
  assert.deepEqual([prevented, stopped, clicks], [1, 1, 1]);
  run({ ...key, shiftKey: true }, keyTpl);
  assert.deepEqual([prevented, stopped, clicks], [1, 1, 1], 'newline keys remain unhandled');
  console.log('Checklist submit is single-flight and Enter stops at its owner');
})().catch(error => { console.error(error); process.exitCode = 1; });

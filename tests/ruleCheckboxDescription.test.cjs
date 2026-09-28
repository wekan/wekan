'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('client/lib/utils.js', 'utf8');
const start = source.indexOf('  getTriggerActionDesc(event, tempInstance) {') + '  getTriggerActionDesc(event, tempInstance) {'.length;
const describe = new Function('event', 'tempInstance', source.slice(start, source.indexOf('\n  },', start)));
test('rule descriptions name selected checkboxes and omit unchecked choices instead of showing on', () => {
  for (const checked of [true, false]) {
    const label = { hasClass: () => false, text: () => ' Attachments ',
      find: selector => selector === 'input[type=checkbox]' ? { length: 1, is: () => checked } : { length: 0 } };
    const parent = {};
    const tpl = { $: node => node === parent ? { find: () => ({ children: () => [label] }) } : node };
    assert.equal(describe({ currentTarget: { parentNode: parent } }, tpl), checked ? 'Attachments' : '');
  }
});

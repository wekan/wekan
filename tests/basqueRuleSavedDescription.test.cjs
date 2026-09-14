'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'client/lib/utils.js'), 'utf8');
const start = source.indexOf('getTriggerActionDesc(event, tempInstance) {');
assert.ok(start >= 0);
const end = source.indexOf('\n  },', start) + 5;
// Execute the production method, without browser globals or a second algorithm.
const describe = vm.runInNewContext(`({${source.slice(start, end)}}).getTriggerActionDesc`);
const eu = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/eu.i18n.json')));
const empty = { length: 0 };
function element(kind, value) {
  return {
    hasClass: name => name === (kind === 'text' ? 'trigger-text' : kind === 'user' ? 'user-details' : 'trigger-dropdown'),
    text: () => value,
    find(selector) {
      if (kind === 'date' && selector === '.js-calendar-toggle') return { length: 1, text: () => value };
      if (kind === 'time' && selector === '.js-calendar-native-time') return { length: 1, val: () => value };
      if (kind === 'user' && selector === 'input') return { length: 1, val: () => value };
      if (kind === 'user' && selector === '.trigger-text') return { length: 1, text: () => 'Nork:' };
      if (kind === 'select' && (selector === 'select' || selector === 'select option:selected')) return { length: 1, text: () => value };
      if (kind === 'input' && selector === 'input') return { length: 1, val: () => value };
      return empty;
    },
  };
}
function run(elements) {
  const container = { find: () => ({ children: () => elements }) };
  return describe({ currentTarget: { parentNode: container } }, { $: value => value });
}
for (const key of ['r-when-the-label', 'r-when-the-member', 'r-when-the-checklist', 'r-when-the-item']) {
  for (const action of ['r-checked', 'r-unchecked']) {
    const result = run([element('input', 'Demo :heart:'), element('text', eu[key]), element('text', ''), element('text', eu[action]), element('button', '')]);
    assert.equal(result, `Demo :heart: ${eu[key].toLowerCase()} ${eu[action].toLowerCase()}`);
    assert.doesNotMatch(result, /hau Demo/);
    assert.equal(result, result.trim(), 'description has no trailing separator');
  }
}
assert.equal(run([element('text', 'When the label'), element('select', 'URGENT'), element('text', 'is added')]),
  'when the label urgent is added', 'other-language order and existing option casing remain');
assert.equal(run([element('input', undefined), element('text', 'Kide hau')]), '* kide hau');
assert.equal(run([element('input', '<b>Demo</b>'), element('text', 'Kide hau')]), '<b>Demo</b> kide hau', 'names remain data; no markup renderer is called');
console.log('Basque saved descriptions: actual production method preserves subject order and input names; no window length dependency');

assert.equal(run([element('text', 'When'), element('date', '  1405-06-23  '), element('time', '09:30'), element('user', 'Demo')]),
 'when 1405-06-23 09:30 nork: Demo');
assert.equal(run([element('user', '')]), 'nork: *');
assert.equal(run([element('input', ' Demo '), element('text', 'Kide hau')]), ' Demo  kide hau', 'input whitespace is preserved as data');
assert.equal(run([element('button', ''), element('text', '')]), '');

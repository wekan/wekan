'use strict';
// #6737: a Date custom field's tooltip said "Starts on" (card-start-on)
// whatever the field was about. It is led by the field's own name now.
// Run: node tests/customFieldDateTooltip6737.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const js = read('client/components/cards/cardCustomFields.js');
const start = js.indexOf('  showTitle() {', js.indexOf("Template['cardCustomField-date'].helpers({"));
const end = js.indexOf('\n  },', start) + 4;
const helper = js.slice(start, end);
const date = new Date('2026-09-04T10:00:00Z');
const context = {
  Template: { instance: () => ({ date: { get: () => date } }) },
  formatDateForDisplay: (value, withTime, fallback) => `FORMATTED(${value.toISOString()})`,
  TAPi18n: { __: key => `[${key}]` },
};
vm.createContext(context);
vm.runInContext(`var helpers = {${helper}};`, context);
const showTitle = data => context.helpers.showTitle.call(data);

// Positive: the field's own name leads the date.
assert.equal(showTitle({ definition: { name: 'Initial due date' } }), 'Initial due date: FORMATTED(2026-09-04T10:00:00.000Z)');
// A field without a name shows just the date.
assert.equal(showTitle({ definition: { name: '  ' } }), 'FORMATTED(2026-09-04T10:00:00.000Z)');
assert.equal(showTitle({}), 'FORMATTED(2026-09-04T10:00:00.000Z)');
// Negative: no translated "Starts on" in it, and nowhere in the custom field code.
assert.ok(!showTitle({ definition: { name: 'Review' } }).includes('[card-start-on]'));
for (const file of ['client/components/cards/cardCustomFields.js', 'client/components/cards/cardCustomFields.jade']) {
  assert.ok(!read(file).includes("'card-start-on'"), `${file} must not label a custom field "Starts on"`);
}
// The card's own Start date keeps its wording (negative: the fix stayed local).
assert.match(read('client/components/cards/cardDate.js'), /card-start-on/);
console.log('customFieldDateTooltip6737: ok');

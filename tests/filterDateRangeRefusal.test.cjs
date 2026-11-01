'use strict';
// The filter sidebar's two date-range forms (card movement, card dates) say
// why a range was refused in the form itself. They used reportValidity(),
// whose bubble Firefox opens over the Apply and Clear buttons under the field,
// taking every click on them while the field had focus: a refused range could
// not be cleared (card-date-range.e2e.js, EVERYTHING's Firefox stage).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'client/components/sidebar/sidebarFilters.js'), 'utf8');
const jade = fs.readFileSync(path.join(root, 'client/components/sidebar/sidebarFilters.jade'), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`  ok - ${name}`); };

console.log('filterDateRangeRefusal:');

test('both range forms report a refusal through rangeRefused, in the form', () => {
  for (const [form, error] of [['js-card-movement-range', 'movementRangeError'], ['js-card-date-range', 'dateRangeError']]) {
    const submit = js.slice(js.indexOf(`'submit .${form}'`), js.indexOf(`'input .${form} input'`));
    assert.match(submit, new RegExp(`rangeRefused\\(end, tpl\\.${error}, !valid\\)`), form);
    // Typing and Clear take the refusal back.
    const rest = js.slice(js.indexOf(`'input .${form} input'`));
    assert.match(rest.slice(0, rest.indexOf('},') + 2), new RegExp(`rangeRefused\\([\\s\\S]*?tpl\\.${error}, false\\)`));
    const shown = jade.slice(jade.indexOf(`form.${form}`));
    assert.match(shown.slice(0, shown.indexOf('\n  form.', 1) > 0 ? shown.indexOf('\n  form.', 1) : 2000),
      new RegExp(`if ${error}\\n\\s+p\\.${form}-error\\.filter-date-range-error\\(role="alert"\\) \\{\\{_ 'filter-date-range-invalid'\\}\\}`));
  }
  assert.match(js, /function rangeRefused\(end, error, refused\) \{\n\s+end\.setCustomValidity\(refused \? TAPi18n\.__\('filter-date-range-invalid'\) : ''\);\n\s+error\.set\(refused\);/);
});

test('Clear takes the refusal back for both forms', () => {
  for (const [button, error] of [['js-clear-movement-range', 'movementRangeError'], ['js-clear-date-range', 'dateRangeError']]) {
    const handler = js.slice(js.indexOf(`'click .${button}'`));
    assert.match(handler.slice(0, handler.indexOf('\n  },')), new RegExp(`rangeRefused\\([\\s\\S]*?tpl\\.${error}, false\\)`));
  }
});

test('negative: no form with a Clear button in the filter sidebar opens the browser bubble', () => {
  const code = js.replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(code, /reportValidity\s*\(/);
});

console.log(`\n${passed} tests passed`);

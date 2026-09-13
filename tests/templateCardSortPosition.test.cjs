'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../client/components/lists/listBody.js'), 'utf8');
const start = source.indexOf('Template.searchElementPopup.onCreated(function () {');
const created = source.slice(start, source.indexOf('Template.searchElementPopup.helpers', start));
const capture = created.match(/this\.position = Template\.currentData\(\)\?\.position;/)[0];
const method = created.match(/this\.getSortIndex = \(\) => \{[\s\S]*?\n  \};/)[0];
for (const position of ['top', 'bottom', undefined]) {
  const first = { id: 'first' }, last = { id: 'last' }, calls = [];
  const template = { currentData: () => ({ position }) };
  const instance = { list: { find: selector => [selector.endsWith(':first') ? first : last] } };
  new Function('Template', 'Utils', capture + method).call(instance, template, {
    calculateIndex(before, after) { calls.push([before, after]); return { base: before ? 10 : -10 }; },
  });
  // Clicking a search result has card data rather than popup position data;
  // after await there may be no Blaze current view at all.
  template.currentData = () => { throw new Error('There is no current view'); };
  assert.equal(instance.getSortIndex(), position === 'top' ? -10 : position === 'bottom' ? 10 : undefined);
  assert.deepEqual(calls, position === 'top' ? [[null, first]] : position === 'bottom' ? [[last, null]] : []);
}
console.log('template sort position: top/bottom survive changed or unavailable Blaze context; unspecified position does not choose either');

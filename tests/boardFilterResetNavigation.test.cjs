'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../client/components/boards/boardHeader.js'), 'utf8');
const start = source.indexOf("  'click .js-filter-reset'(event) {");
const end = source.indexOf("  'click .js-sort-reset'", start);
const handler = source.slice(start, end).trim().replace(/,$/, '');
for (const available of [true, false]) {
  const actions = [];
  const context = {
    Filter: { reset() { actions.push('reset'); } },
    getSidebarInstance: () => available ? { setView() { actions.push('sidebar'); } } : null,
    console: { warn() {} },
  };
  const click = vm.runInNewContext(`({${handler}})['click .js-filter-reset']`, context);
  click({ preventDefault() { actions.push('prevent'); }, stopPropagation() { actions.push('stop'); } });
  assert.deepEqual(actions, available ? ['prevent', 'stop', 'sidebar', 'reset'] : ['prevent', 'stop', 'reset']);
}
console.log('Board filter reset navigation: 2 passed');

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const css = fs.readFileSync('client/components/sidebar/sidebar.css', 'utf8');
const rule = css.match(/\.wip-limit-groups input\[type="checkbox"\] \{([^}]+)\}/)[1];
for (const declaration of ['display: inline-block', 'visibility: visible', 'position: static', 'inset-inline-start: auto', 'appearance: auto']) {
  assert.ok(rule.includes(declaration), declaration);
}
const jade = fs.readFileSync('client/components/sidebar/sidebar.jade', 'utf8').split('template(name="wipLimitGroupsPopup")')[1].split('\ntemplate(')[0];
assert.doesNotMatch(jade, /each \.\.\/boardLists/);
assert.equal((jade.match(/each boardLists/g) || []).length, 2);
assert.equal((jade.match(/type="checkbox"/g) || []).length, 2);
assert.match(jade, /label.flex\n\s+input.js-wip-limit-group-list-toggle/);
assert.match(jade, /label.flex\n\s+input.js-wip-limit-group-new-list/);
console.log('WIP group checkboxes override hidden input styles in both editors');

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const inventory = fs.readFileSync(path.join(root,
  'docs/Design/Accessibility/HTML4-Components.md'), 'utf8');

for (const family of ['/sign-in', '/allboards/', '/b/', '/global-search',
  '/broken-cards', '/import', 'Board rules', 'Admin Panel pages',
  'Account preferences', 'Unknown route (`*`)']) {
  assert.ok(inventory.includes(family), `missing HTML4 inventory family: ${family}`);
}
assert.match(inventory, /Unknown route \(`\*`\)[^\n]+HTTP 404[^\n]+paired screenshots/);
console.log('legacyHtml4Inventory: documented route families passed');

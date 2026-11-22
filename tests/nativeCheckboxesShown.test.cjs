'use strict';

// client/components/forms/forms.css hides every native checkbox (display,
// visibility and an offset); WeKan draws .materialCheckBox instead. A page
// that uses labelled native checkboxes has to show them again, or its
// checkboxes are a label with nothing to tick and no ticked state to see -
// which is how the Budget and billing, Workload and Cloud Panel pages were
// until Playwright tried to tick one. Each such page undoes all three.
// Run: node tests/nativeCheckboxesShown.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const PAGES = [
  { jade: 'client/components/main/billing.jade', css: 'client/components/main/billing.css', scope: '.billing-page' },
  { jade: 'client/components/main/workload.jade', css: 'client/components/main/workload.css', scope: '.workload-page' },
  { jade: 'client/components/cloud/cloudPanel.jade', css: 'client/components/cloud/cloudPanel.css', scope: '.cloud-panel' },
];

assert.match(read('client/components/forms/forms.css'), /\[type="checkbox"\]:not\(:checked\),\n\[type="checkbox"\]:checked \{[^}]*display: none;/,
  'the rule this guard answers is still there');
for (const { jade, css, scope } of PAGES) {
  assert.match(read(jade), /input\(type="checkbox"/, `${jade} has native checkboxes`);
  const rule = new RegExp(`${scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} input\\[type="checkbox"\\][^{]*\\{([^}]*)\\}`).exec(read(css));
  assert.ok(rule, `${css} shows the native checkboxes of ${scope}`);
  for (const decl of ['display: inline-block', 'visibility: visible', 'position: static']) {
    assert.ok(rule[1].includes(decl), `${css}: ${decl}`);
  }
}
console.log(`nativeCheckboxesShown: ${PAGES.length} pages show their checkboxes`);

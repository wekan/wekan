'use strict';

// ONE checkbox look for the whole Admin Panel.
//
// WeKan hides the native checkbox app-wide (forms.css) and draws its own square
// with a green tick — `.materialCheckBox`, which is what Admin Panel / Settings /
// Announcement shows. But several panes use a real <input type="checkbox">: the
// storage Read toggles, the Organizations and Teams feature columns, the Backup
// checkboxes, the Problems summary. Those were either invisible (nothing re-enabled
// them) or re-enabled pane by pane and then drawn by the BROWSER — on Ubuntu a big
// orange box that ignored the chosen theme entirely and matched nothing else on the
// page, at a different size in each pane.
//
// These are CSS source guards; there is no browser here to render anything.
//
// Run: node tests/adminCheckboxStyle.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const rule = (css, selector) => {
  const at = css.indexOf(selector);
  assert.ok(at !== -1, `${selector} must exist`);
  return css.slice(at, css.indexOf('}', at));
};

const admin = read('client/components/settings/settingBody.css');
const forms = read('client/components/forms/forms.css');

console.log('adminCheckboxStyle:');

test('the Admin Panel styles its native checkboxes itself', () => {
  const box = rule(admin, '.setting-content input[type="checkbox"] {');
  assert.ok(/appearance: none;/.test(box) && /-webkit-appearance: none;/.test(box),
    'the browser\'s own rendering is taken out of it - that was the orange box');
  // …and they are visible at all, which the app-wide rule otherwise prevents.
  assert.ok(/visibility: visible;/.test(box) && /display: inline-block;/.test(box),
    'and they are shown, which forms.css hides app-wide');
  assert.ok(/\[type="checkbox"\]:not\(:checked\),\n\[type="checkbox"\]:checked \{[\s\S]*?display: none;/.test(forms),
    'the app-wide hiding rule is still there for everything outside the Admin Panel');
});

test('the tick is the SAME tick the rest of WeKan draws', () => {
  // Same shape, same green: two borders of a rotated box, exactly as
  // .materialCheckBox.is-checked does it.
  const material = rule(forms, '.materialCheckBox.is-checked {');
  const green = /border-bottom: 2px solid (#[0-9a-f]{6});/i.exec(material);
  assert.ok(green, 'the material checkbox draws its tick with a coloured border');
  const tick = rule(admin, '.setting-content input[type="checkbox"]:checked::after {');
  assert.ok(tick.includes(`border-bottom: 2px solid ${green[1]}`),
    `the Admin Panel tick must be the same colour (${green[1]})`);
  assert.ok(/transform: rotate\(40deg\);/.test(tick) && /transform: rotate\(40deg\);/.test(material),
    'and the same rotated shape');
  // Not the theme accent: a tick is a tick, and WeKan's is green everywhere.
  assert.ok(!/--theme-accent/.test(tick), 'the tick does not follow the theme');
});

test('the box disappears behind the tick, the way the material one does', () => {
  const checked = rule(admin, '.setting-content input[type="checkbox"]:checked {');
  assert.ok(/border-color: transparent;/.test(checked));
});

test('grey icons and disabled states are handled', () => {
  assert.ok(/body\.grey-icons-enabled \.setting-content input\[type="checkbox"\]:checked::after/.test(admin),
    'grey icons grey the tick here too');
  const disabled = rule(admin, '.setting-content input[type="checkbox"]:disabled {');
  assert.ok(/opacity: 0\.6;/.test(disabled));
  assert.ok(/:focus-visible/.test(admin), 'and a keyboard user can see the focus');
});

test('no pane re-enables or re-sizes checkboxes on its own any more', () => {
  // Every pane that did picked its own size, which is why no two panes agreed.
  for (const file of ['client/components/settings/attachments.css',
    'client/components/settings/peopleBody.css',
    'client/components/settings/tablePage.css',
    'client/components/settings/adminReports.css']) {
    const css = read(file);
    for (const m of css.matchAll(/([^{}]*input\[type="checkbox"\][^{}]*)\{([^{}]*)\}/g)) {
      const [, selector, body] = m;
      // A pane may still say something about the LABEL beside a disabled box, and
      // about spacing - but not about the checkbox's own size or visibility.
      if (/\+ label/.test(selector)) continue;
      assert.ok(!/width:|height:|visibility:|display: (inline-)?block/.test(body),
        `${file}: ${selector.trim()} must leave the checkbox itself to the shared rule`);
    }
  }
});

test('the panes that use a native checkbox are the ones this is for', () => {
  // If these ever move to the .materialCheckBox markup the rule can go; until then
  // this is what it covers, and it names them so the reason is not lost.
  const panes = {
    'client/components/settings/attachments.jade': ['js-toggle-gridfs-read',
      'js-toggle-filesystem-read', 'js-backup-attachments', 's3-read'],
    'client/components/settings/peopleBody.jade': ['js-toggle-org-feature',
      'js-toggle-team-feature', 'selectUserChkBox'],
    'client/components/settings/problemsSummary.jade': ['js-problem-check'],
  };
  for (const [file, classes] of Object.entries(panes)) {
    const jade = read(file);
    for (const cls of classes) {
      assert.ok(jade.includes(cls), `${file}: ${cls} is one of the native checkboxes`);
    }
  }
});

console.log(`\n${passed} tests passed`);

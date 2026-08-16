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
  // …and they are visible at all, which the app-wide rule otherwise prevents. It
  // hides in THREE ways - display, visibility and a -9999px inline offset - so all
  // three must be undone. Undoing two leaves the box 9999px to the side: invisible
  // when unchecked, and visible when checked only because the checked state sets its
  // own offset. "Only the tick shows" is what that looks like.
  const hide = rule(forms, '[type="checkbox"]:not(:checked),');
  for (const prop of ['display', 'visibility', 'inset-inline-start']) {
    assert.ok(new RegExp(`${prop}:`).test(hide), `the app-wide rule hides with ${prop}`);
    assert.ok(new RegExp(`${prop}:`).test(box), `so the Admin Panel must undo ${prop}`);
  }
  assert.ok(/inset-inline-start: auto;/.test(box), 'the offset is undone, not repeated');
  assert.ok(/\[type="checkbox"\]:not\(:checked\),\n\[type="checkbox"\]:checked \{[\s\S]*?display: none;/.test(forms),
    'the app-wide hiding rule is still there for everything outside the Admin Panel');
});

test('the form-field styling of every input is undone for a checkbox', () => {
  // forms.css styles `input:not([type=file])` as a form FIELD: a grey background, a
  // 6px radius, padding, a bottom margin - and `min-height: 41px`. The material
  // declarations override the rest, but nothing overrode the height floor, so a 13px
  // box was drawn as a tall rectangle and the tick it becomes was stretched with it.
  // `input[type="radio"]` in that same file resets it for exactly this reason.
  const field = rule(forms, 'input:not([type=file]),');
  assert.ok(/min-height: 41px;/.test(field), 'the floor that has to be undone');
  const box = rule(admin, '.setting-content input[type="checkbox"] {');
  assert.ok(/min-height: 0;/.test(box), 'undone, or the box is 41px tall');
  // …and everything else that rule sets is overridden too.
  for (const [prop, value] of [['background', 'transparent'], ['padding', '0'],
    ['margin', '0'], ['display', 'inline-block'], ['box-sizing', 'content-box']]) {
    assert.ok(new RegExp(`${prop}: ${value};`).test(box), `${prop} must be reset`);
  }
});

test('an Admin Panel checkbox IS the material checkbox, declaration for declaration', () => {
  // Not "looks a bit like it": every declaration of .materialCheckBox and of
  // .materialCheckBox.is-checked must be here, so the unchecked square, the checked
  // tick AND the `transition: 0.2s` that animates between them are the same. Drawing
  // only a tick with a pseudo-element gets the checked state right and loses the
  // other two - which is exactly what was wrong before.
  // COMMENTS FIRST, then declarations. A `/* … */` explaining why a rule is
  // what it is can easily contain a colon, and a line of one was read as a
  // declaration the other rule was then missing.
  const decls = block => new Set(block.replace(/\/\*[\s\S]*?\*\//g, '').split('\n')
    .map(line => line.trim().replace(/;$/, ''))
    .filter(line => line.includes(':')));
  const missing = (from, to) => [...decls(from)].filter(d => !decls(to).has(d));

  const unchecked = rule(admin, '.setting-content input[type="checkbox"] {');
  assert.deepStrictEqual(missing(rule(forms, '.materialCheckBox {'), unchecked), [],
    'the unchecked box is the material one - the grey square, and the transition');
  assert.ok(/transition: 0\.2s;/.test(unchecked), 'which is what animates the change');

  const checked = rule(admin, '.setting-content input[type="checkbox"]:checked {');
  assert.deepStrictEqual(missing(rule(forms, '.materialCheckBox.is-checked {'), checked), [],
    'and the checked state is the material one: the square morphs into the tick');

  // The tick is green, not the theme accent: WeKan's tick is green everywhere.
  assert.ok(/border-bottom: 2px solid #3cb500;/.test(checked));
  assert.ok(!/--theme-accent/.test(checked), 'the tick does not follow the theme');
});

test('disabled and focus states are handled', () => {
  // The Grey Icons feature is gone (one icon set: Font Awesome), and so is the
  // body.grey-icons-enabled variant of the tick that used to be asserted here.
  // Assert the REMOVAL instead, so a half-revert cannot bring back a selector
  // that nothing sets.
  assert.ok(!/grey-icons/.test(admin), 'no grey-icons variant remains in this stylesheet');
  const disabled = rule(admin, '.setting-content input[type="checkbox"]:disabled {');
  assert.ok(/opacity: 0\.6;/.test(disabled));
  assert.ok(/:focus-visible/.test(admin), 'and a keyboard user can see the focus');
});

test('no pane re-enables or re-sizes checkboxes on its own any more', () => {
  // Every pane that did picked its own size, which is why no two panes agreed.
  for (const file of ['client/components/settings/attachments.css',
    'client/components/settings/peopleBody.css',
    'client/components/settings/tablePage.css',
    'client/components/settings/adminProblems.css']) {
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
    'client/components/settings/peopleBody.jade': ['js-toggle-org-feature',
      'js-toggle-team-feature', 'selectUserChkBox'],
    'client/components/settings/problemsSummary.jade': ['js-problem-check'],
  };
  for (const [file, classes] of Object.entries(panes)) {
    const jade = read(file);
    for (const cls of classes) {
      assert.ok(jade.includes(cls), `${file}: ${cls} is one of the native checkboxes`);
    }
    assert.ok(/type="checkbox"/.test(jade), `${file} still has a native checkbox`);
  }

  // Attachments left this list: styling a NATIVE checkbox into a tick needs the
  // browser to drop its own rendering for `appearance: none`, and where it does
  // not - as in the browser #6465 was reported from - the geometry applies and the
  // colours do not, so every box on those panes drew as a grey rotated rectangle.
  // They are `.materialCheckBox` divs now, like the rest of WeKan.
  const attachments = read('client/components/settings/attachments.jade');
  assert.ok(!/type="checkbox"/.test(attachments),
    'Attachments must not go back to native checkboxes');
  assert.ok(/\.materialCheckBox#s3-read\(class="\{\{#if cloudRead\.s3\}\}is-checked/.test(attachments),
    'its boxes are the material one, bound to the setting');
});

test('several checkboxes side by side are one row', () => {
  // Attachments / Backup's "Attachments, Avatars, Data": inline labels would let a
  // label wrap away from its own checkbox, and the box shifts a few pixels as it
  // becomes the tick, which unaligned text follows.
  const row = rule(admin, '.setting-content .checkbox-row {');
  assert.ok(/display: flex;/.test(row) && /flex-wrap: wrap;/.test(row));
  // One ITEM of that row is a label around a native checkbox, or - since #6465 -
  // the `a.flex > .materialCheckBox + span` the rest of WeKan uses. One rule
  // covers both, so the lookup is on the pair.
  const label = rule(admin, '.setting-content .checkbox-row label,');
  assert.ok(/\.setting-content \.checkbox-row a\.flex \{/.test(label),
    'the material checkbox anchor is placed by the same rule');
  assert.ok(/display: inline-flex;/.test(label) && /align-items: center;/.test(label),
    'each item keeps its own box and words together');
  // Backup's three are material checkboxes now (see above), so the row holds
  // anchors rather than labels - what must not change is that they are ONE row.
  const jade = read('client/components/settings/attachments.jade');
  assert.ok(/\.form-group\.checkbox-row\n(\s+a\.flex\.js-toggle-checkbox\n\s+\.materialCheckBox\.js-backup-\w+\.is-checked\n\s+span [^\n]*\n){3}/.test(jade),
    'the Backup include row is three material checkboxes in one row');
});

test('a checkbox written as label > input gets its gap', () => {
  // The `.materialCheckBox` markup is an anchor with a box and a span; a native one
  // written as `label > input + text` has nothing between the box and the words.
  const gap = rule(admin, '.setting-content label > input[type="checkbox"] {');
  assert.ok(/margin-inline-end: 6px;/.test(gap), 'logical margin, so RTL is right too');
});

test('the Admin Panel Save buttons are one button, in the panes and in the popups', () => {
  // The panes' Save is a button.primary; the popups' is an input[type=submit].primary
  // in a flex row, and the `.wide` that was meant to size it never applied - the rule
  // for it in forms.css is a DESCENDANT selector, which an input can never match.
  const save = rule(admin, '.setting-content .content-body .main-body .setting-detail button.primary,');
  // Every Admin Panel popup that has a Save, not just some of them.
  const POPUPS = ['editUserPopup', 'editOrgPopup', 'editTeamPopup', 'newUserPopup',
    'newOrgPopup', 'newTeamPopup', 'editTranslationPopup', 'newTranslationPopup'];
  for (const popup of POPUPS) {
    assert.ok(save.includes(`.pop-over[data-popup='${popup}'] .buttonsContainer input[type="submit"].primary`),
      `${popup}'s Save is styled with the panes' Save, not separately`);
  }
  // …and that list is the popups that actually have one: an Admin Panel template
  // with a `.buttonsContainer` submit must be in it, or its Save is left plain.
  const templates = ['client/components/settings/peopleBody.jade',
    'client/components/settings/translationBody.jade'];
  for (const file of templates) {
    const jade = read(file);
    let current = null;
    for (const line of jade.split('\n')) {
      const m = /^template\(name="(\w+)"\)/.exec(line.trim());
      if (m) current = m[1];
      if (!/input\.primary\.wide\(type="submit"/.test(line)) continue;
      // modifyTeamsUsers is a panel inside the People pane, not a popup of its own.
      if (current === 'modifyTeamsUsers') continue;
      assert.ok(POPUPS.includes(current),
        `${current} has a Save and must be styled with the others`);
    }
  }
  // The board sidebar and the member menu use .buttonsContainer too - those are not
  // Admin Panel buttons, which is why the popups are named one by one.
  assert.ok(!/\.pop-over \.buttonsContainer input/.test(admin),
    'the rule must not claim every popup in the app');
  assert.ok(/background: var\(--theme-accent, #005377\);/.test(save),
    'the theme accent, like every other Admin Panel button');
  assert.ok(/padding: 9px 35px;/.test(save) && /font-weight: 700;/.test(save),
    'and the same size and weight');
  // …with the hover/focus and active states listed for both as well.
  assert.ok(/button\.primary:hover,[\s\S]*?input\[type="submit"\]\.primary:hover/.test(admin));
  assert.ok(/button\.primary:active,[\s\S]*?input\[type="submit"\]\.primary:active/.test(admin));
});

console.log(`\n${passed} tests passed`);

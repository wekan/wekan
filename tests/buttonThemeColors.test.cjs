'use strict';

// Buttons must follow the user's theme (Member Settings → Change color sets
// --theme-accent on :root). The global button base and primary buttons hardcoded
// black/blue and ignored the theme; they now use var(--theme-accent, <fallback>)
// so the default look is unchanged but a theme override recolors them app-wide.
//
// Run: node tests/buttonThemeColors.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('buttonThemeColors:');

check('forms.css: base button + primary buttons use var(--theme-accent)', () => {
  const css = read('client/components/forms/forms.css');
  // base button background themed (default black preserved as fallback)
  assert.ok(/background:\s*var\(--theme-accent, #000\)/.test(css), 'base button background must be themed');
  // primary button themed
  assert.ok(/background:\s*var\(--theme-accent, #005377\)/.test(css), 'button.primary must be themed');
  assert.ok(/background:\s*var\(--theme-accent, #004766\)/.test(css), 'button.primary:hover must be themed');
  assert.ok(/background:\s*var\(--theme-accent, #01628c\)/.test(css), 'button.primary:active must be themed');
});

check('every settings form ends in a themed Save, not a black Apply', () => {
  // Member Settings → Change Settings had a submit that carried NO `.primary`, so
  // it fell to the base rule above - whose fallback is `#000`, a pure black button
  // with no theme in it - and it was the one settings form in WeKan labelled
  // "Apply" while the rest say Save. Both came from the same line.
  const jade = read('client/components/users/userHeader.jade');
  const at = jade.indexOf('js-apply-user-settings');
  assert.ok(at > -1, 'the Change Settings submit must exist');
  const button = jade.slice(jade.lastIndexOf('\n', at), jade.indexOf('\n', at));

  assert.ok(/\.primary/.test(button),
    'it must be .primary, or it renders with the base rule\'s black fallback');
  assert.ok(/value="\{\{_ 'save'\}\}"/.test(button), 'and say Save');
  assert.ok(!/'apply'/.test(button), 'not Apply');

  // The Change Language form directly above it is the shape to match.
  assert.ok(/input\.primary\.wide\(type="submit" value="\{\{_ 'save'\}\}"\)/.test(jade),
    'the Change Language Save is the sibling this matches');
});

check('admin (settingBody) + People (peopleBody) buttons follow the theme accent', () => {
  const sb = read('client/components/settings/settingBody.css');
  assert.ok(/var\(--theme-accent, #005377\)/.test(sb), 'admin action button must be themed');
  // People's own search button lived in the page-title bar (`.ext-box`), which is
  // gone - an Admin Panel page is the left menu and the pane, nothing above them. Its
  // search moved into the shared table page's controls row, so the buttons a People
  // pane shows are that row's, themed in paginationControls.css.
  const pb = read('client/components/settings/peopleBody.css');
  assert.ok(!/\.ext-box/.test(pb), 'the title-bar rules must be gone, not left rotting');
  const pager = read('client/components/main/paginationControls.css');
  assert.ok(/background:\s*var\(--theme-accent/.test(pager),
    'the shared controls buttons must be themed');
  // no bare hardcoded WeKan-accent hexes remain in these two files
  for (const [f, css] of [['settingBody.css', sb], ['peopleBody.css', pb]]) {
    const bare = css.match(/(?<!, )(?<!\()#(?:01628c|005377|004766)(?!\))/g) || [];
    assert.strictEqual(bare.length, 0, `${f} must have no un-themed accent hexes`);
  }
});

check('the Change Password button is themed like the Save button beside it', () => {
  // xet7: "Member Settings / Change Password / Update password button should be
  // styled with theme like Member Settings / Edit Profile / Save button".
  //
  // Change Password renders `+atForm(state='changePwd')` from useraccounts, and
  // its submit button carries that package's own classes - `button.at-btn` with
  // no `.primary` of ours - so it fell back to the plain grey `button` rule
  // while the Save button one entry above it in the same menu was themed. Two
  // buttons, one menu, two looks.
  const css = read('client/components/forms/forms.css');
  const strip = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Named in the SAME rules as `.primary`, not given a copy of them: one home
  // for the accent, the hover and the active state.
  for (const [what, selector] of [
    ['the resting state', '.pop-over .at-form button.at-btn {'],
    ['hover and focus', '.pop-over .at-form button.at-btn:focus {'],
    ['the active state', '.pop-over .at-form button.at-btn:active {'],
  ]) {
    const at = strip.indexOf(selector);
    assert.notStrictEqual(at, -1, `${what}: the popup at-btn must be in that rule`);
    const head = strip.slice(strip.lastIndexOf('}', at) + 1, at + selector.length);
    assert.ok(/\.primary/.test(head),
      `${what}: it must share the rule with .primary, not restate it`);
  }
  // ...and that shared rule is the themed one.
  const at = strip.indexOf('.pop-over .at-form button.at-btn {');
  const rule = strip.slice(at, strip.indexOf('}', at));
  assert.ok(/background: var\(--theme-accent, #005377\);/.test(rule),
    'so it follows the theme, like the Save button');
  assert.ok(/color: #fff;/.test(rule), 'with the same white label');

  // The form itself is unchanged - this is styling only, not a rewritten form.
  const jade = read('client/components/users/userHeader.jade');
  assert.ok(/template\(name="changePasswordPopup"\)\n\s*\+atForm\(state='changePwd'\)/.test(jade),
    'Change Password still renders the useraccounts form');
});

console.log(`\n${passed} passed`);

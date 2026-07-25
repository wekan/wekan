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

console.log(`\n${passed} passed`);

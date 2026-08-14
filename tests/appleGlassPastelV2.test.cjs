'use strict';

// Source-level contract for the full-application Apple Glass Pastel v2 layer.
// The browser suite verifies rendering and interaction; these fast guards catch
// accidental unscoped rules, missing imports and regressions in the visual
// tokens even when a WeKan server is not available.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const base = read('client/components/main/appleGlassPastel.css');
const pages = read('client/components/boards/appleGlassPastelPages.css');
const auth = read('client/components/users/appleGlassPastelAuth.css');
const styles = read('client/styles.js');
const docs = read('docs/Theme/Theme.md');
const designDocs = read('docs/Design/Page/Theme.md');
const boardFeature = read('client/features/boards.js');
const mainFeature = read('client/features/main.js');
const userFeature = read('client/features/users.js');
const settingsFeature = read('client/features/settings.js');
const preview = read('tests/fixtures/appleGlassPastelThemePreview.html');
const all = `${base}\n${pages}\n${auth}`;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('appleGlassPastelV2:');

test('the override files are loaded last in responsibility order', () => {
  const baseAt = styles.indexOf("/client/components/main/appleGlassPastel.css");
  const pagesAt = styles.indexOf("/client/components/boards/appleGlassPastelPages.css");
  const authAt = styles.indexOf("/client/components/users/appleGlassPastelAuth.css");
  const legacyAt = styles.indexOf("/client/components/users/userForm.css");
  assert.ok(legacyAt !== -1 && baseAt > legacyAt, 'base override follows legacy CSS');
  assert.ok(pagesAt > baseAt, 'page/board rules follow shared tokens');
  assert.ok(authAt > pagesAt, 'auth rules are the final scoped adaptation');

  for (const [name, feature, legacy, override] of [
    ['boards', boardFeature, 'boardColors.css', 'appleGlassPastelPages.css'],
    ['main', mainFeature, 'header.css', 'appleGlassPastel.css'],
    ['users', userFeature, 'userForm.css', 'appleGlassPastelAuth.css'],
    ['settings', settingsFeature, 'settingBody.css', 'appleGlassPastelPages.css'],
  ]) {
    assert.ok(feature.indexOf(override) > feature.indexOf(legacy),
      `${name} lazy bundle loads ${override} after ${legacy}`);
  }
});

test('the Motions palette and mesh are encoded as reusable tokens', () => {
  for (const token of [
    '--agp-primary: #2563eb',
    '--agp-primary-dark: #1e3a8a',
    '--agp-foreground: #111827',
    '--agp-heading: #0f172a',
    '--agp-muted: #6b7280',
    '--agp-glass: rgba(255, 255, 255, 0.65)',
    '--agp-radius-island: 24px',
    'rgba(255, 200, 220, 0.55)',
    'rgba(180, 215, 255, 0.55)',
    'linear-gradient(180deg, #f6f7fb 0%, #eef0f7 100%)',
  ]) {
    assert.ok(base.includes(token), `${token} is present`);
  }
});

test('solid blue is reserved for active and primary controls', () => {
  assert.ok(base.includes('background: var(--agp-glass) !important'),
    'header defaults to neutral glass');
  assert.ok(base.includes('#header .board-header-btn.active'),
    'active header control has an explicit state');
  assert.ok(base.includes('button.primary'), 'primary buttons are themed');
  assert.ok(base.includes('background: var(--agp-primary) !important'),
    'active/primary fill uses the shared blue');
});

test('all major WeKan surfaces are represented', () => {
  for (const selector of [
    '.boards-left-menu',
    '.board-list > li.js-board',
    '.boards-pagination',
    '.setting-content .content-body .side-menu',
    '.setting-content .content-body .main-body',
    '.table-page-table',
    '.board-wrapper .list',
    '.board-wrapper .minicard',
    '.board-wrapper .card-details',
    '.board-sidebar.sidebar',
  ]) {
    assert.ok(pages.includes(selector), `${selector} is covered`);
  }
  assert.ok(/\.setting-content \.content-body \{[\s\S]*?box-sizing: border-box;[\s\S]*?max-width: 100%;/.test(pages),
    'Admin mobile padding is included inside the viewport width');
  assert.ok(/\.content-body \.main-body \{[\s\S]*?box-sizing: border-box;[\s\S]*?min-width: 0;/.test(pages),
    'the Admin main glass island may shrink without spilling past the phone');
});

test('minicards avoid per-card backdrop filters', () => {
  const at = pages.indexOf('.board-color-appleglasspastel.board-wrapper .minicard {');
  assert.notStrictEqual(at, -1, 'minicard override exists');
  const end = pages.indexOf('}', at);
  const block = pages.slice(at, end);
  assert.ok(block.includes('backdrop-filter: none'), 'standard filter is disabled');
  assert.ok(block.includes('-webkit-backdrop-filter: none'), 'Safari filter is disabled');
});

test('auth uses a responsive split layout without importing external branding', () => {
  assert.ok(auth.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)'),
    'desktop login is split evenly');
  assert.ok(/:has\(\.at-form-landing-logo\) \{[\s\S]*?grid-column: 1;/.test(auth),
    'the logo panel owns the first logical grid column instead of relying on auto-placement');
  assert.ok(/:has\(\.auth-dialog\) \{[\s\S]*?grid-column: 2;/.test(auth),
    'the form panel owns the second logical grid column so RTL mirrors without overlap');
  assert.ok(/userform-layout \{[\s\S]*?direction: ltr;/.test(auth),
    'the physical split grid is isolated from the document writing direction');
  assert.ok(/html\[dir="rtl"\][\s\S]*?:has\(\.at-form-landing-logo\) \{[\s\S]*?grid-column: 2;/.test(auth)
    && /html\[dir="rtl"\][\s\S]*?:has\(\.auth-dialog\) \{[\s\S]*?grid-column: 1;/.test(auth),
  'RTL explicitly swaps the panels while their content remains RTL');
  assert.ok(auth.includes(':has(.at-form-landing-logo)'), 'configured logo panel is reused');
  assert.ok(auth.includes(':has(.auth-dialog)'), 'existing auth dialog is reused');
  assert.ok(auth.includes('.at-form-landing-logo:empty'),
    'the legacy empty logo heading is not rendered as a decorative block');
  assert.ok(auth.includes('@media screen and (max-width: 800px)'),
    'mobile collapses to one column');
  const mobile = auth.slice(auth.indexOf('@media screen and (max-width: 800px)'));
  assert.ok(/:has\(\.at-form-landing-logo\) \{[\s\S]*?box-sizing: border-box;[\s\S]*?width: 100%;[\s\S]*?max-width: 100%;/.test(mobile),
    'the padded mobile logo panel stays inside the viewport in both directions');
  assert.ok(!/(motions|pebsteel|https?:\/\/)/i.test(auth),
    'no reference brand or external asset is copied');
});

test('accessibility, motion and glass fallbacks are explicit', () => {
  assert.ok(base.includes(':focus-visible'), 'keyboard focus is visible');
  assert.ok(base.includes('@media (prefers-reduced-motion: reduce)'),
    'reduced motion is respected');
  assert.ok(base.includes('@supports not ((backdrop-filter: blur(1px))'),
    'base glass has a no-blur fallback');
  assert.ok(pages.includes('@supports not ((backdrop-filter: blur(1px))'),
    'structural panels have a no-blur fallback');
  assert.ok(auth.includes('@supports not ((backdrop-filter: blur(1px))'),
    'auth glass has a no-blur fallback');
});

test('every top-level selector is theme-scoped or an allowed at-rule', () => {
  for (const [name, source] of [['base', base], ['pages', pages], ['auth', auth]]) {
    const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
    let start = 0;
    for (let i = 0; i < withoutComments.length; i += 1) {
      const char = withoutComments[i];
      if (char === '}') {
        start = i + 1;
        continue;
      }
      if (char !== '{') continue;
      const prelude = withoutComments.slice(start, i).trim();
      start = i + 1;
      if (!prelude || prelude.startsWith('@')) continue;
      for (const selector of prelude.split(',')) {
        const clean = selector.trim();
        assert.ok(clean.includes('board-color-appleglasspastel'),
          `${name}: unscoped selector ${clean}`);
      }
    }
  }
});

test('the static preview loads the complete v2 cascade', () => {
  for (const file of [
    'appleGlassPastel.css',
    'appleGlassPastelPages.css',
    'appleGlassPastelAuth.css',
  ]) {
    assert.ok(preview.includes(file), `${file} is loaded by the preview`);
  }
});

test('theme documentation records the v2 responsibilities and performance boundary', () => {
  for (const token of [
    'Apple Glass Pastel v2',
    'client/components/main/appleGlassPastel.css',
    'client/components/boards/appleGlassPastelPages.css',
    'client/components/users/appleGlassPastelAuth.css',
    'no per-card backdrop filter',
    'tests/playwright/specs/45-apple-glass-theme.e2e.js',
  ]) {
    assert.ok(docs.includes(token), `Theme.md includes ${token}`);
  }
  assert.ok(designDocs.includes('client/components/main/appleGlassPastel.css'),
    'page design lists the shared theme layer');
});

console.log(`\n${passed} tests passed`);

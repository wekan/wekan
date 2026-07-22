'use strict';

// Regression guard for #5149 ("Copy code block to clipboard"). The feature adds a
// copy button to each code block in the read-only card viewer. It previously ran
// once in Template.editor.onRendered with a global `document.querySelectorAll`,
// so it decorated only whichever viewers were on the page at that instant ("works
// sporadically"), lost the button after editing, and copied the HTML-escaped
// innerHTML of childNodes[0] (wrong/undefined content). It now decorates in
// Template.viewer.onRendered — per viewer, on every re-render, de-duplicated,
// copying the raw text. This is a source guard (the code is Blaze/DOM-coupled).
// Run: node tests/copyCodeBlock.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'main', 'editor.js'),
  'utf8',
);

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

check('#5149: the copy-code decoration runs in Template.viewer.onRendered (per viewer)', () => {
  assert.ok(/Template\.viewer\.onRendered\(/.test(src),
    'must decorate in Template.viewer.onRendered, not a one-time global query');
  const start = src.indexOf('Template.viewer.onRendered(');
  const body = src.slice(start, start + 900);
  assert.ok(/this\.\$\('pre'\)/.test(body),
    "must scope to the viewer's own <pre> blocks (this.$('pre'))");
});

check('#5149: it copies the RAW text (pre.textContent), not innerHTML', () => {
  assert.ok(/copyCodeBlockText\(pre\.textContent\)/.test(src),
    'must copy pre.textContent');
  assert.ok(!/textArea\.value = target\.innerHTML/.test(src),
    'the old innerHTML-of-childNodes[0] copy must be gone');
  assert.ok(!/querySelectorAll\("\.viewer > pre"\)/.test(src),
    'the old global one-time query must be gone');
});

check('#5149: buttons are de-duplicated (no stacking on re-render)', () => {
  const start = src.indexOf('Template.viewer.onRendered(');
  const body = src.slice(start, start + 900);
  assert.ok(/js-copy-code/.test(body), 'the button carries a js-copy-code marker class');
  assert.ok(/previousElementSibling[\s\S]*js-copy-code[\s\S]*return/.test(body),
    'must skip a <pre> that already has its copy button');
});

check('#5149: the button title is translated (not a hard-coded English string)', () => {
  const start = src.indexOf('Template.viewer.onRendered(');
  const body = src.slice(start, start + 900);
  assert.ok(/TAPi18n\.__\('copy-text-to-clipboard'\)/.test(body),
    "must use the i18n key 'copy-text-to-clipboard'");
  const en = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'imports', 'i18n', 'data', 'en.i18n.json'), 'utf8'));
  assert.ok(en['copy-text-to-clipboard'], 'the i18n key must exist in en.i18n.json');
});

check('#5149: uses the async Clipboard API with an execCommand fallback', () => {
  assert.ok(/navigator\.clipboard && navigator\.clipboard\.writeText/.test(src),
    'must prefer navigator.clipboard.writeText');
  assert.ok(/fallbackCopyText/.test(src), 'must have an execCommand fallback');
});

console.log(`\ncopyCodeBlock: ${passed} checks passed`);

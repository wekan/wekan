'use strict';
// Admin Panel / Settings / Layout / Custom head meta tags (#4042): saved and
// published, but never written into the page. They are now, as <meta>
// elements only (models/lib/customHeadMetaTags.js).
//
// Run: node tests/customHeadMetaTags.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { safeMetaTags } = require('../models/lib/customHeadMetaTags');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('customHeadMetaTags:');

test('description, Open Graph, Twitter and theme tags are written as they were typed', () => {
  const text = `<meta name="description" content="Team boards">
<meta property="og:title" content="WeKan at ACME">
<meta property="og:image" content="https://acme.example/logo.png" />
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#2a80b9">`;
  assert.deepEqual(safeMetaTags(text), text.split('\n'));
});

test('negative: scripts, styles, titles and text around the tags are dropped', () => {
  const text = `<script>alert(1)</script><meta name="a" content="1"><style>body{}</style>
<title>x</title> plain text <img src=x onerror=alert(1)><meta name="b" content="2">`;
  assert.deepEqual(safeMetaTags(text), ['<meta name="a" content="1">', '<meta name="b" content="2">']);
});

test('negative: http-equiv refresh and set-cookie, which act on every visitor, are dropped', () => {
  const text = `<meta http-equiv="refresh" content="0;url=https://evil.example">
<meta http-equiv=Refresh content="5">
<meta http-equiv='set-cookie' content="a=b">
<meta http-equiv="content-language" content="fi">`;
  assert.deepEqual(safeMetaTags(text), ['<meta http-equiv="content-language" content="fi">']);
});

test('nothing, or not text, gives nothing; the count is bounded', () => {
  for (const value of [undefined, null, '', '   ', 42, {}]) assert.deepEqual(safeMetaTags(value), []);
  assert.equal(safeMetaTags('<meta name="x">'.repeat(500)).length, 100);
});

test('the boilerplate writes them, only when custom head tags are enabled', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'lib', 'customHeadRender.js'), 'utf8');
  const enabled = src.indexOf('if (!setting || !setting.customHeadEnabled)');
  const meta = src.indexOf('for (const tag of safeMetaTags(setting.customHeadMetaTags))');
  assert.ok(enabled !== -1 && meta > enabled);
  assert.ok(!/setting\.customHeadMetaTags(?!\))/.test(src.replace('safeMetaTags(setting.customHeadMetaTags)', '')),
    'the raw text is never written');
});

console.log(`\ncustomHeadMetaTags: ${passed} tests passed`);

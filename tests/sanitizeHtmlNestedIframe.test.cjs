'use strict';

// sanitize-html 2.18.0 re-sanitized the fallback of a discarded <iframe>
// recursively with no limit (GHSA-c9rx-x947-fp3h, CWE-674): a few kilobytes of
// nested unclosed <iframe> threw RangeError: Maximum call stack size exceeded.
// WeKan's server sanitizer discards every tag (allowedTags: []), so it took
// that path. It runs in secureTransfer, on every import and every export, and
// secureTransfer records a throw as a high "blocked" event naming the user -
// which disables that account. A card planted with the payload locked out the
// next member who exported the board. 2.18.1 bounds the recursion.
// Run: node tests/sanitizeHtmlNestedIframe.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const sanitizeHtml = require('sanitize-html');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const newer = (version, than) => {
  const a = version.split('.').map(Number); const b = than.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

// The options WeKan's own sanitizeInput passes, read from its source.
const source = read('server/lib/inputSanitizer.js');
const optionsText = source.match(/sanitizeHtml\(input, (\{[\s\S]*?\})\);/);
assert.ok(optionsText, 'server/lib/inputSanitizer.js calls sanitizeHtml(input, {...})');
const WEKAN_OPTIONS = vm.runInNewContext(`(${optionsText[1]})`);

const PAYLOADS = {
  'nested unclosed iframes': '<iframe>'.repeat(20000),
  'nested iframes with fallback text': '<iframe>x'.repeat(20000),
  'nested closed iframes': '<iframe>'.repeat(5000) + '</iframe>'.repeat(5000),
};

test('the installed and locked sanitize-html is 2.18.1 or newer', () => {
  const installed = require('sanitize-html/package.json').version;
  assert.ok(newer(installed, '2.18.1'), `installed sanitize-html ${installed}`);
  const lock = JSON.parse(read('package-lock.json'));
  const locked = lock.packages['node_modules/sanitize-html'].version;
  assert.ok(newer(locked, '2.18.1'), `package-lock.json pins sanitize-html ${locked}`);
  const wanted = JSON.parse(read('package.json')).dependencies['sanitize-html'];
  assert.ok(!/^=?2\.18\.0$/.test(wanted), `package.json must not pin 2.18.0: ${wanted}`);
});

test("WeKan's sanitizeInput options survive nested iframes, and keep no tag", () => {
  for (const [name, payload] of Object.entries(PAYLOADS)) {
    const out = sanitizeHtml(payload, WEKAN_OPTIONS);
    assert.ok(!/<iframe/i.test(out), `${name}: no iframe survives`);
  }
});

test("sanitize-html's defaults survive them too, and nestingLimit holds across the fallback", () => {
  for (const [name, payload] of Object.entries(PAYLOADS)) sanitizeHtml(payload);
  const limited = sanitizeHtml('<div>'.repeat(50) + 'x', { allowedTags: ['div'], nestingLimit: 6 });
  assert.ok((limited.match(/<div>/g) || []).length <= 6, 'nestingLimit applies to the whole output');
});

test('negative: sanitize-html is imported only by the sanitizer tested here', () => {
  // Another importer would be a second place this must be tested.
  const importers = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.npm', '_build', '.build', '.tools', 'tests'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (/\.(c?m?js)$/.test(e.name) &&
        /(?:from\s+|require\()\s*['"]sanitize-html['"]/.test(read(rel))) importers.push(rel);
    }
  };
  ['client', 'server', 'models', 'imports', 'packages', 'config'].forEach(walk);
  assert.deepStrictEqual(importers, ['server/lib/inputSanitizer.js']);
});

console.log(`\n${passed} passed`);

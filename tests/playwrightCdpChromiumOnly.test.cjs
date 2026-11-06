'use strict';

// Guard: a Playwright test that opens a DevTools (CDP) session skips outside
// Chromium.
// Run: node tests/playwrightCdpChromiumOnly.test.cjs
//
// browserContext.newCDPSession exists only in Chromium. In the full Firefox
// run two tests failed on it before they had tested anything - "CDP session is
// only available in Chromium": keyboard-nonlatin-once, which had no skip, and
// card-window-touch-drag's mouse test, which called the helper that sets up
// touch emulation although it needs none. Each test that opens a session -
// itself, or through a helper of its file that does - says
// `test.skip(browserName !== 'chromium', ...)`, or its file skips the whole
// describe; a helper call that asks for no touch (`touch: false`) opens none.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const specsDir = path.join(__dirname, 'playwright', 'specs');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const SKIP = /test\.skip\(\s*(?:\(\{\s*browserName\s*\}\)\s*=>\s*)?browserName\s*!==\s*'chromium'/;

// The test blocks of a file that open a CDP session without a Chromium skip.
function unguarded(text) {
  // Helpers of this file that open a session.
  const helpers = [...text.matchAll(/(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g)]
    .filter(m => {
      const body = text.slice(m.index, text.indexOf('\n}', m.index) + 2);
      return /newCDPSession/.test(body);
    })
    .map(m => m[1]);
  const fileSkip = /test\.describe[\s\S]*?test\.skip\(\s*\(\{\s*browserName\s*\}\)\s*=>\s*browserName\s*!==\s*'chromium'/.test(text);
  const starts = [...text.matchAll(/\n\s*test\(\s*[`'"]/g)].map(m => m.index);
  const found = [];
  starts.forEach((start, i) => {
    const block = text.slice(start, starts[i + 1] === undefined ? text.length : starts[i + 1]);
    const opens = /newCDPSession/.test(block) || helpers.some(name => {
      const calls = [...block.matchAll(new RegExp(`\\b${name}\\(([^;]*)\\)`, 'g'))];
      return calls.some(c => !/touch:\s*false/.test(c[1]));
    });
    if (opens && !SKIP.test(block) && !fileSkip) {
      found.push(block.match(/test\(\s*[`'"]([^`'"]+)/)[1]);
    }
  });
  return found;
}

const specs = fs.readdirSync(specsDir).filter(f => f.endsWith('.e2e.js'))
  .map(f => ({ f, text: fs.readFileSync(path.join(specsDir, f), 'utf8') }))
  .filter(({ text }) => /newCDPSession/.test(text));

test('the scan finds the specs that open a CDP session', () => {
  const names = specs.map(s => s.f);
  for (const f of ['keyboard-nonlatin-once.e2e.js', 'card-window-touch-drag.e2e.js', 'due-date-keyboard-shortcut.e2e.js']) {
    assert.ok(names.includes(f), `${f} in ${names.join(', ')}`);
  }
});

test('every test that opens a CDP session skips outside Chromium', () => {
  const missing = specs.flatMap(({ f, text }) => unguarded(text).map(name => `${f}: ${name}`));
  assert.deepStrictEqual(missing, [],
    'these tests open a CDP session in every browser, and fail in Firefox and WebKit before testing anything');
});

test('negative: the check finds both shapes that failed in Firefox', () => {
  const direct = `
test('keys', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
});`;
  assert.deepStrictEqual(unguarded(direct), ['keys']);
  const viaHelper = `
async function openWindow(page, { touch = true }) {
  const cdp = await page.context().newCDPSession(page);
}
test('mouse', async ({ page }) => {
  await openWindow(page, { handles: false });
});
test('mouse without touch', async ({ page }) => {
  await openWindow(page, { handles: false, touch: false });
});
test('finger', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'touch');
  await openWindow(page, {});
});`;
  assert.deepStrictEqual(unguarded(viaHelper), ['mouse']);
});

console.log(`\n${passed} passed`);

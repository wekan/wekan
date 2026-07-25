'use strict';

// Element size and spacing must not be measured in viewport units.
//
// Reported on /sign-in and /sign-up: making the browser window taller made every
// element taller and every gap wider; making it shorter shrank them. That is what
// `vh` does — `padding: 3vh 3vw`, `margin-top: 6vh`, `min-height: 4.5vh` — the box
// is a percentage of the WINDOW, so the page reflows continuously as you resize,
// and the same layout looks different on every screen.
//
// 355 such values across 24 stylesheets were converted to the pixel sizes they
// rendered at on the window they were tuned for. This keeps them from coming back.
//
// Viewport units are still right for three things, and those are allowed:
//   - a full-viewport box: 100vh / 100vw
//   - a CAP that stops content overflowing a small screen: min(), max(), clamp()
//   - max-/min-height and max-/min-width limits
//
// Run: node tests/noViewportSpacing.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const root = path.join(__dirname, '..');

function cssFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) cssFiles(full, out);
    else if (full.endsWith('.css')) out.push(full);
  }
  return out;
}

// A declaration line may use viewport units only in these shapes.
function allowed(line) {
  return /\b100vh\b|\b100vw\b/.test(line)
    || /\b(min|max|clamp)\(/.test(line)
    || /^\s*(max|min)-(height|width)\s*:/.test(line);
}

console.log('noViewportSpacing:');

test('no size or spacing is measured in vh/vw', () => {
  const offenders = [];
  for (const file of cssFiles(path.join(root, 'client'))) {
    // Blank out block comments first, keeping line numbers: a comment ABOUT vh
    // (minicard.css has two describing this very bug) is not a use of it.
    const src = fs.readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '));
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (!/[0-9.]+v[hw]\b/.test(line)) return;
      if (allowed(line)) return;
      offenders.push(`${path.relative(root, file)}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepStrictEqual(offenders, [],
    'these resize with the browser window instead of staying put:\n  ' +
    offenders.join('\n  '));
});

test('the pages that were reported are free of it', () => {
  // /sign-in and /sign-up: the auth form itself, and the shared form controls its
  // inputs and buttons come from.
  for (const rel of ['client/components/users/userForm.css',
    'client/components/forms/forms.css']) {
    const lines = fs.readFileSync(path.join(root, rel), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!/[0-9.]+v[hw]\b/.test(line) || allowed(line)) return;
      assert.fail(`${rel}:${i + 1} still resizes with the window: ${line.trim()}`);
    });
  }
});

test('legitimate viewport use is still permitted (negative)', () => {
  // The rule must not be so blunt that a full-height container or a responsive
  // cap has to be written some other way.
  assert.ok(allowed('  height: 100vh;'));
  assert.ok(allowed('  width: min(250px, 32vw);'));
  assert.ok(allowed('  font-size: clamp(16px, 3.5vw, 22px);'));
  assert.ok(allowed('  max-height: 40vh;'));
  // And it must still catch the shapes that caused the report.
  assert.ok(!allowed('  padding: 3vh 3vw;'));
  assert.ok(!allowed('  margin-top: 6vh;'));
  assert.ok(!allowed('  border-radius: 0.4vw;'));
});

console.log(`\nnoViewportSpacing: ${passed} tests passed`);

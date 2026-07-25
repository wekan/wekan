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
// Viewport units are still right for two things, and those are allowed:
//   - a full-viewport box: 100vh / 100vw
//   - a max-height / max-width CAP that stops content overflowing a small screen
//
// clamp() USED to be allowed here, and it let the same bug straight back in. Reported
// later, on a board in mobile mode: widening the window made the swimlanes, lists and
// cards taller. The cause was 75 values like `font-size: clamp(18px, 2.5vw, 32px)` -
// a font that grows with the WINDOW, so every row grows with it. A clamp is only a
// cap at its two ends; between them it resizes exactly like a bare `vw`. All 75 were
// converted to the size they already used on a phone, so they are now one size
// everywhere.
//
// min-height / min-width are no longer blanket-allowed either: `min-height: 3vh` on a
// minicard is a height that tracks the window just as much as `height: 3vh` does.
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
  // A full-viewport box.
  if (/\b100vh\b|\b100vw\b/.test(line)) return true;
  // A cap that keeps content inside a small window - a popup that must not grow
  // taller than the screen.
  if (/^\s*max-(height|width)\s*:/.test(line)) return true;
  // `min(400px, 52vw)` is a SHRINK-ONLY cap: above the crossover width it is flat at
  // 400px, and only below it does it give way so the box fits a narrow screen. It
  // never grows with the window, so it is not this bug. `clamp(a, Xvw, b)` is a
  // different animal - between its two ends it tracks the window exactly like a bare
  // vw - and `max(...)` grows without bound, so neither is allowed.
  if (/\bmin\(\s*(?:[0-9.]+(?:px|rem|em)\s*,\s*[0-9.]+v[hw]|[0-9.]+v[hw]\s*,\s*[0-9.]+(?:px|rem|em))\s*\)/.test(line)
    && !/\b(clamp|max)\(/.test(line)) return true;
  return false;
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

// Everywhere a viewport unit can hide that is NOT a client/**/*.css line: an inline
// `style=` in a template, and CSS written as a JS string (the HTML export builds a
// modal that way, and the Sandstorm migration bridge builds a whole page). Those
// render in a browser exactly like a stylesheet does, and the scan above never saw
// them.
function declarations(text) {
  return text.split(';').map(d => d.trim()).filter(d => /[0-9.]+v[hw]\b/.test(d));
}

function sourceFiles(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules') continue;
    if (entry.isDirectory()) sourceFiles(full, ext, out);
    else if (ext.some(e => full.endsWith(e))) out.push(full);
  }
  return out;
}

test('no viewport sizing hides in an inline style= in a template', () => {
  const offenders = [];
  for (const file of sourceFiles(path.join(root, 'client'), ['.jade'])
    .concat(sourceFiles(path.join(root, 'packages'), ['.jade']))) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/style="([^"]*)"/g)) {
      for (const decl of declarations(m[1])) {
        if (allowed(decl)) continue;
        offenders.push(`${path.relative(root, file)}  ${decl}`);
      }
    }
  }
  assert.deepStrictEqual(offenders, [],
    'inline styles resize with the window too:\n  ' + offenders.join('\n  '));
});

test('no viewport sizing hides in CSS built as a JS string', () => {
  const offenders = [];
  const dirs = ['client', 'server', 'models', 'imports', 'packages', 'sandstorm-src'];
  for (const dir of dirs) {
    for (const file of sourceFiles(path.join(root, dir), ['.js'])) {
      const src = fs.readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*(\/\/|\*).*$/gm, '');
      for (const decl of declarations(src)) {
        if (allowed(decl)) continue;
        // Only report something that actually looks like a CSS declaration, so a
        // stray "100vh" in prose is not a finding.
        if (!/^[a-z-]+\s*:\s*[^:]*[0-9.]+v[hw]/.test(decl)) continue;
        offenders.push(`${path.relative(root, file)}  ${decl.slice(0, 80)}`);
      }
    }
  }
  assert.deepStrictEqual(offenders, [],
    'CSS built in JS resizes with the window too:\n  ' + offenders.join('\n  '));
});

test('stylesheets outside client/ are covered as well', () => {
  // Our own packages and public/css ship real stylesheets. Vendored ones
  // (fullcalendar, the jade loader fixtures, FerretDB, .build output) are not ours.
  const offenders = [];
  const ours = sourceFiles(path.join(root, 'packages'), ['.css'])
    .filter(f => !f.includes('fullcalendar'))
    .concat(sourceFiles(path.join(root, 'public/css'), ['.css']));
  for (const file of ours) {
    const src = fs.readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '));
    src.split('\n').forEach((line, i) => {
      if (!/[0-9.]+v[hw]\b/.test(line) || allowed(line)) return;
      offenders.push(`${path.relative(root, file)}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepStrictEqual(offenders, [], offenders.join('\n  '));
});

test('the wider scans actually see something (not vacuously green)', () => {
  // A scan that silently reads nothing passes forever. These two shapes exist in the
  // tree today and are ALLOWED, so finding them proves the extraction works while the
  // suite stays green.
  const exportHtml = fs.readFileSync(
    path.join(root, 'client/lib/exportHTML.js'), 'utf8');
  const found = declarations(exportHtml);
  assert.ok(found.some(d => /max-height:\s*80vh/.test(d)),
    'the JS scan must see the exported card modal\'s max-height cap');
  assert.ok(found.every(d => allowed(d)), 'and that cap is allowed');
  // The splitter itself must pull a bad declaration out of a run-together style
  // string, which is how they appear in a cssText or a style= attribute.
  const bad = declarations('display:none;padding:3vh 3vw;color:red');
  assert.deepStrictEqual(bad, ['padding:3vh 3vw']);
  assert.ok(!allowed(bad[0]), 'and it must be reported');
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
  assert.ok(allowed('  max-height: 40vh;'));
  // A shrink-only cap, in either argument order: flat at the px above the crossover
  // width, giving way only below it so the box fits a narrow screen.
  assert.ok(allowed('  width: min(250px, 32vw);'));
  assert.ok(allowed('  width: min(90vw, 1100px);'));
  // And it must still catch the shapes that caused the reports.
  assert.ok(!allowed('  padding: 3vh 3vw;'));
  assert.ok(!allowed('  margin-top: 6vh;'));
  assert.ok(!allowed('  border-radius: 0.4vw;'));
  // clamp() is NOT a cap between its ends - it tracks the window there, which is what
  // made a board's rows grow taller as the window got wider.
  assert.ok(!allowed('  font-size: clamp(16px, 3.5vw, 22px);'));
  // max() grows without bound, so it is the wrong way round.
  assert.ok(!allowed('  width: max(250px, 32vw);'));
  // A viewport MINIMUM is still a size that tracks the window.
  assert.ok(!allowed('  min-height: 60vh;'));
  assert.ok(!allowed('  min-width: 30vw;'));
});

test('Sign In / Register keep scrollable room below the form', () => {
  // body is display:flex, so a <br> at the end of the layout becomes a flex item,
  // gets blockified and collapses to ZERO height - two of them used to sit there
  // adding nothing. It has to be a real element with a height.
  const jade = fs.readFileSync(path.join(root, 'client/components/main/layouts.jade'), 'utf8');
  const layout = jade.slice(jade.indexOf('template(name="userFormsLayout")'),
    jade.indexOf('template(name="defaultLayout")'));
  assert.ok(/\.auth-bottom-space/.test(layout), 'the spacer element must be there');
  // Only at the LAYOUT ROOT (4-space indent): a <br> nested inside an h1 - used
  // when the logo is hidden - is in normal flow and works fine.
  assert.ok(!/^ {4}br *$/m.test(layout),
    'a bare <br> at the layout root collapses to zero height in a flex body');
  const css = fs.readFileSync(path.join(root, 'client/components/users/userForm.css'), 'utf8');
  const rule = /\.auth-bottom-space \{([^}]*)\}/.exec(css);
  assert.ok(rule, 'and it must be given a height');
  assert.ok(/height:\s*\d+px/.test(rule[1]), 'a fixed height, so it does not resize with the window');
  assert.ok(/flex:\s*0 0 auto/.test(rule[1]), 'and it must not be flex-shrunk back to nothing');
});

console.log(`\nnoViewportSpacing: ${passed} tests passed`);

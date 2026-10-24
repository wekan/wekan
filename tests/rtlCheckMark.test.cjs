'use strict';

// #6786: in a right-to-left language every checked checkbox drew "<" instead
// of a check mark. The tick is two borders of a box rotated 40deg - bottom and
// the side - and the side was written as border-inline-end, which a
// right-to-left page puts on the LEFT, so the rotated corner opened the other
// way. A check mark is not mirrored in a right-to-left language, so its borders
// are physical (border-right).
//
// And so is where it sits - the issue's second report: with the borders fixed,
// the tick was still placed with inset-inline-start/margin-inline-end, which a
// right-to-left page also flips. The tick is a box narrowed to 7px from the
// square's start, so it started at the square's RIGHT edge and was pushed
// further right: "out of box". It is placed with left/margin-right now.
// Run: node tests/rtlCheckMark.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok - ${name}`);
}

function cssFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...cssFiles(p));
    else if (e.name.endsWith('.css')) out.push(p);
  }
  return out;
}

// Every rule whose selector is a checked state, with its file and line.
function checkedRules() {
  const rules = [];
  for (const file of cssFiles(path.join(ROOT, 'client'))) {
    const css = fs.readFileSync(file, 'utf8');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (!/is-checked|:checked/.test(selector)) continue;
      rules.push({
        where: `${path.relative(ROOT, file)}:${css.slice(0, m.index).split('\n').length}`,
        selector,
        body: m[2],
      });
    }
  }
  return rules;
}

test('the shared check mark is drawn with physical borders, rotated', () => {
  const forms = fs.readFileSync(path.join(ROOT, 'client/components/forms/forms.css'), 'utf8');
  const tick = /\.materialCheckBox\.is-checked \{([\s\S]*?)\n\}/.exec(forms)[1];
  assert.match(tick, /border-bottom: 2px solid #3cb500/);
  assert.match(tick, /border-right: 2px solid #3cb500/);
  assert.match(tick, /border-left: 2px solid transparent/);
  assert.match(tick, /transform: rotate\(40deg\)/);
  // Where it sits is physical too, and adds up to the square's 17px.
  assert.match(tick, /left: -3px/);
  assert.match(tick, /margin-right: 6px/);
  assert.doesNotMatch(tick, /inset-inline|margin-inline/);
});

test('the Admin Panel checkboxes (#6786\'s screenshot) are drawn the same way', () => {
  const setting = fs.readFileSync(path.join(ROOT, 'client/components/settings/settingBody.css'), 'utf8');
  const tick = /\.setting-content input\[type="checkbox"\]:checked \{([\s\S]*?)\n\}/.exec(setting)[1];
  assert.match(tick, /border-right: 2px solid #3cb500/);
  assert.match(tick, /transform: rotate\(40deg\)/);
});

test('negative, whole tree: no checked state draws its tick with a logical border', () => {
  const rules = checkedRules();
  assert(rules.length > 20, `found the check-mark rules (${rules.length})`);
  const logical = rules
    .filter(r => /border-inline-(start|end)/.test(r.body))
    .map(r => `${r.where} ${r.selector.replace(/\s+/g, ' ').slice(0, 80)}`);
  assert.deepStrictEqual(logical, []);
});

test('negative, whole tree: no rule that draws a tick places it with a logical offset or margin', () => {
  // A tick rule draws with border-right (the rotated side) or rotates; those may
  // not be placed with inset-inline-* or margin-inline-*, which flip
  // right-to-left. Checked states that are not ticks - the hidden native
  // checkbox, the toggle switch's knob, the board list's corner box with a
  // glyph - mirror correctly and are not tick rules.
  const offenders = checkedRules()
    .filter(r => /border-right\s*:[^;]*solid|transform:\s*rotate/.test(r.body))
    .filter(r => /inset-inline-(start|end)\s*:|margin-inline-(start|end)\s*:/.test(r.body))
    .map(r => `${r.where} ${r.selector.replace(/\s+/g, ' ').slice(0, 80)}`);
  assert.deepStrictEqual(offenders, []);
});

test('the import page keeps its label gap on the reading side, and the tick on its square', () => {
  const css = fs.readFileSync(path.join(ROOT, 'client/components/import/import.css'), 'utf8');
  const rtl = /\[dir="rtl"\] \.import-page \.import-source-list a\.flex \.materialCheckBox\.is-checked,[\s\S]*?\{([\s\S]*?)\}/.exec(css)[1];
  // 6px keeps the tick on the square's left edge (7 + 4 + 6 = 17), the other 11 are the gap.
  assert.match(rtl, /margin-right: 6px/);
  assert.match(rtl, /margin-left: 11px/);
});

console.log(`rtlCheckMark: ${passed} tests passed`);

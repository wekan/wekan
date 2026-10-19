'use strict';

// #6786: in a right-to-left language every checked checkbox drew "<" instead
// of a check mark. The tick is two borders of a box rotated 40deg - bottom and
// the side - and the side was written as border-inline-end, which a
// right-to-left page puts on the LEFT, so the rotated corner opened the other
// way. A check mark is not mirrored in a right-to-left language, so its borders
// are physical (border-right), while its position stays logical.
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
  // Where it sits still follows the reading direction.
  assert.match(tick, /inset-inline-start: -3px/);
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

console.log(`rtlCheckMark: ${passed} tests passed`);

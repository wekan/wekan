'use strict';

// #6820: Card Settings / Card's Draggable table showed a ticked checkbox as a
// small blue dot beside an unticked square. forms.css hides every native
// checkbox (WeKan draws .materialCheckBox instead) and gives every input the
// padding of a text field; a rule that brings a native checkbox back with
// `appearance: auto` but keeps that 9px 14px padding leaves the browser about
// 2px to draw a ticked box in.
//
// The test: the Draggable table's rule sets padding 0. The negative test walks
// every stylesheet under client/: each rule that brings back a native checkbox
// (appearance: auto or checkbox, on a checkbox selector) sets `padding: 0`.
// Run: node tests/nativeCheckboxPadding6820.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

const rulesOf = css => [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(m => ({ selector: m[1].trim(), body: m[2] }));
const restoresNative = r => /checkbox/.test(r.selector) && /appearance\s*:\s*(auto|checkbox)/.test(r.body);
const zeroPadding = r => /(^|[;\s])padding\s*:\s*0(px)?\s*(;|$)/.test(r.body);

test('the Draggable table draws a native checkbox without text-field padding', () => {
  const css = fs.readFileSync(path.join(root, 'client/components/main/boardDragSettings.css'), 'utf8');
  const native = rulesOf(css).filter(restoresNative);
  assert.ok(native.length >= 1, 'the Draggable table restores its native checkbox');
  for (const r of native) assert.ok(zeroPadding(r), `${r.selector}: padding 0`);
});

test('negative: no stylesheet brings back a native checkbox with text-field padding', () => {
  const skip = new Set(['node_modules', '_build', '.build', '.tools', '.git']);
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (skip.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.css') ? [p] : [];
  });
  const offenders = [];
  let seen = 0;
  for (const file of walk(path.join(root, 'client'))) {
    for (const r of rulesOf(fs.readFileSync(file, 'utf8')).filter(restoresNative)) {
      seen += 1;
      if (!zeroPadding(r)) offenders.push(`${path.relative(root, file)}: ${r.selector}`);
    }
  }
  assert.ok(seen >= 5, `found the native checkbox rules (${seen})`);
  assert.deepStrictEqual(offenders, [], 'these keep the 9px 14px padding of forms.css');
});

console.log(`\nnativeCheckboxPadding6820: ${passed} tests passed`);

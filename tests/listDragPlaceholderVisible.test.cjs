'use strict';

// #6763: dragging a list showed where it would land only as a thin shadow
// between two lists, while a card drag opens a clear gap.
//
// The placeholder jQuery UI inserts is a bare `<div class="list placeholder">`.
// It has no inline --list-width, so none of list.css's width rules (they match
// `.list[style*="--list-width"]`) apply to it, and it kept the flex default
// `flex-shrink: 1` with no content to hold it open. In a swimlane already wider
// than the window, flexbox shrank it to a few pixels.
//
// Pinned here: the placeholder never shrinks, every list sortable gives it the
// dragged list's width as min-width, and it is drawn as a visible drop area.
//
// Run: node tests/listDragPlaceholderVisible.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const css = read('client/components/lists/list.css');
const swimlanes = read('client/components/swimlanes/swimlanes.js');

const m = css.match(/\n\.list\.placeholder\s*\{([^}]*)\}/);
assert.ok(m, 'list.css has a `.list.placeholder` rule');
const rule = m[1];

// Positive: cannot be shrunk away, and is clearly visible.
assert.match(rule, /flex:\s*none\s*!important/, 'placeholder is flex: none !important');
assert.match(rule, /flex-shrink:\s*0\s*!important/, 'placeholder never shrinks');
assert.match(rule, /outline:\s*\dpx\s+dashed/, 'placeholder has a dashed outline');
assert.doesNotMatch(rule, /background-color:\s*rgba\(0,\s*0,\s*0,\s*0\.2\)/,
  'placeholder is no longer the faint grey that read as a shadow');

// Every list sortable sets the placeholder width AND a min-width from the helper.
const widthCalls = swimlanes.match(/ui\.placeholder\.width\(ui\.helper\.width\(\)\);/g) || [];
const minWidthCalls = swimlanes.match(/ui\.placeholder\.css\('min-width', ui\.helper\.width\(\)\);/g) || [];
assert.ok(widthCalls.length >= 3, 'all three list sortables size the placeholder');
assert.strictEqual(minWidthCalls.length, widthCalls.length,
  'every list sortable that sizes the placeholder also pins its min-width');

// Negative: no list sortable anywhere in client/ uses the `list placeholder`
// class without also pinning the min-width in the same start().
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}
for (const file of walk(path.join(ROOT, 'client'))) {
  const src = fs.readFileSync(file, 'utf8');
  const re = /placeholder:\s*'list placeholder'/g;
  let hit;
  while ((hit = re.exec(src))) {
    const window = src.slice(hit.index, hit.index + 1200);
    assert.match(window, /ui\.placeholder\.css\('min-width'/,
      `${path.relative(ROOT, file)}: list sortable must pin the placeholder min-width (#6763)`);
  }
}

console.log('listDragPlaceholderVisible: ok');

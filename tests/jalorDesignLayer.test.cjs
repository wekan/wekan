'use strict';

// The Jalor design layer: the rules that make the fork maintainable.
//
// Jalor restyles WeKan through WeKan's OWN selectors instead of rewriting its
// templates, so that a WeKan release can still be merged. That only holds while
// a handful of invariants do, and every one of them is easy to break by
// accident with a stylesheet that looks perfectly reasonable on its own:
//
//   - the DSFR loads BEFORE WeKan's stylesheets and the Jalor layer AFTER them
//     (a reset in the wrong place overwrites the app wholesale);
//   - jalor-tokens.css is the ONLY file that names a DSFR token, so a DSFR
//     release that renames one is a single edit;
//   - a new Jalor stylesheet is actually imported;
//   - `!important` stays exceptional, and each use is answering one upstream;
//   - text sizes go through WeKan's own font-size setting.
//
// Run: node tests/jalorDesignLayer.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorDesignLayer:');

const styles = read('client/styles.js');
const layerDir = path.join(root, 'client/jalor');
const layerFiles = fs.readdirSync(layerDir).filter(f => f.endsWith('.css')).sort();

test('the DSFR loads first, WeKan next, the Jalor layer last', () => {
  const dsfr = styles.indexOf("/client/jalor/vendor/dsfr.min.css");
  const wekan = styles.indexOf("/client/components/");
  const jalor = styles.indexOf("/client/jalor/jalor-tokens.css");
  assert.ok(dsfr > -1, 'the vendored DSFR is imported');
  assert.ok(wekan > -1, "WeKan's own stylesheets are imported");
  assert.ok(jalor > -1, 'the Jalor layer is imported');
  assert.ok(dsfr < wekan,
    "the DSFR's element reset must land before WeKan's CSS, or it overwrites it");
  // Every Jalor sheet, not just the first: one of them slipping above the
  // WeKan block would be silently overridden by it.
  for (const f of layerFiles) {
    const at = styles.indexOf(`/client/jalor/${f}`);
    assert.ok(at > wekan, `${f} must be imported after WeKan's stylesheets`);
  }
});

test('every Jalor stylesheet is imported, and every import exists', () => {
  for (const f of layerFiles) {
    assert.ok(styles.includes(`import '/client/jalor/${f}';`),
      `client/styles.js does not import ${f}`);
  }
  const imported = [...styles.matchAll(/import '\/client\/jalor\/(jalor-[a-z-]+\.css)';/g)]
    .map(m => m[1]);
  for (const f of imported) {
    assert.ok(fs.existsSync(path.join(layerDir, f)), `${f} is imported but missing`);
  }
  assert.deepStrictEqual([...imported].sort(), layerFiles,
    'the imports and the directory must list the same files');
});

test('only jalor-tokens.css names a DSFR token', () => {
  // Everything else reads --jalor-*. That indirection is what makes a DSFR
  // rename one edit instead of a search across the layer.
  const offenders = [];
  for (const f of layerFiles) {
    if (f === 'jalor-tokens.css') continue;
    const css = read(`client/jalor/${f}`).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)/g)) {
      const name = m[1];
      if (name.startsWith('--jalor-')) continue;
      // WeKan's own variables are fair game: they are what the layer hooks on to.
      if (name.startsWith('--wekan-') || name.startsWith('--theme-')) continue;
      offenders.push(`${f}: ${name}`);
    }
  }
  assert.deepStrictEqual(offenders, [],
    'these read a DSFR token directly instead of a --jalor-* name:\n  '
    + offenders.join('\n  '));
});

test('every --jalor-* name used is defined, and every one defined is used', () => {
  const tokens = read('client/jalor/jalor-tokens.css');
  const defined = new Set([...tokens.matchAll(/^\s{2}(--jalor-[a-z0-9-]+)\s*:/gm)].map(m => m[1]));
  assert.ok(defined.size > 30, `only ${defined.size} tokens defined`);

  const used = new Set();
  for (const f of layerFiles) {
    for (const m of read(`client/jalor/${f}`).matchAll(/var\((--jalor-[a-z0-9-]+)/g)) {
      used.add(m[1]);
    }
  }
  const undefinedNames = [...used].filter(n => !defined.has(n)).sort();
  assert.deepStrictEqual(undefinedNames, [], 'used but never defined');

  const unused = [...defined].filter(n => !used.has(n)).sort();
  assert.deepStrictEqual(unused, [], 'defined but never used - dead tokens');
});

test('every !important in the layer is one of the four sanctioned kinds', () => {
  // `!important` in an application layer is how a stylesheet stops being
  // readable: each one forces the next person to write another. Four contexts
  // earn it here, and the test names them rather than counting, so a fifth is
  // a failure with a message that says what it was.
  //
  //   .list-header               upstream sets this property with !important,
  //                              so there is no other way to change the colour
  //   @media print               the point is to override the whole chrome
  //   prefers-reduced-motion     the point is to override every animation
  //   .jalor-sr-only             the standard visually-hidden pattern
  const allowed = [/\.list-header/, /@media print/, /prefers-reduced-motion/, /\.jalor-sr-only/];
  const offenders = [];
  for (const f of layerFiles) {
    const css = read(`client/jalor/${f}`).replace(/\/\*[\s\S]*?\*\//g, '');
    // Track the enclosing block headers, so an occurrence can name its context.
    const stack = [];
    let head = '';
    for (let i = 0; i < css.length; i += 1) {
      const c = css[i];
      if (c === '{') { stack.push(head.trim().replace(/\s+/g, ' ')); head = ''; continue; }
      if (c === '}') { stack.pop(); head = ''; continue; }
      if (c === ';') {
        if (/!important/.test(head)) {
          const context = stack.join(' | ');
          if (!allowed.some(rx => rx.test(context))) {
            offenders.push(`${f}: ${context} { ${head.trim()} }`);
          }
        }
        head = '';
        continue;
      }
      head += c;
    }
  }
  assert.deepStrictEqual(offenders, [],
    'these use !important outside the four sanctioned contexts:\n  '
    + offenders.join('\n  '));

  // And the one that MUST have it still has to: check upstream still forces it.
  const upstream = read('client/components/lists/list.css');
  assert.ok(/\.list-header \{[\s\S]*?background-color:[^;]*!important/.test(upstream),
    'upstream still sets .list-header background-color with !important');
  assert.ok(/\.list-header \{[\s\S]*?background-color:[^;]*!important/.test(
    read('client/jalor/jalor-kanban.css')),
    'so the Jalor layer has to match it to change the colour');
});

test('text sizes follow Member Settings / Font / Size', () => {
  // WeKan writes every px text size as `calc(Npx * var(--wekan-ui-font-scale, 1))`
  // so the preset can move it. A bare px size in the Jalor layer would be the
  // one part of the UI that ignores the setting.
  const offenders = [];
  for (const f of layerFiles) {
    const css = read(`client/jalor/${f}`).replace(/\/\*[\s\S]*?\*\//g, '');
    css.split('\n').forEach((line, i) => {
      if (!/^\s*font-size\s*:/.test(line)) return;
      if (/var\(--jalor-font-size/.test(line)) return;
      if (/var\(--wekan-ui-font-scale/.test(line)) return;
      if (/font-size\s*:\s*(inherit|0)\s*;/.test(line)) return;
      offenders.push(`${f}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepStrictEqual(offenders, [],
    'these ignore the font-size setting:\n  ' + offenders.join('\n  '));
});

test('a control that already carries a DSFR class is left to the DSFR', () => {
  // jalor-controls.css restyles bare `button` / `input` / `select`. Without the
  // exclusions, a template that DOES use a real fr-btn would have it half
  // repainted by this file.
  const controls = read('client/jalor/jalor-controls.css');
  for (const guard of [':not(.fr-btn)', ':not(.fr-input)', ':not(.fr-select)']) {
    assert.ok(controls.includes(guard), `jalor-controls.css must exclude ${guard}`);
  }
  // negative: the generic button rule must not match a DSFR button.
  assert.ok(!/^button \{/m.test(controls),
    'a bare `button {` rule would catch every fr-btn too');
});

test('the Kanban layer changes nothing jQuery UI sortable measures', () => {
  // Drag and drop is WeKan's, and it measures boxes. Colour, border, radius and
  // padding are safe; display / float / position / width are not.
  const css = read('client/jalor/jalor-kanban.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const offenders = [];
  css.split('\n').forEach((line, i) => {
    if (/^\s*(display|float|position|width|height)\s*:/.test(line)) {
      offenders.push(`jalor-kanban.css:${i + 1}  ${line.trim()}`);
    }
  });
  assert.deepStrictEqual(offenders, [],
    'these move boxes the drag machinery has already measured:\n  '
    + offenders.join('\n  '));
});

console.log(`\njalorDesignLayer: ${passed} tests passed`);

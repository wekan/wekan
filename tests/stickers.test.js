/**
 * Test: card sticker icon set (models/metadata/stickers.js)
 *
 * Parses the real source file (it's an ES module, not require()-able here) and
 * checks the data is internally consistent so Trello-imported stickers can also
 * be added/removed from the in-app picker. Standalone runner like the sibling
 * tests; failures exit non-zero.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Locate the source via a process.cwd()/PWD walk-up, NOT the bare `__dirname` global:
// under `meteor test` referencing `__dirname` makes Meteor inject a `const __dirname`
// that collides with the CommonJS module wrapper's, crashing the server bundle at boot
// with "Identifier '__dirname' has already been declared".
const STICKERS_REL = path.join('models', 'metadata', 'stickers.js');
function findRepoRoot(marker) {
  const seeds = [process.cwd(), process.env.PWD, process.env.OLDPWD].filter(Boolean);
  for (const seed of seeds) {
    let dir = seed;
    for (let i = 0; i < 12; i += 1) {
      try { fs.accessSync(path.join(dir, marker)); return dir; } catch (e) { /* walk up */ }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return process.cwd();
}
const src = fs.readFileSync(path.join(findRepoRoot(STICKERS_REL), STICKERS_REL), 'utf8');

function parseArray(name) {
  const m = src.match(new RegExp(`${name} = \\[([\\s\\S]*?)\\]`));
  if (!m) return null;
  return [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
}

function parseMapValues(name) {
  const m = src.match(new RegExp(`${name} = \\{([\\s\\S]*?)\\}`));
  if (!m) return null;
  return [...m[1].matchAll(/:\s*'([^']+)'/g)].map(x => x[1]);
}

const STICKER_ICONS = parseArray('STICKER_ICONS');
const trelloValues = parseMapValues('TRELLO_STICKER_TO_FA');
const defaultMatch = src.match(/DEFAULT_STICKER_ICON = '([^']+)'/);
const DEFAULT_STICKER_ICON = defaultMatch && defaultMatch[1];

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('STICKER_ICONS is a non-empty list with no duplicates', () => {
  assert.ok(Array.isArray(STICKER_ICONS) && STICKER_ICONS.length > 0);
  const dups = STICKER_ICONS.filter((v, i) => STICKER_ICONS.indexOf(v) !== i);
  assert.deepStrictEqual(dups, [], `duplicate sticker icons: ${dups}`);
});

test('icon names are Font Awesome v4 style (no FA6 face-*/note-sticky names)', () => {
  // These FA6 names do not render with the bare `fa` class WeKan uses.
  const fa6 = STICKER_ICONS.filter(n => n.startsWith('face-') || n === 'note-sticky');
  assert.deepStrictEqual(fa6, [], `FA6-only names would not render: ${fa6}`);
});

test('every Trello sticker maps to an icon (and the default) in the picker set', () => {
  assert.ok(trelloValues && trelloValues.length > 0);
  const missing = trelloValues.filter(v => !STICKER_ICONS.includes(v));
  assert.deepStrictEqual(missing, [], `Trello sticker targets not in picker: ${missing}`);
  assert.ok(
    STICKER_ICONS.includes(DEFAULT_STICKER_ICON),
    `default sticker '${DEFAULT_STICKER_ICON}' not in picker set`,
  );
});

if (typeof describe === 'function') {
  describe('card sticker icon set', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('Sticker icon set tests\n');
  let failed = 0;
  tests.forEach(([name, fn]) => {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`✗ ${name}\n    ${e.message}`);
    }
  });
  console.log(`\n${tests.length - failed}/${tests.length} passed`);
  if (failed > 0) process.exitCode = 1;
}

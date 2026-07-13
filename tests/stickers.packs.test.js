/**
 * Test: Trello sticker mapping, highlights, picker generation and pack renaming.
 *
 * The real maps live in models/metadata/stickers.js (an ES module). As the
 * sibling stickers.test.js does, this parses those tables from source and then
 * runs faithful copies of the functions over them, so the test stays in sync
 * with the production data. No Trello API credentials are used. Failures throw.
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

// --- parse the real tables from source ------------------------------------
function parseExactMap(name) {
  const m = src.match(new RegExp(`${name} = \\{([\\s\\S]*?)\\}`));
  const map = {};
  if (m) {
    for (const e of m[1].matchAll(/(\w+):\s*'([^']+)'/g)) map[e[1]] = e[2];
  }
  return map;
}
function parseKeywordList(name) {
  const m = src.match(new RegExp(`${name} = \\[([\\s\\S]*?)\\];`));
  const out = [];
  if (m) {
    for (const e of m[1].matchAll(/\['([^']+)',\s*'([^']+)'\]/g)) out.push([e[1], e[2]]);
  }
  return out;
}
function parseArray(name) {
  const m = src.match(new RegExp(`${name} = \\[([\\s\\S]*?)\\];`));
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
}

const TRELLO_STICKER_TO_FA = parseExactMap('TRELLO_STICKER_TO_FA');
const STICKER_KEYWORD_TO_FA = parseKeywordList('STICKER_KEYWORD_TO_FA');
const STICKER_ICONS = parseArray('STICKER_ICONS');
const DEFAULT_STICKER_ICON = (src.match(/DEFAULT_STICKER_ICON = '([^']+)'/) || [])[1];

// --- faithful copies of the functions (driven by the parsed tables) -------
function trelloStickerToFa(name) {
  if (!name) return DEFAULT_STICKER_ICON;
  const n = String(name).toLowerCase();
  if (TRELLO_STICKER_TO_FA[n]) return TRELLO_STICKER_TO_FA[n];
  for (const [kw, icon] of STICKER_KEYWORD_TO_FA) {
    if (n.includes(kw)) return icon;
  }
  return DEFAULT_STICKER_ICON;
}
function trelloStickerHighlight(name) {
  if (!name) return undefined;
  const n = String(name).toLowerCase();
  if (n.includes('taco')) return 'underline';
  if (n.includes('pete')) return 'round';
  return undefined;
}
// Mirrors trelloCreator.stickerLabel() rename of the named packs.
function stickerLabel(name) {
  const raw = String(name || '').trim();
  if (!raw) return 'sticker';
  if (/^[0-9a-f]{16,}$/i.test(raw) || /^[A-Za-z0-9_-]{20,}$/.test(raw)) return 'custom sticker';
  return raw
    .replace(/[-_]+/g, ' ')
    .replace(/\btaco\b/gi, 'mascot')
    .replace(/\bpete\b/gi, 'computer')
    .trim();
}
// Mirrors STICKER_PICKER generation.
const ALL_MAP_ICONS = [
  ...new Set([
    ...Object.values(TRELLO_STICKER_TO_FA),
    ...STICKER_KEYWORD_TO_FA.map(([, icon]) => icon),
    DEFAULT_STICKER_ICON,
  ]),
];
const STICKER_PICKER = [
  ...STICKER_ICONS.map(icon => ({ icon })),
  ...ALL_MAP_ICONS.map(icon => ({ icon, highlight: 'underline', name: `mascot ${icon}` })),
  ...ALL_MAP_ICONS.map(icon => ({ icon, highlight: 'round', name: `computer ${icon}` })),
];

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('parsing found the real tables', () => {
  assert.ok(STICKER_ICONS.length > 0);
  assert.ok(STICKER_KEYWORD_TO_FA.length > 0);
  assert.ok(Object.keys(TRELLO_STICKER_TO_FA).length > 0);
  assert.ok(DEFAULT_STICKER_ICON);
});

test('distinct icons for previously-colliding named stickers', () => {
  assert.strictEqual(trelloStickerToFa('taco-active'), 'heartbeat');
  assert.strictEqual(trelloStickerToFa('taco-pixelated'), 'qrcode');
  assert.strictEqual(trelloStickerToFa('taco-prototype'), 'flask');
  assert.strictEqual(trelloStickerToFa('taco-embarrassed'), 'meh-o');
  assert.strictEqual(trelloStickerToFa('taco-clean'), 'bath');
  assert.strictEqual(trelloStickerToFa('pete-ghost'), 'snapchat-ghost');
  // shipped must differ from space
  assert.strictEqual(trelloStickerToFa('pete-shipped'), 'truck');
  assert.strictEqual(trelloStickerToFa('pete-space'), 'rocket');
  assert.notStrictEqual(trelloStickerToFa('pete-shipped'), trelloStickerToFa('pete-space'));
});

test('unknown/custom sticker falls back to the default icon', () => {
  assert.strictEqual(trelloStickerToFa('something-totally-unknown-xyz'), DEFAULT_STICKER_ICON);
  assert.strictEqual(trelloStickerToFa(''), DEFAULT_STICKER_ICON);
});

test('highlight: taco => underline, pete => round, else none', () => {
  assert.strictEqual(trelloStickerHighlight('taco-love'), 'underline');
  assert.strictEqual(trelloStickerHighlight('pete-happy'), 'round');
  assert.strictEqual(trelloStickerHighlight('thumbsup'), undefined);
  assert.strictEqual(trelloStickerHighlight(''), undefined);
});

test('label renames taco => mascot, pete => computer', () => {
  assert.strictEqual(stickerLabel('taco-love'), 'mascot love');
  assert.strictEqual(stickerLabel('pete-ghost'), 'computer ghost');
  assert.strictEqual(stickerLabel('thumbsup'), 'thumbsup');
});

test('picker includes a mascot+computer entry for every mappable icon', () => {
  const mascot = STICKER_PICKER.filter(e => e.highlight === 'underline').map(e => e.icon);
  const computer = STICKER_PICKER.filter(e => e.highlight === 'round').map(e => e.icon);
  // Every icon the importer can produce is offered in both highlights.
  ALL_MAP_ICONS.forEach(icon => {
    assert.ok(mascot.includes(icon), `mascot missing ${icon}`);
    assert.ok(computer.includes(icon), `computer missing ${icon}`);
  });
});

test('picker contains the specific imported sticker icons', () => {
  const iconsWithHL = new Set(STICKER_PICKER.filter(e => e.highlight).map(e => e.icon));
  ['snapchat-ghost', 'heartbeat', 'qrcode', 'flask', 'bath', 'truck', 'rocket', 'meh-o'].forEach(
    icon => assert.ok(iconsWithHL.has(icon), `picker missing highlighted ${icon}`),
  );
});

test('every imported sticker icon can be reproduced from the picker', () => {
  // For any Trello sticker name, the (icon, highlight) it imports as must exist
  // as a selectable picker entry.
  const pickerKeys = new Set(
    STICKER_PICKER.map(e => `${e.icon}|${e.highlight || ''}`),
  );
  ['taco-active', 'taco-clean', 'taco-love', 'pete-ghost', 'pete-shipped', 'pete-space', 'thumbsup'].forEach(
    n => {
      const key = `${trelloStickerToFa(n)}|${trelloStickerHighlight(n) || ''}`;
      assert.ok(pickerKeys.has(key), `picker has no entry for imported ${n} (${key})`);
    },
  );
});

if (typeof describe === 'function') {
  describe('Trello sticker packs', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('Trello sticker pack tests\n');
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

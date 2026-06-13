/**
 * Test: Trello import — attachment merge, ZIP filename matching, sticker mapping
 *
 * These cover the pure logic added for Trello import:
 *   - models/trelloCreator.js   : merge of card.attachments[] + actions, sticker map
 *   - client/components/import/import.js : ZIP filename matching (injectZipAttachments)
 *
 * Those modules depend on Meteor and can't be imported under plain Node, so —
 * following the convention of the sibling wekanCreator.*.test.js files — each
 * test re-implements the exact logic being verified, kept faithful to the
 * production code. Failures throw (assert), so a regression exits non-zero.
 */

const assert = require('assert');

// --- Faithful copy of TrelloCreator attachment merge ----------------------
// Mirrors the pushAttachment/mergedAttachments logic in createCards().
function mergeAttachments(fromActions, fromCardField) {
  const merged = [];
  const byId = new Map();
  const push = raw => {
    if (!raw) return;
    const id = raw.id || raw._id || `__noid_${merged.length}`;
    const norm = {
      id: raw.id || raw._id,
      name: raw.name || raw.fileName || '',
      fileName: raw.fileName || raw.name || '',
      url: raw.url || '',
      type: raw.mimeType || raw.type || undefined,
      file: raw.file,
    };
    const existing = byId.get(id);
    if (existing) {
      if (!existing.file && norm.file) existing.file = norm.file;
      if (!existing.url && norm.url) existing.url = norm.url;
      if (!existing.type && norm.type) existing.type = norm.type;
      return;
    }
    byId.set(id, norm);
    merged.push(norm);
  };
  (fromActions || []).forEach(push);
  (fromCardField || []).forEach(push);
  return merged;
}

// --- Faithful copy of the ZIP filename matcher ----------------------------
// Mirrors findBytesFor() in client injectZipAttachments(): exact basename,
// then `_<fileName>` suffix (TCAD prefixes "<board>_<index>_"), then endsWith.
function makeMatcher(zipBasenames) {
  const entries = zipBasenames.map(base => ({ base, used: false }));
  return fileName => {
    if (!fileName) return null;
    let cand = entries.find(e => !e.used && e.base === fileName);
    if (!cand) cand = entries.find(e => !e.used && e.base.endsWith(`_${fileName}`));
    if (!cand) cand = entries.find(e => !e.used && e.base.endsWith(fileName));
    if (!cand) return null;
    cand.used = true;
    return cand.base;
  };
}

// --- Faithful copy of the Trello sticker -> Font Awesome map --------------
function getStickerIcon(name) {
  const map = {
    thumbsup: 'thumbs-up',
    thumbsdown: 'thumbs-down',
    heart: 'heart',
    star: 'star',
    clock: 'clock',
    check: 'check',
    warning: 'exclamation-triangle',
    smile: 'face-smile',
    laugh: 'face-laugh-beam',
    huh: 'face-meh',
    frown: 'face-frown',
    rocketship: 'rocket',
    globe: 'globe',
    pencil: 'pencil',
  };
  return map[name] || 'note-sticky';
}

// --- Faithful copy of the Trello -> WeKan color mapping -------------------
// Mirrors TrelloCreator.mapToWekanColor(): strip `_light`/`_dark` variant and
// keep only colors WeKan allows (CARD_COLORS === LABEL_COLORS === ALLOWED_COLORS).
const ALLOWED_COLORS = [
  'white', 'green', 'yellow', 'orange', 'red', 'purple', 'blue', 'sky', 'lime',
  'pink', 'black', 'silver', 'peachpuff', 'crimson', 'plum', 'darkgreen',
  'slateblue', 'magenta', 'gold', 'navy', 'gray', 'saddlebrown',
  'paleturquoise', 'mistyrose', 'indigo',
];
function mapToWekanColor(trelloColor) {
  if (!trelloColor) return null;
  const base = String(trelloColor).split('_')[0];
  return ALLOWED_COLORS.includes(base) ? base : null;
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

// ==========================================================================
// Color mapping (labels + card cover)
// ==========================================================================
test('Trello _light/_dark label colors strip to a valid WeKan color', () => {
  assert.strictEqual(mapToWekanColor('purple_light'), 'purple');
  assert.strictEqual(mapToWekanColor('blue_dark'), 'blue');
  assert.strictEqual(mapToWekanColor('green'), 'green');
});

test('unmappable colors return null (so the field is omitted, not invalid)', () => {
  // 'belize' is a board color, never valid for a card/label.
  assert.strictEqual(mapToWekanColor('belize'), null);
  assert.strictEqual(mapToWekanColor(null), null);
  assert.strictEqual(mapToWekanColor(undefined), null);
});

// ==========================================================================
// Attachment merge
// ==========================================================================
test('attachments are read from card.attachments[] when no actions exist', () => {
  const merged = mergeAttachments([], [
    { id: 'a1', name: 'koneet.jpeg', fileName: 'koneet.jpeg', url: 'https://trello/x', mimeType: 'image/jpeg' },
  ]);
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].id, 'a1');
  assert.strictEqual(merged[0].type, 'image/jpeg');
});

test('same attachment in actions and card.attachments is de-duplicated by id', () => {
  const merged = mergeAttachments(
    [{ id: 'a1', name: 'k.jpeg', url: 'https://trello/x' }],
    [{ id: 'a1', name: 'k.jpeg', fileName: 'k.jpeg', mimeType: 'image/jpeg' }],
  );
  assert.strictEqual(merged.length, 1, 'not duplicated');
});

test('injected base64 (file) survives the merge regardless of source order', () => {
  // actions copy has no file; card.attachments copy carries the ZIP bytes
  const merged = mergeAttachments(
    [{ id: 'a1', name: 'k.jpeg', url: 'https://trello/x' }],
    [{ id: 'a1', name: 'k.jpeg', fileName: 'k.jpeg', file: 'QkFTRTY0' }],
  );
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].file, 'QkFTRTY0', 'file bytes carried onto the merged entry');
});

// ==========================================================================
// ZIP filename matching
// ==========================================================================
test('TCAD-prefixed filename matches by _<fileName> suffix', () => {
  const match = makeMatcher(['Liite Testi_1_ai-modern-infra2.jpg', 'Liite Testi_2_koneet.jpeg']);
  assert.strictEqual(match('koneet.jpeg'), 'Liite Testi_2_koneet.jpeg');
  assert.strictEqual(match('ai-modern-infra2.jpg'), 'Liite Testi_1_ai-modern-infra2.jpg');
});

test('exact basename matches and is consumed (no double-assign)', () => {
  const match = makeMatcher(['koneet.jpeg', 'koneet.jpeg']);
  assert.strictEqual(match('koneet.jpeg'), 'koneet.jpeg');
  // second lookup gets the *other* entry, not the already-used one
  assert.strictEqual(match('koneet.jpeg'), 'koneet.jpeg');
  // third lookup: nothing left
  assert.strictEqual(match('koneet.jpeg'), null);
});

test('no match returns null (attachment simply has no bytes)', () => {
  const match = makeMatcher(['something-else.png']);
  assert.strictEqual(match('missing.jpg'), null);
});

// ==========================================================================
// Sticker mapping
// ==========================================================================
test('known Trello sticker names map to Font Awesome icons', () => {
  assert.strictEqual(getStickerIcon('thumbsup'), 'thumbs-up');
  assert.strictEqual(getStickerIcon('heart'), 'heart');
  assert.strictEqual(getStickerIcon('warning'), 'exclamation-triangle');
  assert.strictEqual(getStickerIcon('rocketship'), 'rocket');
});

test('unknown sticker name falls back to note-sticky', () => {
  assert.strictEqual(getStickerIcon('totally-made-up'), 'note-sticky');
});

// ==========================================================================
// Runner — Mocha-compatible when available, standalone otherwise
// ==========================================================================
if (typeof describe === 'function') {
  describe('Trello import: attachments, ZIP matching, stickers', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('====================================');
  console.log('Trello Import Tests');
  console.log('====================================\n');
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
  if (failed > 0) {
    process.exitCode = 1;
  }
}

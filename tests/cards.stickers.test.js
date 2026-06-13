/**
 * Test: card sticker array logic (icon + highlight) and the imported-board URL
 * slug helper.
 *
 * Re-implements the pure array logic of models/cards.js sticker methods
 * (hasSticker/addSticker/removeSticker/toggleSticker, which key on icon + the
 * mascot/computer highlight) and client/components/import/import.js boardSlug().
 * No Trello API credentials are used. Failures throw.
 */

const assert = require('assert');

// --- Faithful copy of the sticker array logic in models/cards.js ----------
// A card here is just { stickers: [...] }; the methods mutate that array the
// same way Cards.updateAsync({$push}/{$set}) would.
function hasSticker(card, icon, highlight) {
  const h = highlight || '';
  return (card.stickers || []).some(s => s.icon === icon && (s.highlight || '') === h);
}
function addSticker(card, icon, highlight, name) {
  if (!icon || hasSticker(card, icon, highlight)) return;
  const position = (card.stickers || []).length;
  const sticker = { icon, position };
  if (highlight) sticker.highlight = highlight;
  if (name) sticker.name = name;
  card.stickers = (card.stickers || []).concat(sticker);
}
function removeSticker(card, icon, highlight) {
  const h = highlight || '';
  const stickers = (card.stickers || []).slice();
  const index = stickers.findIndex(s => s.icon === icon && (s.highlight || '') === h);
  if (index === -1) return;
  stickers.splice(index, 1);
  card.stickers = stickers;
}
function toggleSticker(card, icon, highlight, name) {
  if (hasSticker(card, icon, highlight)) removeSticker(card, icon, highlight);
  else addSticker(card, icon, highlight, name);
}

// --- Faithful copy of boardSlug (import.js); getSlug stubbed simply -------
const getSlug = s =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
function boardSlug(data) {
  const raw = (data && (data.title || data.name)) || '';
  return (raw && getSlug(raw)) || 'imported-board';
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('plain, mascot and computer of the same icon are distinct stickers', () => {
  const card = { stickers: [] };
  addSticker(card, 'heart');
  addSticker(card, 'heart', 'underline', 'mascot love');
  addSticker(card, 'heart', 'round', 'computer love');
  assert.strictEqual(card.stickers.length, 3);
  assert.ok(hasSticker(card, 'heart'));
  assert.ok(hasSticker(card, 'heart', 'underline'));
  assert.ok(hasSticker(card, 'heart', 'round'));
});

test('addSticker is idempotent per icon+highlight', () => {
  const card = { stickers: [] };
  addSticker(card, 'star', 'underline');
  addSticker(card, 'star', 'underline');
  assert.strictEqual(card.stickers.length, 1);
});

test('removeSticker removes only the matching icon+highlight', () => {
  const card = { stickers: [] };
  addSticker(card, 'heart');
  addSticker(card, 'heart', 'round');
  removeSticker(card, 'heart', 'round');
  assert.ok(hasSticker(card, 'heart'));
  assert.ok(!hasSticker(card, 'heart', 'round'));
  assert.strictEqual(card.stickers.length, 1);
});

test('toggleSticker adds then removes the same icon+highlight', () => {
  const card = { stickers: [] };
  toggleSticker(card, 'snapchat-ghost', 'round', 'computer ghost');
  assert.ok(hasSticker(card, 'snapchat-ghost', 'round'));
  toggleSticker(card, 'snapchat-ghost', 'round', 'computer ghost');
  assert.ok(!hasSticker(card, 'snapchat-ghost', 'round'));
  assert.strictEqual(card.stickers.length, 0);
});

test('added sticker stores highlight and name only when given', () => {
  const card = { stickers: [] };
  addSticker(card, 'bug');
  assert.deepStrictEqual(card.stickers[0], { icon: 'bug', position: 0 });
  addSticker(card, 'truck', 'round', 'computer shipped');
  assert.deepStrictEqual(card.stickers[1], {
    icon: 'truck',
    position: 1,
    highlight: 'round',
    name: 'computer shipped',
  });
});

// --- boardSlug ---
test('boardSlug uses Trello .name, WeKan .title, never crashes on undefined', () => {
  assert.strictEqual(boardSlug({ name: 'Liite Testi' }), 'liite-testi'); // Trello
  assert.strictEqual(boardSlug({ title: 'My Board' }), 'my-board'); // WeKan
  assert.strictEqual(boardSlug({ title: 'T', name: 'N' }), 't'); // title wins
  assert.strictEqual(boardSlug({}), 'imported-board'); // no name/title
  assert.strictEqual(boardSlug(undefined), 'imported-board'); // guarded
});

if (typeof describe === 'function') {
  describe('card stickers and board slug', () => {
    tests.forEach(([name, fn]) => it(name, fn));
  });
} else {
  console.log('Card sticker / board slug tests\n');
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

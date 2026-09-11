'use strict';

// History.md §12.1: a soft-deleted attachment is invisible everywhere a card
// is drawn - and §12.2: the card history must still reach it. So every
// card-facing READ filters to live attachments, and the publications do NOT.
// Run: node tests/attachmentSoftDeleteReads.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

console.log('attachmentSoftDeleteReads:');

const importsLive = src =>
  /import \{[^}]*\bliveAttachments\b[^}]*\} from '\/models\/lib\/attachmentSoftDelete'/.test(src);

// Every read that feeds a card, a badge, a picker, an API list or an export,
// with the exact selector it must wrap.
const LIVE_READS = {
  'models/cards.js': [
    "liveAttachments({ 'meta.cardId': this.getRealId() })",   // card.attachments(): gallery, count, minicard badge
    "liveAttachments({ 'meta.cardId': oldId })",              // copying a card copies live ones
  ],
  'client/components/cards/attachments.js': [
    "liveAttachments({ 'meta.cardId': cardId })",             // the gallery
    "liveAttachments({'meta.cardId': cardId})",               // the slideshow next/prev (x2)
  ],
  'client/components/sidebar/sidebar.js': ["liveAttachments({\n        'meta.boardId': Template.instance().boardId,\n        'meta.source': 'board-background',\n      })"],
  'server/publications/backgrounds.js': ["liveAttachments({\n    'meta.boardId': boardId,\n    'meta.source': 'board-background',\n  })"],
  'client/components/main/myAttachments.js': ['liveAttachments({ userId })'],
  'server/attachmentApi.js': ['ReactiveCache.getAttachments(liveAttachments(query))'],
  'server/routes/attachmentApi.js': [
    'ReactiveCache.getAttachments(liveAttachments(query))',
    "liveAttachments({ 'meta.boardId': boardId })",
  ],
  'server/models/boards.js': ["liveAttachments({ 'meta.boardId': paramBoardId })"],
  'models/server/ExporterZip.js': [
    "liveAttachments({ 'meta.boardId': this._boardId })",
    "liveAttachments({ 'meta.cardId': { $in: cardIds } })",
  ],
  'models/server/ExporterExcelCard.js': ["liveAttachments({ 'meta.cardId': this._cardId })"],
  'models/server/ExporterCardPDF.js': [
    "liveAttachments({ 'meta.cardId': this._cardId })",
    "liveAttachments({ 'meta.cardId': { $in: cardIds } })",
  ],
  'models/server/ExporterExcelBoard.js': ["liveAttachments({ 'meta.cardId': { $in: cardIds } })"],
  'models/exporter.js': ['liveAttachments(byBoardAndAttachment)'],
};

test('every card/badge/gallery/picker/API/export read wraps its selector in liveAttachments()', () => {
  for (const [file, fragments] of Object.entries(LIVE_READS)) {
    const src = read(file);
    assert.ok(importsLive(src), `${file} imports liveAttachments`);
    for (const fragment of fragments) {
      assert.ok(src.includes(fragment), `${file} reads live attachments with: ${fragment}`);
    }
  }
});

test('negative: no unfiltered card-scoped attachment read remains in those files', () => {
  const unfiltered = /(getAttachments|Attachments(\.collection)?\.find)\(\s*\{\s*'meta\.(cardId|boardId)'/;
  for (const file of Object.keys(LIVE_READS)) {
    const lines = read(file).split('\n');
    lines.forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      assert.ok(!unfiltered.test(line), `${file}:${i + 1} reads attachments without the live filter: ${line.trim()}`);
    });
  }
});

test('the cover is never a deleted attachment - on the card and on the minicard', () => {
  const cards = read('models/cards.js');
  const cover = cards.slice(cards.indexOf('  cover() {'), cards.indexOf('  checklists() {'));
  assert.ok(/if \(!isLiveAttachment\(cover\)\) return false;/.test(cover));
  const minicard = read('client/components/cards/minicard.js');
  const miniCover = minicard.slice(minicard.indexOf('  cover() {'), minicard.indexOf('  sess() {'));
  assert.ok(/if \(!isLiveAttachment\(attachment\)\) return null;/.test(miniCover));
});

test('the minicard badge and the card count read card.attachments(), which is the live read', () => {
  assert.ok(/if attachments\.length\s*\n\s*if currentBoard\.allowsBadgeAttachmentOnMinicard/.test(read('client/components/cards/minicard.jade')));
  const details = read('client/components/cards/cardDetails.js');
  assert.ok(/const attachments = card\.attachments && card\.attachments\(\);/.test(details));
});

test('the publications still send soft-deleted attachments - the card history reads them (§12.2)', () => {
  for (const file of ['server/publications/cards.js', 'server/publications/boards.js', 'server/publications/cardsWindow.js']) {
    const src = read(file);
    assert.ok(!/liveAttachments|deletedAt: null/.test(src),
      `${file} must not filter attachments to live ones - a deleted one is previewed and restored from the history`);
  }
});

test('the history table finds the attachment for a row through the cache, deleted or not', () => {
  const table = read('client/components/history/historyTable.js');
  assert.ok(/ReactiveCache\.getAttachment\(row\.entityId\)/.test(table));
  assert.ok(!/liveAttachments|deletedAt/.test(table), 'negative: the history row does not hide the deleted attachment from itself');
});

console.log(`\nattachmentSoftDeleteReads: ${passed} tests passed`);

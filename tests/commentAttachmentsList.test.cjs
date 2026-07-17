'use strict';

// Plain-Node regression test (no Meteor) for issue #3843:
// "Keep the link between global attachment and attachment in a comment" —
// an attachment added inside a card COMMENT must show up in the card's
// Attachments list.
//
// How comment attachments work today: the rich comment editor
// (client/components/main/editor.js, summernote onImageUpload) uploads the
// file into the SAME Attachments FilesCollection as the card Attachments
// popup, with `meta: Utils.getCommonAttachmentMetaFrom(currentCard)`. The
// card's Attachments section (Template.attachmentGallery in
// client/components/cards/attachments.js, and Cards.helpers.attachments in
// models/cards.js) selects `{ 'meta.cardId': cardId }` with no further
// filtering, so a comment upload is listed as long as its meta.cardId matches
// the card. The shared meta builder is the pure
// models/lib/attachmentMeta.js#buildCardAttachmentMeta, delegated to by
// Utils.getCommonAttachmentMetaFrom.
//
// This test pins both halves of that invariant:
//   1. behaviour: the meta built for a comment upload is matched by the
//      gallery's meta.cardId selector (incl. the linked-card case), and
//      non-card attachments (board backgrounds) are NOT;
//   2. source guards: the comment editor really uses the shared builder and
//      the gallery/model queries really key on meta.cardId without a
//      meta.source exclusion.
//
// Run: ELECTRON_RUN_AS_NODE=1 <node-or-code-binary> tests/commentAttachmentsList.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { buildCardAttachmentMeta } = require('../models/lib/attachmentMeta');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const editorSrc = read('client/components/main/editor.js');
const gallerySrc = read('client/components/cards/attachments.js');
const cardsModelSrc = read('models/cards.js');
const utilsSrc = read('client/lib/utils.js');

// The card Attachments section's selector, replicated over plain objects:
// both client/components/cards/attachments.js (attachmentGallery helper) and
// models/cards.js (Cards.helpers.attachments) select { 'meta.cardId': cardId }.
// The source guards below assert the real files still use exactly that key.
function listedInCardAttachments(attachmentDoc, cardId) {
  // The gallery helper returns [] when it has no card id
  // ("if (!cardId) return [];"), so nothing can match a missing id.
  if (!cardId) {
    return false;
  }
  return Boolean(
    attachmentDoc &&
    attachmentDoc.meta &&
    attachmentDoc.meta.cardId === cardId,
  );
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Card stubs shaped like models/cards.js documents/helpers.
const plainCard = {
  _id: 'card1',
  boardId: 'boardA',
  swimlaneId: 'swimlane1',
  listId: 'list1',
  isLinkedCard: () => false,
};
const linkedCard = {
  _id: 'shellCard',
  boardId: 'boardShell',
  linkedId: 'realCard',
  isLinkedCard: () => true,
};
const getCardById = id =>
  id === 'realCard' ? { _id: 'realCard', boardId: 'boardReal' } : null;

// --- POSITIVE: a comment upload is listed in the card's Attachments ---------

test('comment upload meta carries the cardId the gallery selects on', () => {
  const meta = buildCardAttachmentMeta(plainCard, getCardById);
  assert.strictEqual(meta.cardId, 'card1');
  assert.strictEqual(meta.boardId, 'boardA');
  assert.strictEqual(meta.swimlaneId, 'swimlane1');
  assert.strictEqual(meta.listId, 'list1');
  const uploadedFromComment = { _id: 'att1', name: 'pasted.png', meta };
  assert.strictEqual(listedInCardAttachments(uploadedFromComment, 'card1'), true);
});

test('comment upload meta is IDENTICAL to a card-popup upload meta (same builder)', () => {
  // Both the Attachments popup and the comment editor call
  // Utils.getCommonAttachmentMetaFrom -> buildCardAttachmentMeta, so the two
  // upload paths cannot diverge on the fields the list keys on.
  const fromComment = buildCardAttachmentMeta(plainCard, getCardById);
  const fromPopup = buildCardAttachmentMeta(plainCard, getCardById);
  assert.deepStrictEqual(fromComment, fromPopup);
});

test('comment upload on a LINKED card is listed on the REAL card', () => {
  const meta = buildCardAttachmentMeta(linkedCard, getCardById);
  assert.strictEqual(meta.cardId, 'realCard');
  assert.strictEqual(meta.boardId, 'boardReal');
  const doc = { _id: 'att2', meta };
  // The gallery resolves the card via getRealId(), i.e. it queries with the
  // real card's id — the attachment must match there, not on the shell card.
  assert.strictEqual(listedInCardAttachments(doc, 'realCard'), true);
  assert.strictEqual(listedInCardAttachments(doc, 'shellCard'), false);
});

// --- SOURCE GUARDS: the real code paths still wire up this behaviour --------

test('comment editor uploads into Attachments with the shared card meta', () => {
  // client/components/main/editor.js (summernote onImageUpload) must store
  // comment images in the Attachments FilesCollection with the common card
  // meta — not inline base64, not a different meta shape.
  const upload = editorSrc.match(
    /onImageUpload\(files\)[\s\S]*?Attachments\.insertAsync\(\s*\{[\s\S]*?\}\s*,\s*false\s*,?\s*\)/,
  );
  assert.ok(upload, 'comment editor upload call found');
  assert.ok(
    /meta:\s*Utils\.getCommonAttachmentMetaFrom\(currentCard\)/.test(upload[0]),
    'comment upload must pass Utils.getCommonAttachmentMetaFrom(currentCard) as meta',
  );
});

test('Utils.getCommonAttachmentMetaFrom delegates to the shared builder', () => {
  assert.ok(
    /getCommonAttachmentMetaFrom\(card\)\s*\{\s*\n\s*return buildCardAttachmentMeta\(card,/.test(utilsSrc),
    'client/lib/utils.js must delegate to models/lib/attachmentMeta.js',
  );
  assert.ok(
    /from '\/models\/lib\/attachmentMeta'/.test(utilsSrc),
    'client/lib/utils.js must import the shared builder',
  );
});

test('the card Attachments gallery selects by meta.cardId', () => {
  const helper = gallerySrc.match(/Template\.attachmentGallery\.helpers[\s\S]*?attachments\(\)[\s\S]*?\n  \},/);
  assert.ok(helper, 'attachmentGallery attachments() helper found');
  assert.ok(
    /'meta\.cardId':\s*cardId/.test(helper[0]),
    "gallery must query { 'meta.cardId': cardId }",
  );
});

test('Cards.helpers.attachments selects by meta.cardId', () => {
  assert.ok(
    /attachments\(\)\s*\{[\s\S]*?'meta\.cardId':\s*this\.getRealId\(\)/.test(cardsModelSrc),
    "models/cards.js attachments() must query { 'meta.cardId': this.getRealId() }",
  );
});

test('NEGATIVE: no meta.source filter excludes comment uploads from the list', () => {
  const helper = gallerySrc.match(/Template\.attachmentGallery\.helpers[\s\S]*?attachments\(\)[\s\S]*?\n  \},/);
  assert.ok(helper, 'attachmentGallery attachments() helper found');
  assert.strictEqual(
    /meta\.source/.test(helper[0]),
    false,
    'the gallery query must not filter on meta.source',
  );
  const modelHelper = cardsModelSrc.match(/attachments\(\)\s*\{[\s\S]*?\n  \},/);
  assert.ok(modelHelper, 'models/cards.js attachments() helper found');
  assert.strictEqual(
    /meta\.source/.test(modelHelper[0]),
    false,
    'the model query must not filter on meta.source',
  );
});

// --- NEGATIVE: non-card attachments must NOT leak into the card list --------

test('NEGATIVE: board-background uploads (no cardId) are not listed on any card', () => {
  // client/components/sidebar/sidebar.js uploads board backgrounds with
  // meta: { boardId, source: 'board-background' } — no cardId.
  const backgroundDoc = {
    _id: 'bg1',
    meta: { boardId: 'boardA', source: 'board-background' },
  };
  assert.strictEqual(listedInCardAttachments(backgroundDoc, 'card1'), false);
});

test("NEGATIVE: another card's attachment is not listed on this card", () => {
  const otherMeta = buildCardAttachmentMeta(
    { _id: 'card2', boardId: 'boardA', isLinkedCard: () => false },
    getCardById,
  );
  assert.strictEqual(listedInCardAttachments({ meta: otherMeta }, 'card1'), false);
});

test('NEGATIVE: a null card yields empty meta — never a bogus cardId', () => {
  assert.doesNotThrow(() => buildCardAttachmentMeta(null, getCardById));
  const meta = buildCardAttachmentMeta(null, getCardById);
  assert.deepStrictEqual(meta, {});
  assert.strictEqual(listedInCardAttachments({ meta }, 'card1'), false);
  assert.strictEqual(listedInCardAttachments({ meta }, undefined), false);
});

test('NEGATIVE: a linked card whose real card is gone still links by id and does not throw', () => {
  const orphanLinked = {
    _id: 'shell2',
    boardId: 'boardShell',
    linkedId: 'goneCard',
    isLinkedCard: () => true,
  };
  const meta = buildCardAttachmentMeta(orphanLinked, getCardById);
  assert.strictEqual(meta.cardId, 'goneCard');
  assert.strictEqual('boardId' in meta, false);
});

console.log(`\n${passed} tests passed`);

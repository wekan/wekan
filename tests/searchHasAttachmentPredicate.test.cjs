'use strict';

// Found by the Haitian attachment-search browser test: the global search's
// has:attachment read each attachment's card from `cardId` - an attachment
// names it in meta.cardId - so it found no card at all; and the negated
// predicates (has:-attachment, has:-checklist: `exists: false`) were ignored,
// so they returned the cards WITH one. Soft-deleted attachments do not count.
// The same top-level cardId made a search by attachment FILENAME (free text
// and attachment:) find nothing either.
// Run: node tests/searchHasAttachmentPredicate.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('searchHasAttachmentPredicate:');

const pub = read('server/publications/cards.js');
const hasBlock = pub.slice(pub.indexOf('case PREDICATE_ATTACHMENT: {'), pub.indexOf('case PREDICATE_DESCRIPTION:'));

test('has:attachment finds cards by meta.cardId, live attachments only', () => {
  assert.match(hasBlock, /getAttachments\(attachmentScope, \{ fields: \{ 'meta\.cardId': 1, deletedAt: 1 \} \}\)\)\n\s+\.filter\(isLiveAttachment\)\.map\(a => a\.meta && a\.meta\.cardId\)\.filter\(Boolean\);/);
});

test('a negated has: asks for the cards without one', () => {
  assert.strictEqual((hasBlock.match(/selector\.\$and\.push\(\{ _id: has\.exists \? \{ \$in: ids \} : \{ \$nin: ids \} \}\);/g) || []).length, 2, 'attachment and checklist');
  // The parser sets exists from the minus sign.
  assert.match(read('config/query-classes.js'), /exists: !negated,/);
});

test('a filename search maps attachments to their cards by meta.cardId', () => {
  assert.strictEqual((pub.match(/attachments\.map\(attach => attach\.meta && attach\.meta\.cardId\)\.filter\(Boolean\)/g) || []).length, 2);
  assert.ok(!/attach\.cardId\b/.test(pub), 'negative: no attach.cardId left');
});

test('negative: no server code reads an attachment\'s card from a top-level cardId', () => {
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return ['node_modules', 'tests', '.npm'].includes(e.name) ? [] : walk(rel);
    return /\.js$/.test(e.name) ? [rel] : [];
  });
  for (const file of [...walk('server'), ...walk('models')]) {
    const src = read(file);
    for (const m of src.matchAll(/getAttachments\(([^;]*?)\{ fields: \{ cardId: 1 \} \}/g)) {
      assert.fail(`${file}: asks attachments for a top-level cardId - it is meta.cardId`);
    }
  }
});

console.log(`searchHasAttachmentPredicate: ${passed} passed`);

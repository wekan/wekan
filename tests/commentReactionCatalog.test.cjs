'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  COMMENT_REACTIONS,
  canonicalCommentReactions,
  commentReaction,
} = require('../models/lib/commentReactionCatalog');

test('comment reactions have a bounded numeric-entity catalog and ASCII fallback labels', () => {
  assert.strictEqual(COMMENT_REACTIONS.length, 12);
  assert.strictEqual(new Set(COMMENT_REACTIONS.map(item => item.codepoint)).size, 12);
  for (const item of COMMENT_REACTIONS) {
    assert.match(item.codepoint, /^&#\d{4,6};$/);
    assert.match(item.ascii, /^[\x20-\x7e]+$/);
    assert.strictEqual([...item.character].length, 1);
    assert.strictEqual(commentReaction(item.codepoint), item);
  }
  assert.strictEqual(commentReaction('<img src=x onerror=alert(1)>'), null);
  assert.strictEqual(commentReaction('&#999999;'), null);
});

test('canonical reactions discard unknown shapes, deduplicate actors and use stable order', () => {
  assert.deepStrictEqual(canonicalCommentReactions([
    { reactionCodepoint: '&#128078;', userIds: ['b', 'a', 'a', '', null] },
    { reactionCodepoint: '<script>', userIds: ['attacker'] },
    { reactionCodepoint: '&#128077;', userIds: ['z'] },
    { reactionCodepoint: '&#128078;', userIds: ['c'] },
  ]), [
    { reactionCodepoint: '&#128077;', userIds: ['z'] },
    { reactionCodepoint: '&#128078;', userIds: ['a', 'b', 'c'] },
  ]);
});

test('both progressive clients call one server-authorized reaction operation', () => {
  const root = path.join(__dirname, '..');
  const model = fs.readFileSync(path.join(root, 'models/cardComments.js'), 'utf8');
  const html4 = fs.readFileSync(path.join(root, 'server/legacyHtml4.js'), 'utf8');
  const service = fs.readFileSync(
    path.join(root, 'server/lib/accessibleCommentReactionOperations.js'), 'utf8',
  );
  assert.match(model, /callAsync\('toggleAccessibleCommentReaction'/);
  assert.match(html4, /toggleAccessibleCommentReaction\(session\.userId/);
  assert.match(service, /accessibleCommentCard\(userId, boardId, cardId, true\)/);
  assert.match(service, /CardComments\.findOneAsync\(\{ _id: commentId, boardId, cardId \}\)/);
  assert.doesNotMatch(model, /CardCommentReactions\.(?:insert|update|remove)Async/);
});

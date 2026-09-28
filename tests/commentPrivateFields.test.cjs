'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PRIVATE_COMMENT_FIELDS, hasPrivateCommentWrite, publicCommentOptions } = require('../models/lib/commentPrivateFields');
const { buildCopiedComment } = require('../models/lib/copiedComment');
test('private roots, nested writes, replacements and rename destinations are refused', () => {
  for (const field of PRIVATE_COMMENT_FIELDS) {
    for (const modifier of [{ $set: { [field]: 'forged' } }, { $unset: { [`${field}.checksum`]: '' } },
      { $rename: { text: field } }, { $rename: { text: `${field}.checksum` } }, { [field]: 'replacement' }]) {
      assert.equal(hasPrivateCommentWrite([], modifier), true);
    }
    assert.equal(hasPrivateCommentWrite([field]), true);
  }
  assert.equal(hasPrivateCommentWrite(['text'], { text: 'replacement erases evidence' }), true);
  assert.equal(hasPrivateCommentWrite(['text'], { $set: { text: 'normal comment' } }), false);
  assert.equal(hasPrivateCommentWrite([], { $set: { webhookResponseRevisionTitle: 'ordinary' } }), false);
});
test('public projections preserve inclusions/exclusions without exposing or expanding private-only requests', () => {
  const options = { sort: { createdAt: 1 }, fields: { boardId: 0 } };
  assert.deepEqual(publicCommentOptions(options), { sort: options.sort,
    fields: { boardId: 0, webhookResponsePending: 0, webhookResponseRevision: 0 } });
  assert.deepEqual(options.fields, { boardId: 0 });
  assert.deepEqual(publicCommentOptions({ fields: { cardId: 1, webhookResponsePending: 1 } }).fields, { cardId: 1 });
  assert.deepEqual(publicCommentOptions({ fields: { 'webhookResponsePending.checksum': 1 } }).fields, { _id: 1 });
  assert.deepEqual(publicCommentOptions({ fields: { _id: 0, webhookResponseRevision: 1 } }).fields, { _id: 1 });
  assert.deepEqual(publicCommentOptions({ fields: { _id: 1 } }).fields, { _id: 1 });
  assert.deepEqual(publicCommentOptions({ fields: { webhookResponseRevision: 1, text: 0 } }).fields, { _id: 1 });
});
test('copied comments retain conversation fields but never inherit delivery evidence', () => {
  const source = { _id: 'old', text: 'Comment', boardId: 'board', cardId: 'card',
    createdAt: new Date(0), webhookResponsePending: { receipt: 'secret' }, webhookResponseRevision: 'private' };
  const copy = buildCopiedComment(source, 'new-card', 'new-board');
  assert.equal(copy.text, source.text); assert.equal(copy.createdAt, source.createdAt);
  assert.equal(copy.boardId, 'new-board'); assert.equal(copy.cardId, 'new-card');
  for (const field of PRIVATE_COMMENT_FIELDS) { assert.equal(Object.hasOwn(copy, field), false); assert.ok(Object.hasOwn(source, field)); }
});
test('server cache reads apply private-field projection before single-row or cursor access', () => {
  const source = fs.readFileSync(require.resolve('../imports/reactiveCache.js'), 'utf8');
  for (const method of ['getCardComment', 'getCardComments']) {
    const body = source.slice(source.indexOf(`async ${method}(`)).split('\n  },')[0];
    assert.ok(body.indexOf('options = publicCommentOptions(options)') < body.indexOf('CardComments.find'));
    assert.match(body, /options = publicCommentOptions\(options\)/);
  }
});
test('private projections cover the executor marker names and publications cannot bypass the shared reader', () => {
  const path = require('node:path');
  const { PENDING, REVISION } = require('../server/lib/syncWebhookComment');
  assert.deepEqual(PRIVATE_COMMENT_FIELDS, [PENDING, REVISION]);
  for (const file of fs.readdirSync(path.join(__dirname, '../server/publications')).filter(name => name.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(__dirname, '../server/publications', file), 'utf8');
    assert.doesNotMatch(source, /CardComments\.(?:find|findOne|rawCollection)\s*\(/, `${file}: use projected shared reads`);
  }
});

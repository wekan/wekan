'use strict';

// Guard (2026-10-02): the attachment API's copy and move wrote the target
// card, list and swimlane ids as given, checking only write access to the
// target BOARD - so a file could be planted on a card of a board the caller
// cannot write (publications select a card's attachments by meta.cardId
// alone). An assigned-only member could also copy files from cards they
// cannot see into a board they control.
// Run: node tests/attachmentApiTargets.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const src = fs.readFileSync(path.join(__dirname, '..', 'server/attachmentApi.js'), 'utf8');

test('the target card, list and swimlane must belong to the target board', async () => {
  const fnSrc = src.slice(src.indexOf('async function assertAttachmentTarget('), src.indexOf('\n}\n', src.indexOf('async function assertAttachmentTarget(')) + 2);
  const docs = { card: { boardId: 'mine' }, foreignCard: { boardId: 'victim' }, list: { boardId: 'mine' }, lane: { boardId: 'mine' } };
  const ReactiveCache = { getCard: async id => docs[id], getList: async id => docs[id], getSwimlane: async id => docs[id] };
  const Meteor = { Error: class extends Error { constructor(e) { super(e); this.error = e; } } };
  // eslint-disable-next-line no-new-func
  const assertTarget = new Function('ReactiveCache', 'Meteor', `${fnSrc}\nreturn assertAttachmentTarget;`)(ReactiveCache, Meteor);
  await assertTarget('mine', 'lane', 'list', 'card');
  await assert.rejects(assertTarget('mine', 'lane', 'list', 'foreignCard'), { error: 'invalid-target' });
  await assert.rejects(assertTarget('mine', 'lane', 'list', 'nope'), { error: 'invalid-target' });
  docs.list = { boardId: 'victim' };
  await assert.rejects(assertTarget('mine', 'lane', 'list', 'card'), { error: 'invalid-target' });
});

test('copy and move both check the target; copy checks the source card scope', () => {
  for (const method of ["async 'api.attachment.copy'(", "async 'api.attachment.move'("]) {
    const at = src.indexOf(method);
    const body = src.slice(at, src.indexOf('\n    },', at));
    const check = body.indexOf('await assertAttachmentTarget(targetBoardId, targetSwimlaneId, targetListId, targetCardId);');
    assert.ok(check > 0, `${method} checks the target`);
    assert.ok(check < body.search(/Attachments\.(insertAsync|updateAsync|writeAsync)|\.writeAsync\(|insertAsync\(/), `${method} checks before writing`);
  }
  const copy = src.slice(src.indexOf("async 'api.attachment.copy'("));
  assert.match(copy.slice(0, 3000), /mayCopyFromBoard\(sourceBoard, this\.userId, sourceCard\)/);
});

test('the REST copy follows the same source scope', () => {
  const rest = fs.readFileSync(path.join(__dirname, '..', 'server/routes/attachmentApi.js'), 'utf8');
  const copy = rest.slice(rest.indexOf("WebApp.handlers.use('/api/attachment/copy'"));
  assert.match(copy.slice(0, 4000), /mayCopyFromBoard\(sourceBoard, userId, sourceCard\)/);
  assert.match(copy.slice(0, 5000), /if \(targetCard\.boardId !== targetBoardId\)/);
});

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const { prepareRuleCardAttachments } = require('../server/lib/ruleCardAttachments');
function fixture() {
  const f = { activity: { cardId: 'card', boardId: 'board', userId: 'reader' },
    board: { permission: 'private', members: [] }, card: { _id: 'card', boardId: 'board', assignees: [] },
    files: [{ _id: 'file', name: 'report.txt', type: 'text/plain', meta: { cardId: 'card' } }], allowed: true, reads: 0 };
  f.cache = { getCard: async () => f.card, getBoard: async () => f.board, getAttachments: async selector => {
    assert.equal(selector['meta.cardId'], 'card'); assert.ok(Object.hasOwn(selector, 'deletedAt'));
    return structuredClone(f.files);
  } };
  f.canReadBoard = () => f.allowed;
  f.openStream = () => { f.reads++; return Readable.from([Buffer.from('content')]); };
  return f;
}
test('authorized live card files become byte snapshots; empty cards have no attachments', async () => {
  const f = fixture(), files = await prepareRuleCardAttachments(f);
  assert.equal(Buffer.from(files[0].content, 'base64').toString(), 'content');
  f.files = []; assert.deepEqual(await prepareRuleCardAttachments(f), []);
});
test('unauthorized, foreign and unassigned cards are refused before opening files', async () => {
  for (const change of [f => { f.allowed = false; }, f => { f.card.boardId = 'foreign'; }, f => { f.activity.userId = null; },
    f => { f.card = null; }, f => { f.card.deletedAt = new Date(); }, f => { f.board.members = [{ userId: 'reader', isActive: true, isReadAssignedOnly: true }]; }]) {
    const f = fixture(); change(f); await assert.rejects(prepareRuleCardAttachments(f), /not-authorized/); assert.equal(f.reads, 0);
  }
});
test('access revocation and file changes during reads discard the entire message attachments', async () => {
  for (const mutate of [f => { f.allowed = false; }, f => { f.files = []; }, f => { f.files[0].name = 'changed'; }]) {
    const f = fixture(); f.openStream = () => { mutate(f); return Readable.from([Buffer.from('data')]); };
    await assert.rejects(prepareRuleCardAttachments(f), /not-authorized|changed/);
  }
});

test('attachment manifest uses captured bytes, public names and cover identity without storage details', async () => {
  const f = fixture(); f.card.coverId = 'file';
  Object.assign(f.files[0], { size: 99999, uploadedAt: new Date('2027-01-01'), userId: 'uploader',
    path: 'SECRET-PATH', downloadUrl: 'SECRET-URL' });
  f.cache.getUser = async () => ({ profile: { fullname: 'File author' }, emails: ['SECRET-EMAIL'], services: { token: 'SECRET' } });
  let manifest; f.onManifest = text => { manifest = text; };
  await prepareRuleCardAttachments(f);
  for (const value of ['File: report.txt', 'Size (bytes): 7', 'Type: text/plain', 'Cover: true',
    'Uploaded: 2027-01-01T00:00:00.000Z', 'Uploaded by: File author']) assert.ok(manifest.includes(value), value);
  assert.doesNotMatch(manifest, /SECRET|99999/);
  f.files = []; await prepareRuleCardAttachments(f); assert.equal(manifest, '');
});
test('manifest cannot survive cover changes, author-read access loss or foreign file rows', async () => {
  for (const mutate of [f => { f.card.coverId = 'changed'; }, f => { f.allowed = false; }]) {
    const f = fixture(); f.files[0].userId = 'author';
    f.cache.getUser = async () => { mutate(f); return { username: 'author' }; };
    f.onManifest = () => assert.fail('invalidated metadata must not be returned');
    await assert.rejects(prepareRuleCardAttachments(f), /not-authorized|changed/);
  }
  const f = fixture(); f.files[0].meta.cardId = 'foreign';
  await assert.rejects(prepareRuleCardAttachments(f), /changed/); assert.equal(f.reads, 0);
});

test('access is checked after the final metadata read as well as byte reads', async () => {
  const f = fixture(), read = f.cache.getAttachments; let count = 0;
  f.cache.getAttachments = async (...args) => { const files = await read(...args); if (++count === 2) f.allowed = false; return files; };
  await assert.rejects(prepareRuleCardAttachments(f), /not-authorized/);
});

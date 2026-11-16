'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { liveAttachments } = require('../models/lib/attachmentSoftDelete');

// Exercise the shared remover used by REST single/bulk deletion and the
// collection hook. The storage/lifecycle helper is tested in its own suites.
const source = fs.readFileSync(path.join(__dirname, '../models/cards.js'), 'utf8');
const start = source.indexOf('async function cardRemover(');
const body = source.slice(start, source.indexOf('\n// #5323:', start));

function remover({ attachments = [], softDelete, isServer = true }) {
  const calls = [];
  const direct = { removeAsync: async () => {} };
  const load = new Function(
    'Meteor', 'ChecklistItems', 'Checklists', 'CardComments', 'Cards', 'Attachments',
    'require', 'liveAttachments', 'onlyChildrenSelector', 'sharedChildrenSelector',
    `${body}; return cardRemover;`,
  );
  const remove = load({ isServer }, { direct }, { direct }, { direct }, {
    find: () => ({ fetchAsync: async () => [] }), removeAsync: async () => {},
  }, {
    collection: { find(selector) {
      calls.push(['find', selector]);
      return { fetchAsync: async () => attachments };
    } },
    async removeAsync(selector) { calls.push(['legacyRemove', selector]); },
  }, name => {
    if (name === '/server/attachmentSoftDelete') return { softDeleteAttachment: softDelete };
    if (name === '/models/changeHistory') return { default: { record: async () => {} } };
    throw new Error(`Unexpected module: ${name}`);
  }, liveAttachments, () => ({}), () => ({}));
  return { remove, calls };
}

test('card deletion awaits recoverable deletion of attachments selected by meta.cardId', async () => {
  const attachments = [{ _id: 'first' }, { _id: 'second' }];
  const completed = [];
  const { remove, calls } = remover({ attachments, softDelete: async input => {
    await new Promise(resolve => setImmediate(resolve));
    completed.push(input);
  } });
  await remove('actor', { _id: 'card' });
  assert.deepEqual(calls[0], ['find', { 'meta.cardId': 'card', deletedAt: null }]);
  assert.deepEqual(completed, attachments.map(attachment => ({ userId: 'actor', attachment })));
  assert.deepEqual(calls[1], ['legacyRemove', { cardId: 'card' }], 'keep legacy purge behavior');
});

test('an empty live attachment set performs no lifecycle writes', async () => {
  const { remove, calls } = remover({ softDelete: async () => assert.fail('no live attachments') });
  await remove(null, { _id: 'empty' });
  assert.deepEqual(calls[0], ['find', { 'meta.cardId': 'empty', deletedAt: null }]);
});

test('a failed attachment deletion is propagated before the card can be removed', async () => {
  const { remove, calls } = remover({ attachments: [{ _id: 'failed' }], softDelete: async () => {
    throw new Error('attachment write failed');
  } });
  await assert.rejects(remove('actor', { _id: 'card' }), /attachment write failed/);
  assert.equal(calls.length, 1, 'do not continue the purge after a failed lifecycle write');
});

test('the shared model does not load the server attachment helper on the client', async () => {
  const { remove, calls } = remover({ isServer: false, softDelete: async () => assert.fail('server-only helper') });
  await remove(null, { _id: 'card' });
  assert.deepEqual(calls, [['legacyRemove', { cardId: 'card' }]]);
});

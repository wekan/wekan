import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import CardComments from '/models/cardComments';
import { ReactiveCache } from '/imports/reactiveCache';

describe('Private comment delivery fields', function () {
  it('excludes evidence from ordinary reads, export-shaped reads and publication cursors while normal edits preserve it', async function () {
    if (!Meteor.isAppTest) this.skip();
    const id = Random.id();
    try {
      await CardComments.rawCollection().insertOne({ _id: id, boardId: Random.id(), cardId: Random.id(), userId: Random.id(),
        text: 'Visible', createdAt: new Date(), modifiedAt: new Date(),
        webhookResponsePending: { checksum: 'private' }, webhookResponseRevision: 'private' });
      const rows = [await ReactiveCache.getCardComment(id),
        ...(await ReactiveCache.getCardComments({ _id: id }, { fields: { boardId: 0 } }))];
      const cursor = await ReactiveCache.getCardComments({ _id: id }, {}, true);
      rows.push(...await cursor.fetchAsync());
      rows.push(await ReactiveCache.getCardComment(id, { fields: { text: 1, webhookResponseRevision: 1 } }));
      for (const row of rows) {
        assert.equal(row.text, 'Visible');
        assert.equal(Object.hasOwn(row, 'webhookResponsePending'), false);
        assert.equal(Object.hasOwn(row, 'webhookResponseRevision'), false);
      }
      const privateOnly = await ReactiveCache.getCardComment(id, { fields: { webhookResponsePending: 1 } });
      assert.deepEqual(Object.keys(privateOnly), ['_id']);
      await CardComments.direct.updateAsync(id, { $set: { text: 'Normal edit' } });
      const raw = await CardComments.rawCollection().findOne({ _id: id });
      assert.equal(raw.text, 'Normal edit'); assert.equal(raw.webhookResponseRevision, 'private');
      assert.deepEqual(raw.webhookResponsePending, { checksum: 'private' });
    } finally { await CardComments.rawCollection().deleteMany({ _id: id }); }
  });
});

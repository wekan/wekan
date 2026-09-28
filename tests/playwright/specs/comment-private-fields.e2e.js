'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
for (const role of ['member', 'admin']) {
  test(`comment delivery evidence stays private and rejects ${role} browser writes`, async ({ page, user, adminUser }) => {
    const actor = role === 'admin' ? adminUser : user;
    const board = db.seedBoard({ ownerId: actor.id, cardTitlesPerList: [['Private evidence card']] });
    const card = db.find('cards', { boardId: board.boardId })[0], id = db.uid('comment-evidence');
    db.insertOne('card_comments', { _id: id, boardId: board.boardId, cardId: card._id, userId: actor.id,
      text: 'Visible comment', createdAt: new Date(), modifiedAt: new Date(),
      webhookResponsePending: { checksum: 'private' }, webhookResponseRevision: 'private-revision' });
    try {
      await loginWithToken(page, actor.id, actor.token);
      const result = await page.evaluate(async ({ id, cardId, boardId, userId }) => {
        const sub = Meteor.subscribe('openCardData', cardId);
        await new Promise((resolve, reject) => {
          const started = Date.now();
          const timer = setInterval(() => {
            if (sub.ready()) { clearInterval(timer); resolve(); }
            else if (Date.now() - started > 15000) { clearInterval(timer); reject(new Error('subscription timeout')); }
          }, 50);
        });
        const read = () => Meteor.connection._stores.card_comments._getCollection().findOne(id);
        const visible = read(), errors = [];
        for (const [method, args] of [
          ['update', [{ _id: id }, { $set: { webhookResponseRevision: 'forged' } }]],
          ['update', [{ _id: id }, { $unset: { webhookResponsePending: '' } }]],
          ['update', [{ _id: id }, { $rename: { text: 'webhookResponseRevision' } }]],
          ['update', [{ _id: id }, { $set: { 'webhookResponsePending.checksum': 'forged' } }]],
          ['insert', [{ _id: `${id}-forged`, boardId, cardId, userId, text: 'Forged', webhookResponseRevision: 'forged' }]],
        ]) {
          try { await Meteor.callAsync(`/card_comments/${method}`, ...args); errors.push('accepted'); }
          catch (error) { errors.push(error.error); }
        }
        await Meteor.callAsync('/card_comments/update', { _id: id }, { $set: { text: 'Allowed normal edit' } });
        sub.stop(); return { visible, errors };
      }, { id, cardId: card._id, boardId: board.boardId, userId: actor.id });
      expect(result.visible.text).toBe('Visible comment');
      expect(result.visible.webhookResponsePending).toBeUndefined();
      expect(result.visible.webhookResponseRevision).toBeUndefined();
      expect(result.errors).toEqual(Array(5).fill(403));
      const saved = db.findOne('card_comments', { _id: id });
      expect(saved.text).toBe('Allowed normal edit');
      expect(saved.webhookResponsePending).toEqual({ checksum: 'private' });
      expect(saved.webhookResponseRevision).toBe('private-revision');
      expect(db.findOne('card_comments', { _id: `${id}-forged` })).toBeNull();
    } finally {
      db.deleteMany('card_comments', { _id: { $in: [id, `${id}-forged`] } });
      db.cleanup({ boardIds: [board.boardId] });
    }
  });
}

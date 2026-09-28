'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
for (const role of ['member', 'admin']) {
  test(`private Sync recovery collections reject ${role} browser writes`, async ({ page, user, adminUser }) => {
    const actor = role === 'admin' ? adminUser : user;
    await loginWithToken(page, actor.id, actor.token);
    const names = ['historyWriterGates', 'historyChainHeads', 'listSyncRuleArchiveCommands', 'listSyncRuleArchiveEffects', 'listSyncRuleArchiveReceipts', 'listSyncRuleEmailAttempts', 'listSyncRuleEmailCommands', 'listSyncRuleReceipts', 'listSyncRulePlans', 'listSyncWebhookPlans', 'listSyncWebhookReceipts', 'listSyncWebhookResponses', 'listSyncWebhookCommentPlans', 'listSyncWebhookCommentReceipts', 'listSyncNotificationPlans', 'listSyncOperationIntents', 'listSyncOperations', 'listSyncOperationSteps', 'listSyncOperationCompletions'];
    names.push('scrumHistoryCompletions', 'scrumHistoryRequests');
    const id = db.uid('private-sync');
    for (const name of names) db.insertOne(name, { _id: id, marker: 'private recovery evidence' });
    try {
      const result = await page.evaluate(async ({ names, id }) => {
        const errors = [];
        for (const name of names) {
          for (const [method, args] of [['insert', [{ _id: `${id}-forged` }]],
            ['update', [id, { $set: { marker: 'forged' } }]], ['remove', [id]]]) {
            try { await Meteor.callAsync(`/${name}/${method}`, ...args); errors.push('accepted'); }
            catch (error) { errors.push(error.error); }
          }
        }
        return { errors, visible: names.some(name => Meteor.connection._stores[name]?._getCollection?.().findOne(id)) };
      }, { names, id });
      expect(result.errors).toEqual(Array(names.length * 3).fill(403));
      expect(result.visible).toBe(false);
      for (const name of names) {
        expect(db.findOne(name, { _id: id }).marker).toBe('private recovery evidence');
        expect(db.findOne(name, { _id: `${id}-forged` })).toBeNull();
      }
    } finally {
      for (const name of names) db.deleteMany(name, { _id: { $in: [id, `${id}-forged`] } });
    }
  });
}

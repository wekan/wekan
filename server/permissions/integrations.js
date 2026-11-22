import Boards from '/models/boards';
import Integrations from '/models/integrations';
import { allowIsBoardAdmin } from '/server/lib/utils';
import { denyBoardRepoint } from '/server/lib/boardRepointGuard';

const permissionHelper = {
  async allow(userId, doc) {
    const user = await Meteor.users.findOneAsync(userId);
    const isAdmin = user && user.isAdmin;
    return isAdmin || allowIsBoardAdmin(userId, await Boards.findOneAsync(doc.boardId));
  },
};
Integrations.allow({
  async insert(userId, doc) {
    return await permissionHelper.allow(userId, doc);
  },
  async update(userId, doc) {
    return await permissionHelper.allow(userId, doc);
  },
  async remove(userId, doc) {
    return await permissionHelper.allow(userId, doc);
  },
  fetch: ['boardId'],
});

// RepointBleed: the allow rule above checks the board the document is on now;
// this refuses an update that moves it to another board.
Integrations.deny(denyBoardRepoint('integrations'));

// Admin Panel / Settings / Features / Turn off all webhooks
// (models/lib/webhooksSwitch.js): while it is on, no client adds or changes a
// webhook - the board menu's Outgoing Webhooks, Global Webhooks and the Bots
// view are hidden then, so a write is an attempt and is recorded. A remove is
// the cleanup and is never refused.
Integrations.deny({
  async insert(userId, doc) {
    const { webhooksOff, recordWebhookWriteRefused } = require('/server/webhooksSwitch');
    if (!(await webhooksOff())) return false;
    recordWebhookWriteRefused({ userId, source: 'ddp:integrations.insert',
      detail: `Added a webhook to ${doc && doc.boardId} while webhooks are turned off.` });
    return true;
  },
  async update(userId, doc) {
    const { webhooksOff, recordWebhookWriteRefused } = require('/server/webhooksSwitch');
    if (!(await webhooksOff())) return false;
    recordWebhookWriteRefused({ userId, source: 'ddp:integrations.update',
      detail: `Changed webhook ${doc && doc._id} while webhooks are turned off.` });
    return true;
  },
  fetch: ['boardId'],
});

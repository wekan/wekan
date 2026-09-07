import Boards from '/models/boards';
import Integrations from '/models/integrations';
import { allowIsBoardAdmin } from '/server/lib/utils';

const permissionHelper = {
  async allow(userId, doc) {
    // Global webhooks carry instance-wide authority and URLs which require the
    // server's DNS-aware SSRF validation. They may only be changed through
    // saveAdminGlobalWebhook, never through client collection writes.
    if (doc.boardId === Integrations.Const.GLOBAL_WEBHOOK_ID) return false;
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

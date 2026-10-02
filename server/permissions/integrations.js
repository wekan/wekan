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

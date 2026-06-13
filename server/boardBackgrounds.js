import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import Boards from '/models/boards';

// Delete a board background (a board-level Attachment). Needs an async
// board-admin check, so it is a method rather than an `allow` rule.
Meteor.methods({
  async removeBoardBackground(attachmentId) {
    check(attachmentId, String);
    if (!this.userId) {
      throw new Meteor.Error('error-notAuthorized');
    }
    const attachment = await Attachments.collection.findOneAsync(attachmentId);
    if (!attachment) {
      throw new Meteor.Error('error-attachment-doesNotExist');
    }
    const boardId = attachment.meta && attachment.meta.boardId;
    const board = boardId && (await ReactiveCache.getBoard(boardId));
    const user = await ReactiveCache.getUser(this.userId);
    const isAdmin =
      board &&
      ((board.hasAdmin && board.hasAdmin(this.userId)) || (user && user.isAdmin));
    if (!isAdmin) {
      throw new Meteor.Error('error-notAuthorized');
    }
    // If this background is the board's active one, clear it.
    if (board.backgroundImageId === attachmentId) {
      await Boards.updateAsync(boardId, {
        $set: { backgroundImageId: '', backgroundImageURL: '' },
      });
    }
    await Attachments.removeAsync(attachmentId);
    return true;
  },
});

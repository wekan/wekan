import AttachmentMigrationStatus from '/models/attachmentMigrationStatus';
import Boards from '/models/boards';
import Users from '/models/users';

// Publish attachment migration status for boards user has access to
Meteor.publish('attachmentMigrationStatus', async function(boardId) {
  if (!this.userId) {
    return this.ready();
  }

  check(boardId, String);

  const board = await Boards.findOneAsync(boardId);
  if (!board || !board.isVisibleBy({ _id: this.userId })) {
    return this.ready();
  }

  // Publish migration status for this board
  return AttachmentMigrationStatus.find({ boardId });
});

// Publish all attachment migration statuses for user's boards
Meteor.publish('attachmentMigrationStatuses', async function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = await Users.findOneAsync(this.userId);
  if (!user) {
    return this.ready();
  }

  // Get all boards user has access to
  // StaleBleed sibling (2026-10-02): only boards the user is an ACTIVE member
  // of (a dotted 'members.userId' also matched boards they were removed from),
  // and the boards a signed-in user reads without membership (public and
  // instance - `isPublic` does not exist).
  const { withoutMembershipSelectors } = require('/models/lib/boardPermission');
  const boards = await Boards.find({
    $or: [
      { members: { $elemMatch: { userId: this.userId, isActive: true } } },
      ...withoutMembershipSelectors(true),
    ],
  }, { fields: { _id: 1 } }).fetchAsync();

  const boardIds = boards.map(b => b._id);

  // Publish migration status for all user's boards
  return AttachmentMigrationStatus.find({ boardId: { $in: boardIds } });
});

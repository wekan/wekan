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
  const boards = await Boards.find({
    $or: [
      { 'members.userId': this.userId },
      { isPublic: true }
    ]
  }, { fields: { _id: 1 } }).fetchAsync();

  const boardIds = boards.map(b => b._id);

  // Publish migration status for all user's boards
  return AttachmentMigrationStatus.find({ boardId: { $in: boardIds } });
});

import Boards from '/models/boards';
import CustomFields from '/models/customFields';
import { allowIsAnyBoardMemberWithWriteAccess } from '/server/lib/utils';

// ReadOnly / CommentOnly / Worker members must not be able to create, modify or
// delete Custom Fields (which define board-wide schema). Use the write-access
// variant, not bare membership — the same read-only-write privilege escalation
// class as GHSA-6733 (which fixed the REST path; this is the allow/deny path).
CustomFields.allow({
  async insert(userId, doc) {
    const boards = await Boards.find({
      _id: { $in: doc.boardIds },
    }).fetchAsync();
    if (!allowIsAnyBoardMemberWithWriteAccess(userId, boards)) {
      return false;
    }
    // #3141: creating a field with `adminOnly: true` already set is the same
    // grant as toggling it afterwards - only a board admin may do it.
    if (doc.adminOnly) {
      return boards.some(board => board && board.hasAdmin(userId));
    }
    return true;
  },
  async update(userId, doc, fields) {
    const boards = await Boards.find({
      _id: { $in: doc.boardIds },
    }).fetchAsync();
    if (!allowIsAnyBoardMemberWithWriteAccess(userId, boards)) {
      return false;
    }
    // #3141: the "Admin only" flag itself may only be toggled by a board
    // admin - it decides who else may see or edit the field's value, so a
    // non-admin write-access member (a normal board member) must not be able
    // to grant themselves that gate by simply not turning it on for anyone.
    if (fields && fields.includes('adminOnly')) {
      return boards.some(board => board && board.hasAdmin(userId));
    }
    return true;
  },
  async remove(userId, doc) {
    return allowIsAnyBoardMemberWithWriteAccess(
      userId,
      await Boards.find({
        _id: { $in: doc.boardIds },
      }).fetchAsync(),
    );
  },
  fetch: ['userId', 'boardIds'],
});

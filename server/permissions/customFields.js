import Boards from '/models/boards';
import CustomFields from '/models/customFields';
import { allowIsAnyBoardMemberWithWriteAccess } from '/server/lib/utils';

// ReadOnly / CommentOnly / Worker members must not be able to create, modify or
// delete Custom Fields (which define board-wide schema). Use the write-access
// variant, not bare membership — the same read-only-write privilege escalation
// class as GHSA-6733 (which fixed the REST path; this is the allow/deny path).
CustomFields.allow({
  async insert(userId, doc) {
    return allowIsAnyBoardMemberWithWriteAccess(
      userId,
      await Boards.find({
        _id: { $in: doc.boardIds },
      }).fetchAsync(),
    );
  },
  async update(userId, doc) {
    return allowIsAnyBoardMemberWithWriteAccess(
      userId,
      await Boards.find({
        _id: { $in: doc.boardIds },
      }).fetchAsync(),
    );
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

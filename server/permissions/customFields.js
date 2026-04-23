import Boards from '/models/boards';
import CustomFields from '/models/customFields';
import { allowIsAnyBoardMember } from '/server/lib/utils';

CustomFields.allow({
  async insert(userId, doc) {
    return allowIsAnyBoardMember(
      userId,
      await Boards.find({
        _id: { $in: doc.boardIds },
      }).fetchAsync(),
    );
  },
  async update(userId, doc) {
    return allowIsAnyBoardMember(
      userId,
      await Boards.find({
        _id: { $in: doc.boardIds },
      }).fetchAsync(),
    );
  },
  async remove(userId, doc) {
    return allowIsAnyBoardMember(
      userId,
      await Boards.find({
        _id: { $in: doc.boardIds },
      }).fetchAsync(),
    );
  },
  fetch: ['userId', 'boardIds'],
});

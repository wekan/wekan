import Boards from '/models/boards';
import Triggers from '/models/triggers';
import { allowIsBoardAdmin } from '/server/lib/utils';

Triggers.allow({
  async insert(userId, doc) {
    return allowIsBoardAdmin(userId, await Boards.findOneAsync(doc.boardId));
  },
  async update(userId, doc) {
    return allowIsBoardAdmin(userId, await Boards.findOneAsync(doc.boardId));
  },
  async remove(userId, doc) {
    return allowIsBoardAdmin(userId, await Boards.findOneAsync(doc.boardId));
  },
});

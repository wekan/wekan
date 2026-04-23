import Actions from '/models/actions';
import Boards from '/models/boards';
import { allowIsBoardAdmin } from '/server/lib/utils';

Actions.allow({
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

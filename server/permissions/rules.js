import Boards from '/models/boards';
import Rules from '/models/rules';
import { allowIsBoardAdmin } from '/server/lib/utils';
import { denyBoardRepoint } from '/server/lib/boardRepointGuard';

Rules.allow({
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

// RepointBleed: the allow rule above checks the board the document is on now;
// this refuses an update that moves it to another board.
Rules.deny(denyBoardRepoint('rules'));

import Boards from '/models/boards';
import Rules from '/models/rules';
import { allowIsBoardAdmin } from '/server/lib/utils';
import { denyBoardRepoint, denyForeignRuleTriggers } from '/server/lib/boardRepointGuard';
import Triggers from '/models/triggers';

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
// ...and one that names another board's trigger.
Rules.deny(denyForeignRuleTriggers(id => Triggers.findOneAsync(id, { fields: { boardId: 1 } })));

import Attachments from '/models/attachments';
import CardCommentReactions from '/models/cardCommentReactions';
import CardComments from '/models/cardComments';
import CardTextNotes from '/models/cardTextNotes';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';

const { cardChildBoardWrites } = require('/models/lib/cardChildrenBoard');

// #6793: make a card's comments, reactions, text notes, checklists, checklist
// items and attachments follow the card when it moves, so the board publication
// - which finds them by their denormalized board id - shows them on the board
// the card is on now rather than on the one it left.
//
// Called by the Cards.after.update hook in server/models/cards.js, which every
// move path that writes through the collection reaches (the client's
// Card.move(), Move Card / Move to board, rules, undo, moving a list or swimlane
// to another board); by the REST card move, whose `.direct` write skips that
// hook; and by the durable rule move in server/notifications/storedRulePlans.js,
// which defers the hooks' bookkeeping and replays it idempotently.
//
// `.direct` skips the children's own update hooks: their content did not
// change, so a moved comment must not log an "edited comment" activity.
//
// Resolved at call time, not at import: these models import each other, and an
// import cycle can leave a binding undefined while this module is evaluated.
const collectionFor = model => ({
  CardComments,
  CardCommentReactions,
  CardTextNotes,
  Checklists,
  ChecklistItems,
  Attachments: Attachments.collection,
})[model];

export async function syncCardChildrenBoard(cardId, place, previous) {
  for (const write of cardChildBoardWrites(cardId, place, previous)) {
    const collection = collectionFor(write.model);
    try {
      const target = collection.direct || collection;
      await target.updateAsync(write.selector, write.modifier, { multi: true });
    } catch (error) {
      // One collection failing must not leave the others behind on the old
      // board, nor fail a move that has already been written.
      console.error(`[cardChildrenBoardSync] ${write.model} did not follow card ${cardId}:`, error);
    }
  }
}

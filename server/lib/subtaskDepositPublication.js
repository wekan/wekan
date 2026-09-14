import Cards from '/models/cards';
import CardComments from '/models/cardComments';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import CardTextNotes from '/models/cardTextNotes';
import Attachments from '/models/attachments';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

// These cursors sit BELOW a reactive, visibility-filtered Boards cursor. Losing
// destination visibility removes its entire subtree, rather than leaving a
// snapshot of permission attached to a long-lived cards cursor.
export function subtaskDepositChildren(userId, isArchived, boardIsLazy) {
  const entries = [
    [Cards, 'boardId'], [CardComments, 'boardId'], [Checklists, 'boardId'],
    [ChecklistItems, 'boardId'], [CardTextNotes, 'boardId'], [Attachments, 'meta.boardId'],
  ];
  return entries.map(([collection, boardField]) => ({
    async find(deposit, sourceBoard) {
      if (await boardIsLazy(sourceBoard)) return null;
      const assigned = assignedOnlyCardScope(deposit, userId);
      let selector;
      if (collection === Cards) {
        selector = { boardId: deposit._id, archived: isArchived, ...assigned };
      } else if (assigned) {
        return null; // Assigned-only contents follow the reactive card cursor below.
      } else {
        selector = { [boardField]: deposit._id };
      }
      const result = collection.find(selector);
      return result.cursor || result;
    },
    children: collection === Cards ? entries.slice(1).map(([child]) => ({
      find(card, deposit) {
        if (!assignedOnlyCardScope(deposit, userId)) return null;
        const selector = {
          [child === Attachments ? 'meta.cardId' : 'cardId']: card._id,
        };
        const result = child.find(selector);
        return result.cursor || result;
      },
    })) : [],
  }));
}

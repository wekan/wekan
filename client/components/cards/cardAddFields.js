import './cardDetails.jade';
import { Utils } from '/client/lib/utils';

// docs/Features/Cards/Card-Fields.md: an opened card shows every field its
// board shows on cards, empty or not, less the Card Settings sections the
// board hides on Show on Card. The rules are models/lib/cardShownFields.js.
const f = require('/models/lib/cardShownFields');

// The board as its opened cards see it (cardShownFields.js boardForCard): the
// same for every card of the board, empty or not, so `data` (the card) does
// not change it - it is kept so the callers read as before.
export function cardBoardView(data) { // eslint-disable-line no-unused-vars
  return f.boardForCard(Utils.getCurrentBoard());
}

// The opened card and each of its section templates read `currentBoard`; this
// template-level helper answers before the global one, so every
// `currentBoard.allowsX` in them asks the card's view - and a template not
// listed here (the board, Card Settings itself) is unchanged. The minicard has
// its own (client/components/cards/minicard.js MINICARD_FIELD_TEMPLATES).
export const CARD_FIELD_TEMPLATES = Object.freeze([
  // One per Card Settings section the opened card draws (cardDetails.jade).
  'cardDetails', 'cardFieldSectionLabels', 'cardFieldSectionDate', 'cardFieldSectionMembers',
  'cardFieldSectionCard', 'cardFieldSectionTime', 'cardFieldSectionCustomFields',
  'cardFieldSectionVote', 'cardFieldSectionPoker', 'cardFieldSectionDescription', 'cardFieldSectionScrum',
  'cardFieldSectionChecklists', 'cardFieldSectionSubtasks', 'cardFieldSectionAttachments', 'cardCommentsSection',
]);
CARD_FIELD_TEMPLATES.forEach(name => {
  Template[name].helpers({
    currentBoard() {
      const tpl = Template.instance();
      return cardBoardView(tpl && tpl.data);
    },
  });
});

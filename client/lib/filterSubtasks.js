import { Session } from 'meteor/session';
import { Filter } from '/client/lib/filter';
import { Utils } from '/client/lib/utils';
import { getSidebarInstance } from '/client/features/sidebar/service';

// Filter: Subtasks - the board filtered to this card's subtasks, with the
// card closed so the board can be seen. Reached from the opened card's
// Subtasks hamburger and from Card Settings' Checklists pane
// (docs/Features/Cards/Card-Fields.md); it was in the card's actions menu.
export function filterSubtasksOf(card) {
  if (!card || !card._id || card.boardId !== Session.get('currentBoard')) return;
  Filter.parentId.reset();
  Filter.parentId.add(card._id);
  Filter.resetExceptions();
  Session.set('openCards', (Session.get('openCards') || []).filter(id => id !== card._id));
  if (Session.get('currentCard') === card._id) Session.set('currentCard', null);
  Session.set('popupCardId', null);
  Session.set('popupCardBoardId', null);
  Popup.close();
  Utils.goBoardId(card.boardId);
  getSidebarInstance().setView('filter');
}

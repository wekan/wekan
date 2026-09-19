import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { BoardSwimlaneListDialog } from '/client/lib/dialogWithBoardSwimlaneList';

/**
 * Extension of BoardSwimlaneListDialog that adds card selection.
 * Used by popup templates that need board + swimlane + list + card selectors.
 */
export class BoardSwimlaneListCardDialog extends BoardSwimlaneListDialog {
  constructor(tpl, callbacks = {}) {
    super(tpl, callbacks);
    this.selectedCardId = new ReactiveVar(this.cardOption.cardId || '');
  }

  getDefaultOption() {
    return {
      boardId: '',
      swimlaneId: '',
      listId: '',
      cardId: '',
    };
  }

  /** Override to also set cardId if available */
  setOption(boardId) {
    super.setOption(boardId);
    if (this.cardOption && this.cardOption.cardId && this.selectedCardId) {
      this.selectedCardId.set(this.cardOption.cardId);
    }
  }

  /** returns all available cards of the current list */
  cards() {
    const list = ReactiveCache.getList({
      _id: this.selectedListId.get(),
      boardId: this.selectedBoardId.get(),
    });
    const swimlaneId = this.selectedSwimlaneId.get();
    if (list && swimlaneId) {
      return list.cards(swimlaneId).sort((a, b) => a.sort - b.sort);
    } else {
      return [];
    }
  }

  /** returns if the card id was the last confirmed one */
  isDialogOptionCardId(cardId) {
    return this.selectedCardId.get() === cardId;
  }

}

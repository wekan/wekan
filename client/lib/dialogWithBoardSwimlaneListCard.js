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
    this.cardsLoading = new ReactiveVar(true);
    // #6917: the destination's cards come from a picker-owned subscription,
    // not from the `board` publication, which ships no cards at all for a
    // board that loads lazily (Card loading = lazy, or 'auto' above the
    // threshold). Subscribing inside the template's autorun stops the previous
    // list's subscription when another board, swimlane or list is chosen, and
    // the last one when the popup closes.
    this.tpl.autorun?.(() => {
      const boardId = this.selectedBoardId.get();
      const listId = this.selectedListId.get();
      const swimlaneId = this.selectedSwimlaneId.get();
      const request = (this._cardsRequest = (this._cardsRequest || 0) + 1);
      this.cardsLoading.set(true);
      if (!boardId || !listId || !swimlaneId) return;
      this.tpl.subscribe('destinationCards', boardId, listId, swimlaneId, {
        onReady: () => {
          if (this._disposed || request !== this._cardsRequest) return;
          // A remembered card is checked here, once this list's cards are
          // there - the board being ready says nothing about its cards.
          const cardId = this.selectedCardId.get();
          if (cardId && !this.cards().some(card => card._id === cardId)) {
            this.selectedCardId.set('');
          }
          this.cardsLoading.set(false);
        },
      });
    });
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
      // Unfiltered: the open board's Filter describes that board, and must not
      // empty the dropdown of the destination (#6917).
      return list.cardsUnfiltered(swimlaneId).sort((a, b) => a.sort - b.sort);
    } else {
      return [];
    }
  }

  /** returns if the card id was the last confirmed one */
  isDialogOptionCardId(cardId) {
    return this.selectedCardId.get() === cardId;
  }

}

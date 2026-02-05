import { ReactiveCache } from '/imports/reactiveCache';
import { DialogWithBoardSwimlaneList } from '/client/lib/dialogWithBoardSwimlaneList';

export class DialogWithBoardSwimlaneListCard extends DialogWithBoardSwimlaneList {
  constructor() {
    super();
    this.selectedCardId = new ReactiveVar('');
  }

  getDefaultOption(boardId) {
    const ret = {
      'boardId' : "",
      'swimlaneId' : "",
      'listId' : "",
      'cardId': "",
    }
    return ret;
  }

  onCreated() {
    super.onCreated();
    this.selectedCardId = new ReactiveVar('');
  }

  /** set the last confirmed dialog field values
   * @param boardId the current board id
   */
  setOption(boardId) {
    super.setOption(boardId);
    
    // Also set cardId if available
    if (this.cardOption && this.cardOption.cardId) {
      this.selectedCardId.set(this.cardOption.cardId);
    }
  }

  /** returns all available cards of the current list */
  cards() {
    const list = ReactiveCache.getList({_id: this.selectedListId.get(), boardId: this.selectedBoardId.get()});
    if (list) {
      return list.cards();
    } else {
      return [];
    }
  }

  /** returns if the card id was the last confirmed one
   * @param cardId check this card id
   * @return if the card id was the last confirmed one
   */
  isDialogOptionCardId(cardId) {
    let ret = this.cardOption.cardId == cardId;
    return ret;
  }

  /** get the board data from the server
   * @param boardId get the board data of this board id
   */
  getBoardData(boardId) {
    const self = this;
    Meteor.subscribe('board', boardId, false, {
      onReady() {
        const sameBoardId = self.selectedBoardId.get() == boardId;
        self.selectedBoardId.set(boardId);

        if (!sameBoardId) {
          // reset swimlane id
          self.setFirstSwimlaneId();

          // reset list id
          self.setFirstListId();
          
          // reset card id
          self.selectedCardId.set('');
        }
      },
    });
  }

  events() {
    return [
      {
        async 'click .js-done'() {
          const boardSelect = this.$('.js-select-boards')[0];
          const boardId = boardSelect.options[boardSelect.selectedIndex].value;

          const listSelect = this.$('.js-select-lists')[0];
          const listId = listSelect.options[listSelect.selectedIndex].value;

          const swimlaneSelect = this.$('.js-select-swimlanes')[0];
          const swimlaneId = swimlaneSelect.options[swimlaneSelect.selectedIndex].value;

          const cardSelect = this.$('.js-select-cards')[0];
          const cardId = cardSelect.options.length > 0 ? cardSelect.options[cardSelect.selectedIndex].value : null;

          const options = {
            'boardId' : boardId,
            'swimlaneId' : swimlaneId,
            'listId' : listId,
            'cardId': cardId,
          }
          try {
            await this.setDone(cardId, options);
          } catch (e) {
            console.error('Error in card dialog operation:', e);
          }
          Popup.back(2);
        },
        'change .js-select-boards'(event) {
          const boardId = $(event.currentTarget).val();
          this.getBoardData(boardId);
        },
        'change .js-select-swimlanes'(event) {
          this.selectedSwimlaneId.set($(event.currentTarget).val());
        },
        'change .js-select-lists'(event) {
          this.selectedListId.set($(event.currentTarget).val());
          // Reset card selection when list changes
          this.selectedCardId.set('');
        },
      },
    ];
  }
}

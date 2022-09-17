import { DialogWithBoardSwimlaneList } from '/client/lib/dialogWithBoardSwimlaneList';

export class DialogWithBoardSwimlaneListCard extends DialogWithBoardSwimlaneList {
  getDefaultOption(boardId) {
    const ret = {
      'boardId' : "",
      'swimlaneId' : "",
      'listId' : "",
      'cardId': "",
    }
    return ret;
  }

  /** returns if the card id was the last confirmed one
   * @param cardId check this card id
   * @return if the card id was the last confirmed one
   */
  isDialogOptionCardId(cardId) {
    let ret = this.cardOption.cardId == cardId;
    return ret;
  }

  /** returns all available cards of the current list */
  cards() {
    const list = Lists.findOne(this.selectedListId.get());
    let ret = [];
    if (list) {
      ret = list.cards(this.selectedSwimlaneId.get());
    }
    return ret;
  }

  events() {
    return [
      {
        'click .js-done'() {
          const boardSelect = this.$('.js-select-boards')[0];
          const boardId = boardSelect.options[boardSelect.selectedIndex].value;

          const listSelect = this.$('.js-select-lists')[0];
          const listId = listSelect.options[listSelect.selectedIndex].value;

          const swimlaneSelect = this.$('.js-select-swimlanes')[0];
          const swimlaneId = swimlaneSelect.options[swimlaneSelect.selectedIndex].value;

          const cardSelect = this.$('.js-select-cards')[0];
          const cardId = cardSelect.options[cardSelect.selectedIndex].value;

          const options = {
            'boardId' : boardId,
            'swimlaneId' : swimlaneId,
            'listId' : listId,
            'cardId': cardId,
          }
          this.setDone(cardId, options);
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
        },
      },
    ];
  }
}

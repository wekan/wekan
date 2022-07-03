export class DialogWithBoardSwimlaneList extends BlazeComponent {
  /** returns the card dialog options
   * @return Object with properties { boardId, swimlaneId, listId }
   */
  getDialogOptions() {
  }

  /** list is done
   * @param listId the selected list id
   * @param options the selected options (Object with properties { boardId, swimlaneId, listId })
   */
  setDone(listId, options) {
  }

  /** get the default options
   * @return the options
   */
  getDefaultOption(boardId) {
    const ret = {
      'boardId' : "",
      'swimlaneId' : "",
      'listId' : "",
    }
    return ret;
  }

  onCreated() {
    this.currentBoardId = Utils.getCurrentBoardId();
    this.selectedBoardId = new ReactiveVar(this.currentBoardId);
    this.selectedSwimlaneId = new ReactiveVar('');
    this.selectedListId = new ReactiveVar('');
    this.setOption(this.currentBoardId);
  }

  /** set the last confirmed dialog field values
   * @param boardId the current board id
   */
  setOption(boardId) {
    this.cardOption = this.getDefaultOption();

    let currentOptions = this.getDialogOptions();
    if (currentOptions && boardId && currentOptions[boardId]) {
      this.cardOption = currentOptions[boardId];
      if (this.cardOption.boardId &&
          this.cardOption.swimlaneId &&
          this.cardOption.listId
      )
      {
        this.selectedBoardId.set(this.cardOption.boardId)
        this.selectedSwimlaneId.set(this.cardOption.swimlaneId);
        this.selectedListId.set(this.cardOption.listId);
      }
    }
    this.getBoardData(this.selectedBoardId.get());
    if (!this.selectedSwimlaneId.get() || !Swimlanes.findOne({_id: this.selectedSwimlaneId.get(), boardId: this.selectedBoardId.get()})) {
      this.setFirstSwimlaneId();
    }
    if (!this.selectedListId.get() || !Lists.findOne({_id: this.selectedListId.get(), boardId: this.selectedBoardId.get()})) {
      this.setFirstListId();
    }
  }
  /** sets the first swimlane id */
  setFirstSwimlaneId() {
    try {
      const board = Boards.findOne(this.selectedBoardId.get());
      const swimlaneId = board.swimlanes().fetch()[0]._id;
      this.selectedSwimlaneId.set(swimlaneId);
    } catch (e) {}
  }
  /** sets the first list id */
  setFirstListId() {
    try {
      const board = Boards.findOne(this.selectedBoardId.get());
      const listId = board.lists().fetch()[0]._id;
      this.selectedListId.set(listId);
    } catch (e) {}
  }

  /** returns if the board id was the last confirmed one
   * @param boardId check this board id
   * @return if the board id was the last confirmed one
   */
  isDialogOptionBoardId(boardId) {
    let ret = this.cardOption.boardId == boardId;
    return ret;
  }

  /** returns if the swimlane id was the last confirmed one
   * @param swimlaneId check this swimlane id
   * @return if the swimlane id was the last confirmed one
   */
  isDialogOptionSwimlaneId(swimlaneId) {
    let ret = this.cardOption.swimlaneId == swimlaneId;
    return ret;
  }

  /** returns if the list id was the last confirmed one
   * @param listId check this list id
   * @return if the list id was the last confirmed one
   */
  isDialogOptionListId(listId) {
    let ret = this.cardOption.listId == listId;
    return ret;
  }

  /** returns all available board */
  boards() {
    const ret = Boards.find(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: Meteor.user().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 },
      },
    );
    return ret;
  }

  /** returns all available swimlanes of the current board */
  swimlanes() {
    const board = Boards.findOne(this.selectedBoardId.get());
    const ret = board.swimlanes();
    return ret;
  }

  /** returns all available lists of the current board */
  lists() {
    const board = Boards.findOne(this.selectedBoardId.get());
    const ret = board.lists();
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
          // reset swimlane id (for selection in cards())
          self.setFirstSwimlaneId();

          // reset list id (for selection in cards())
          self.setFirstListId();
        }
      },
    });
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

          const options = {
            'boardId' : boardId,
            'swimlaneId' : swimlaneId,
            'listId' : listId,
          }
          this.setDone(boardId, swimlaneId, listId, options);
          Popup.back(2);
        },
        'change .js-select-boards'(event) {
          const boardId = $(event.currentTarget).val();
          this.getBoardData(boardId);
        },
        'change .js-select-swimlanes'(event) {
          this.selectedSwimlaneId.set($(event.currentTarget).val());
        },
      },
    ];
  }
}


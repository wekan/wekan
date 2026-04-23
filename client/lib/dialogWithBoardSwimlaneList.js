import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';

/**
 * Helper class for popup dialogs that let users select a board, swimlane, and list.
 * Not a BlazeComponent — instantiated by each Template's onCreated callback.
 */
export class BoardSwimlaneListDialog {
  /**
   * @param {Blaze.TemplateInstance} tpl - the template instance
   * @param {Object} callbacks
   * @param {Function} callbacks.getDialogOptions - returns saved options from card/user
   * @param {Function} callbacks.setDone - performs the action (boardId, swimlaneId, listId, options)
   * @param {Function} [callbacks.getDefaultOption] - override default option shape
   */
  constructor(tpl, callbacks = {}) {
    this.tpl = tpl;
    this._getDialogOptions = callbacks.getDialogOptions || (() => undefined);
    this._setDone = callbacks.setDone || (() => {});
    if (callbacks.getDefaultOption) {
      this.getDefaultOption = callbacks.getDefaultOption;
    }

    this.currentBoardId = Utils.getCurrentBoardId();
    this.selectedBoardId = new ReactiveVar(this.currentBoardId);
    this.selectedSwimlaneId = new ReactiveVar('');
    this.selectedListId = new ReactiveVar('');
    this.setOption(this.currentBoardId);
  }

  /** get the default options
   * @return the options
   */
  getDefaultOption() {
    return {
      boardId: '',
      swimlaneId: '',
      listId: '',
    };
  }

  /** returns the card dialog options (delegates to callback) */
  getDialogOptions() {
    return this._getDialogOptions();
  }

  /** performs the done action (delegates to callback) */
  async setDone(...args) {
    return this._setDone(...args);
  }

  /** set the last confirmed dialog field values
   * @param boardId the current board id
   */
  setOption(boardId) {
    this.cardOption = this.getDefaultOption();

    const currentOptions = this.getDialogOptions();
    if (currentOptions && boardId && currentOptions[boardId]) {
      this.cardOption = currentOptions[boardId];
      if (
        this.cardOption.boardId &&
        this.cardOption.swimlaneId &&
        this.cardOption.listId
      ) {
        this.selectedBoardId.set(this.cardOption.boardId);
        this.selectedSwimlaneId.set(this.cardOption.swimlaneId);
        this.selectedListId.set(this.cardOption.listId);
      }
    }
    this.getBoardData(this.selectedBoardId.get());
    if (
      !this.selectedSwimlaneId.get() ||
      !ReactiveCache.getSwimlane({
        _id: this.selectedSwimlaneId.get(),
        boardId: this.selectedBoardId.get(),
      })
    ) {
      this.setFirstSwimlaneId();
    }
    if (
      !this.selectedListId.get() ||
      !ReactiveCache.getList({
        _id: this.selectedListId.get(),
        boardId: this.selectedBoardId.get(),
      })
    ) {
      this.setFirstListId();
    }
  }

  /** sets the first swimlane id */
  setFirstSwimlaneId() {
    try {
      const board = ReactiveCache.getBoard(this.selectedBoardId.get());
      const swimlaneId = board.swimlanes()[0]._id;
      this.selectedSwimlaneId.set(swimlaneId);
    } catch (e) {}
  }

  /** sets the first list id */
  setFirstListId() {
    try {
      const boardId = this.selectedBoardId.get();
      const swimlaneId = this.selectedSwimlaneId.get();
      const lists = this.getListsForBoardSwimlane(boardId, swimlaneId);
      const listId = lists[0] ? lists[0]._id : '';
      this.selectedListId.set(listId);
    } catch (e) {}
  }

  /** get lists filtered by board and swimlane */
  getListsForBoardSwimlane(boardId, swimlaneId) {
    if (!boardId) return [];
    const board = ReactiveCache.getBoard(boardId);
    if (!board) return [];

    const selector = {
      boardId,
      archived: false,
    };

    if (swimlaneId) {
      const defaultSwimlane =
        board.getDefaultSwimline && board.getDefaultSwimline();
      if (defaultSwimlane && defaultSwimlane._id === swimlaneId) {
        selector.swimlaneId = { $in: [swimlaneId, null, ''] };
      } else {
        selector.swimlaneId = swimlaneId;
      }
    }

    return ReactiveCache.getLists(selector, { sort: { sort: 1 } });
  }

  /** returns if the board id was the last confirmed one */
  isDialogOptionBoardId(boardId) {
    return this.cardOption.boardId == boardId;
  }

  /** returns if the swimlane id was the last confirmed one */
  isDialogOptionSwimlaneId(swimlaneId) {
    return this.cardOption.swimlaneId == swimlaneId;
  }

  /** returns if the list id was the last confirmed one */
  isDialogOptionListId(listId) {
    return this.cardOption.listId == listId;
  }

  /** returns all available boards */
  boards() {
    return ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 },
      },
    );
  }

  /** returns all available swimlanes of the current board */
  swimlanes() {
    const board = ReactiveCache.getBoard(this.selectedBoardId.get());
    return board.swimlanes();
  }

  /** returns all available lists of the current board */
  lists() {
    return this.getListsForBoardSwimlane(
      this.selectedBoardId.get(),
      this.selectedSwimlaneId.get(),
    );
  }

  /** Fix swimlane title translation issue for "Default" swimlane */
  isTitleDefault(title) {
    if (
      title.startsWith("key 'default") &&
      title.endsWith('returned an object instead of string.')
    ) {
      if (
        `${TAPi18n.__('defaultdefault')}`.startsWith("key 'default") &&
        `${TAPi18n.__('defaultdefault')}`.endsWith(
          'returned an object instead of string.',
        )
      ) {
        return 'Default';
      } else {
        return `${TAPi18n.__('defaultdefault')}`;
      }
    } else if (title === 'Default') {
      return `${TAPi18n.__('defaultdefault')}`;
    } else {
      return title;
    }
  }

  /** get the board data from the server */
  getBoardData(boardId) {
    const self = this;
    Meteor.subscribe('board', boardId, false, {
      onReady() {
        const sameBoardId = self.selectedBoardId.get() == boardId;
        self.selectedBoardId.set(boardId);

        if (!sameBoardId) {
          self.setFirstSwimlaneId();
          self.setFirstListId();
        }
      },
    });
  }

}

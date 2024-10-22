import { ReactiveCache } from '/imports/reactiveCache';

BlazeComponent.extendComponent({
  onCreated() {
    this.subscribe('archivedBoards');
  },

  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },

  archivedBoards() {
    const ret = ReactiveCache.getBoards(
      { archived: true },
      {
        sort: { archivedAt: -1, modifiedAt: -1 },
      },
    );
    return ret;
  },

  events() {
    return [
      {
        'click .js-restore-board'() {
          // TODO : Make isSandstorm variable global
          const isSandstorm =
            Meteor.settings &&
            Meteor.settings.public &&
            Meteor.settings.public.sandstorm;
          if (isSandstorm && Utils.getCurrentBoardId()) {
            const currentBoard = Utils.getCurrentBoard();
            currentBoard.archive();
          }
          const board = this.currentData();
          board.restore();
          Utils.goBoardId(board._id);
        },
        'click .js-delete-board': Popup.afterConfirm('boardDelete', function() {
          Popup.back();
          const isSandstorm =
            Meteor.settings &&
            Meteor.settings.public &&
            Meteor.settings.public.sandstorm;
          if (isSandstorm && Utils.getCurrentBoardId()) {
            const currentBoard = Utils.getCurrentBoard();
            Boards.remove(currentBoard._id);
          }
          Boards.remove(this._id);
          FlowRouter.go('home');
        }),
      },
    ];
  },
}).register('archivedBoards');

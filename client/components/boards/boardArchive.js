import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

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
        async 'click .js-restore-board'() {
          // TODO : Make isSandstorm variable global
          const isSandstorm =
            Meteor.settings &&
            Meteor.settings.public &&
            Meteor.settings.public.sandstorm;
          if (isSandstorm && Utils.getCurrentBoardId()) {
            const currentBoard = Utils.getCurrentBoard();
            await currentBoard.archive();
          }
          const board = this.currentData();
          await board.restore();
          Utils.goBoardId(board._id);
        },
        'click .js-delete-board': Popup.afterConfirm('boardDelete', async function() {
          Popup.back();
          const isSandstorm =
            Meteor.settings &&
            Meteor.settings.public &&
            Meteor.settings.public.sandstorm;
          if (isSandstorm && Utils.getCurrentBoardId()) {
            const currentBoard = Utils.getCurrentBoard();
            await Boards.removeAsync(currentBoard._id);
          }
          await Boards.removeAsync(this._id);
          FlowRouter.go('home');
        }),
      },
    ];
  },
}).register('archivedBoards');

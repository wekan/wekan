import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Boards from '/models/boards';
import { Utils } from '/client/lib/utils';

const ARCHIVED_BOARDS_PER_PAGE = 30;

Template.archivedBoards.onCreated(function () {
  // Server-side pagination: only the current page of archived boards is ever
  // published/loaded, so a long-lived instance's archive stays fast.
  this.page = new ReactiveVar(1);
  this.total = new ReactiveVar(0);
  this.searchQuery = new ReactiveVar('');
  this.autorun(() => {
    const searchTerm = this.searchQuery.get();
    const skip = (this.page.get() - 1) * ARCHIVED_BOARDS_PER_PAGE;
    this.subscribe('archivedBoards', searchTerm, ARCHIVED_BOARDS_PER_PAGE, skip);
    Meteor.call('getArchivedBoardsCount', searchTerm, (err, count) => {
      if (!err) this.total.set(count || 0);
    });
  });
});

Template.archivedBoards.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
  },

  archivedBoards() {
    // Only the current page is in minimongo (the publication is limited).
    return ReactiveCache.getBoards(
      { archived: true },
      { sort: { archivedAt: -1, modifiedAt: -1 } },
    );
  },

  currentPage() { return Template.instance().page.get(); },
  totalPages() { return Math.max(1, Math.ceil((Template.instance().total.get() || 0) / ARCHIVED_BOARDS_PER_PAGE)); },
  hasPrevPage() { return Template.instance().page.get() > 1; },
  hasNextPage() {
    const tpl = Template.instance();
    return tpl.page.get() < Math.max(1, Math.ceil((tpl.total.get() || 0) / ARCHIVED_BOARDS_PER_PAGE));
  },
});

Template.archivedBoards.events({
  'keydown .js-archived-boards-search'(event, tpl) {
    if (event.keyCode === 13) {
      event.preventDefault();
      tpl.searchQuery.set(tpl.$('.js-archived-boards-search').val() || '');
      tpl.page.set(1);
    }
  },
  'click .js-archived-boards-prev-page'(event, tpl) {
    event.preventDefault();
    const current = tpl.page.get();
    if (current > 1) tpl.page.set(current - 1);
  },
  'click .js-archived-boards-next-page'(event, tpl) {
    event.preventDefault();
    const total = tpl.total.get() || 0;
    const totalPages = Math.max(1, Math.ceil(total / ARCHIVED_BOARDS_PER_PAGE));
    const current = tpl.page.get();
    if (current < totalPages) tpl.page.set(current + 1);
  },
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
    const board = this;
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
});

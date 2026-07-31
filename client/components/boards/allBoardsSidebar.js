import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { BoardMultiSelection } from '/client/lib/boardMultiSelection';
import { allBoardsSearchVar } from '/client/lib/allBoardsView';
import {
  allBoardsSidebarView,
  isAllBoardsSidebarOpen,
  openAllBoardsSidebar,
  closeAllBoardsSidebar,
} from '/client/lib/allBoardsSidebar';
import {
  SIDEBAR_HOME,
  SIDEBAR_SEARCH,
  SIDEBAR_MULTISELECTION,
  sidebarViewTitleKey,
  sidebarViewTemplate,
} from '/models/lib/allBoardsSidebar';
import { selectedStarTitleKey, selectedStarAction } from '/models/lib/selectedStars';

// The All Boards right sidebar. Its shell mirrors the board sidebar's; what it
// shows is this page's own. docs/Design/Page/Search.md,
// docs/Design/Page/Multi-Selection.md

Template.allBoardsSidebar.helpers({
  isSidebarOpen() {
    return isAllBoardsSidebarOpen();
  },
  sidebarViewTemplate() {
    return sidebarViewTemplate(allBoardsSidebarView());
  },
  // Home has no title and no back arrow: there is nothing behind it.
  sidebarViewTitle() {
    const key = sidebarViewTitleKey(allBoardsSidebarView());
    return key ? TAPi18n.__(key) : null;
  },
});

Template.allBoardsSidebar.events({
  'click .js-close-all-boards-sidebar'(evt) {
    evt.preventDefault();
    closeAllBoardsSidebar();
  },
  'click .js-all-boards-sidebar-home'(evt) {
    evt.preventDefault();
    openAllBoardsSidebar(SIDEBAR_HOME);
  },
});

Template.allBoardsHomeSidebar.helpers({
  canModifyBoards() {
    const currentUser = ReactiveCache.getCurrentUser();
    return currentUser && !currentUser.isCommentOnly();
  },
});

Template.allBoardsHomeSidebar.events({
  'click .js-all-boards-sidebar-search'(evt) {
    evt.preventDefault();
    openAllBoardsSidebar(SIDEBAR_SEARCH);
  },
  'click .js-all-boards-sidebar-multiselection'(evt) {
    evt.preventDefault();
    BoardMultiSelection.activate();
    openAllBoardsSidebar(SIDEBAR_MULTISELECTION);
  },
});

Template.allBoardsSearchSidebar.helpers({
  boardSearch() {
    return allBoardsSearchVar.get();
  },
});

// The search term is the page's, not this template's: the board list behind the
// sidebar filters as you type, which is what the header bar's search field did
// before it became a sidebar view.
Template.allBoardsSearchSidebar.events({
  'input .js-board-search-input'(evt) {
    allBoardsSearchVar.set(evt.currentTarget.value);
  },
  'keydown .js-board-search-input'(evt) {
    if (evt.key === 'Escape') {
      // Clear first, close second: Escape on a search box that has text in it
      // means "undo the search", and only an already-empty box falls through to
      // the sidebar's own Escape.
      if (allBoardsSearchVar.get()) {
        evt.preventDefault();
        evt.stopPropagation();
        allBoardsSearchVar.set('');
        evt.currentTarget.value = '';
      }
    }
  },
  'click .js-board-search-clear'(evt, tpl) {
    evt.preventDefault();
    allBoardsSearchVar.set('');
    const input = tpl.find('.js-board-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  },
});

// What the "Selected: ★" row would do if clicked right now, and to which
// boards. The same function the header bar used - see models/lib/selectedStars.
function currentSelectedStarAction() {
  const user = ReactiveCache.getCurrentUser();
  return selectedStarAction(BoardMultiSelection.getSelectedBoardIds(), id =>
    Boolean(user && user.hasStarred(id)),
  );
}

Template.allBoardsMultiSelectionSidebar.helpers({
  hasBoardsSelected() {
    return BoardMultiSelection.count() > 0;
  },
  selectedStarTitle() {
    return TAPi18n.__(selectedStarTitleKey(currentSelectedStarAction().action));
  },
});

Template.allBoardsMultiSelectionSidebar.events({
  // Only the boards that must CHANGE are toggled: toggleBoardStar flips one
  // board, so calling it for an already-starred one in the mixed case would
  // un-star it.
  'click .js-star-selected'(evt) {
    evt.preventDefault();
    currentSelectedStarAction().boardIds.forEach((id) => {
      Meteor.call('toggleBoardStar', id);
    });
  },
  'click .js-home-selected'(evt) {
    evt.preventDefault();
    const ids = BoardMultiSelection.getSelectedBoardIds();
    if (ids.length) {
      Meteor.call('toggleDefaultBoard', ids[0]);
    }
  },
  'click .js-archive-selected-boards'(evt) {
    evt.preventDefault();
    const selectedBoards = BoardMultiSelection.getSelectedBoardIds();
    if (
      selectedBoards.length > 0 &&
      confirm(TAPi18n.__('archive-board-confirm'))
    ) {
      selectedBoards.forEach((boardId) => {
        Meteor.call('archiveBoard', boardId, (err) => {
          if (err) alert(err?.reason || err?.message || 'Failed to archive board');
        });
      });
      BoardMultiSelection.reset();
    }
  },
  'click .js-duplicate-selected-boards'(evt) {
    evt.preventDefault();
    const selectedBoards = BoardMultiSelection.getSelectedBoardIds();
    if (
      selectedBoards.length > 0 &&
      confirm(TAPi18n.__('duplicate-board-confirm'))
    ) {
      selectedBoards.forEach((boardId) => {
        const board = ReactiveCache.getBoard(boardId);
        if (board) {
          Meteor.call(
            'copyBoard',
            boardId,
            {
              sort: ReactiveCache.getBoards({ archived: false }).length,
              type: 'board',
              title: board.title,
            },
            (err) => {
              if (err) console.error(err);
            },
          );
        }
      });
      BoardMultiSelection.reset();
    }
  },
  'click .js-multiselection-reset'(evt) {
    evt.preventDefault();
    BoardMultiSelection.disable();
  },
});

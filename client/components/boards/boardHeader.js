import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
const { allBoardsPath, SECTION_ARCHIVE } = require('/models/lib/allBoardsUrls');
import dragscroll from '@wekanteam/dragscroll';
import getSlug from 'limax';
import Boards from '/models/boards';
import Swimlanes from '/models/swimlanes';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { Filter } from '/client/lib/filter';
// Which way a button that opens a sidebar view goes on a click - one answer,
// in one place, for both Filter and Search.
import {
  SIDEBAR_VIEW_CLOSE,
  sidebarViewButtonAction,
} from '/models/lib/sidebarViewButton';
import { MultiSelection } from '/client/lib/multiSelection';
import { getSidebarInstance } from '/client/features/sidebar/service';
import { Utils } from '/client/lib/utils';

/*
const DOWNCLS = 'fa-sort-down';
const UPCLS = 'fa-sort-up';
*/
const sortCardsBy = new ReactiveVar('');

// Persist the card sort so it survives a page reload. Session is in-memory and
// is reset on reload, which is why "sort by due date" kept reverting to the
// default. See https://github.com/wekan/wekan/issues/5886
const CARDS_SORT_BY_STORAGE_KEY = 'wekan-cards-sortBy';
function setCardsSortBy(sortBy) {
  Session.set('sortBy', sortBy);
  try {
    if (sortBy) {
      window.localStorage.setItem(CARDS_SORT_BY_STORAGE_KEY, JSON.stringify(sortBy));
    } else {
      window.localStorage.removeItem(CARDS_SORT_BY_STORAGE_KEY);
    }
  } catch (e) {}
}

Template.boardChangeTitlePopup.events({
  async submit(event, templateInstance) {
    event.preventDefault();
    const newTitle = templateInstance
      .$('.js-board-name')
      .val()
      .trim();
    const newDesc = templateInstance
      .$('.js-board-desc')
      .val()
      .trim();
    if (newTitle) {
      // The board this popup was opened FOR, when it was opened for one: the
      // All Boards Table view opens this same popup from a row whose data
      // context is that row's board (docs/Design/Page/All-Boards.md), and on
      // that page there is no "current board" at all. The board header opens it
      // with the current board as its context, so that side is unchanged.
      const context = Template.currentData();
      const board =
        context && context._id && typeof context.rename === 'function'
          ? context
          : Utils.getCurrentBoard();
      if (board) {
        await board.rename(newTitle);
        await board.setDescription(newDesc);
      }
      Popup.back();
    }
  },
});

Template.boardHeaderButtons.onCreated(function () {
  Meteor.subscribe('tableVisibilityModeSettings');
  // Restore the persisted card sort after a reload (Session is in-memory), so
  // both the sorting and the sort icon are remembered. See #5886.
  if (!Session.get('sortBy')) {
    try {
      const stored = window.localStorage.getItem(CARDS_SORT_BY_STORAGE_KEY);
      if (stored) {
        Session.set('sortBy', JSON.parse(stored));
      }
    } catch (e) {}
  }
});

Template.boardHeaderButtons.helpers({
  notDisplayThisBoard() {
    const allowPrivateVisibilityOnly = TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly');
    const currentBoard = Utils.getCurrentBoard();
    return (
      allowPrivateVisibilityOnly !== undefined &&
      allowPrivateVisibilityOnly.booleanValue &&
      currentBoard &&
      currentBoard.permission === 'public'
    );
  },

  watchLevel() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard && currentBoard.getWatchLevel(Meteor.userId());
  },

  boardView() {
    return Utils.boardView();
  },
  isSortActive() {
    return Session.get('sortBy') ? true : false;
  },
  // A Font Awesome class name for the active sort, not an emoji.
  sortCardsIcon() {
    const sortBy = Session.get('sortBy');
    if (!sortBy) {
      return 'fa-sort'; // nothing chosen
    }
    if (sortBy.dueAt) {
      return 'fa-clock-o'; // due date
    } else if (sortBy.title) {
      return 'fa-font'; // alphabetical
    } else if (sortBy.createdAt) {
      return sortBy.createdAt === 1 ? 'fa-arrow-up' : 'fa-arrow-down';
    }
    return 'fa-sort';
  },
});

// The board star, in its own template because the first header bar places it
// beside the starred-boards dropdown. A Blaze event map only sees events inside
// its own template, so its helpers and its click come with its markup.
Template.boardStarButton.helpers({
  isStarred() {
    const boardId = Session.get('currentBoard');
    const user = ReactiveCache.getCurrentUser();
    return user && user.hasStarred(boardId);
  },

  // Only show the star counter if the number of stars is greater than 2.
  showStarCounter() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard && currentBoard.stars >= 2;
  },

  currentBoard() {
    return Utils.getCurrentBoard();
  },
});

Template.boardStarButton.events({
  'click .js-star-board'() {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      Meteor.call('toggleBoardStar', boardId);
    }
  },
});

// Open the sidebar on `view`, or shut it when it is already showing that view.
// `mustStayOpen` is Filter's exception: see models/lib/sidebarViewButton.js.
function toggleSidebarView(view, mustStayOpen) {
  const sidebar = getSidebarInstance();
  if (!sidebar) {
    console.warn('Sidebar not available for setView');
    return;
  }
  // Open AND on this view: a sidebar open on Activities is showing neither, and
  // clicking either button there has to switch to it rather than close.
  const isShowingView = sidebar.isOpen() && sidebar.getView() === view;
  if (sidebarViewButtonAction(isShowingView, mustStayOpen) === SIDEBAR_VIEW_CLOSE) {
    sidebar.hide();
    return;
  }
  sidebar.setView(view);
}

Template.boardHeaderButtons.events({
  'click .js-edit-board-title': Popup.open('boardChangeTitle'),
  'click .js-change-visibility': Popup.open('boardChangeVisibility'),
  'click .js-watch-board': Popup.open('boardChangeWatch'),
  // Boards in Archive is a SECTION of All Boards, not a page of its own: the
  // row in its left menu. `/archive` is the full-width page that section
  // replaced. docs/Design/Page/Archive.md
  'click .js-open-archived-board'() {
    FlowRouter.go(allBoardsPath(SECTION_ARCHIVE, []));
  },
  // The button that opens the filter sidebar also shuts it. It only ever
  // opened, so a second click did nothing visible and the only way back was the
  // sidebar's own X - somewhere else on screen from the thing you just clicked.
  //
  // Not while a filter is ON, though: the sidebar is then the one place that
  // says what is being hidden from the board, and closing it would leave a
  // board showing a subset of its cards with nothing on screen to say so. The X
  // beside this button is what clears the filter.
  // models/lib/sidebarViewButton.js
  'click .js-open-filter-view'() {
    toggleSidebarView('filter', Filter.isActive());
  },
  'click .js-sort-cards': Popup.open('cardsSort'),
  /*
  'click .js-open-sort-view'(evt) {
    const target = evt.target;
    if (target.tagName === 'I') {
      // click on the text, popup choices
      this.changeDirection();
    } else {
      // change the sort order
      Popup.open('listsort')(evt);
    }
  },
  */
  'click .js-filter-reset'(event) {
    event.stopPropagation();
    const sidebar = getSidebarInstance();
    if (sidebar) {
      sidebar.setView();
    } else {
      console.warn('Sidebar not available for setView');
    }
    Filter.reset();
  },
  'click .js-sort-reset'() {
    setCardsSortBy('');
  },
  // Search shuts what it opened too, with no exception: its results are inside
  // the panel, so closing it hides nothing from the board the way closing an
  // active filter's panel would. models/lib/sidebarViewButton.js
  'click .js-open-search-view'() {
    toggleSidebarView('search', false);
  },
  'click .js-toggle-dependencies'() {
    const currentBoard = Utils.getCurrentBoard();
    if (currentBoard) {
      currentBoard.setShowDependencies(!currentBoard.showDependencies);
    }
  },
  'click .js-multiselection-activate'() {
    const currentCard = Utils.getCurrentCardId();
    MultiSelection.activate();
    if (currentCard) {
      MultiSelection.add(currentCard);
    }
  },
  'click .js-multiselection-reset'(event) {
    event.stopPropagation();
    MultiSelection.disable();
  },
  'click .js-log-in'() {
    FlowRouter.go('atSignIn');
  },
});

Template.boardChangeViewPopup.events({
  'click .js-open-lists-view'() {
    Utils.setBoardView('board-view-lists');
    Popup.back();
  },
  'click .js-open-swimlanes-view'() {
    Utils.setBoardView('board-view-swimlanes');
    Popup.back();
  },
  'click .js-open-cal-view'() {
    Utils.setBoardView('board-view-cal');
    Popup.back();
  },
  'click .js-open-gantt-view'() {
    Utils.setBoardView('board-view-gantt');
    Popup.back();
  },
  'click .js-open-table-view'() {
    Utils.setBoardView('board-view-table');
    Popup.back();
  },
  'click .js-open-stats-view'() {
    Utils.setBoardView('board-view-stats');
    Popup.back();
  },
  'click .js-open-map-view'() {
    Utils.setBoardView('board-view-map');
    Popup.back();
  },
});

// Shared setup for all create board popups
function setupCreateBoardState(tpl) {
  tpl.visibilityMenuIsOpen = new ReactiveVar(false);
  tpl.visibility = new ReactiveVar('private');
  tpl.boardId = new ReactiveVar('');
  // #5850: default to creating a regular board; the dedicated
  // createTemplateContainerPopup sets this true in its onRendered.
  Session.set('createBoardAsTemplate', false);
  Meteor.subscribe('tableVisibilityModeSettings');
}

function createBoardHelpers() {
  return {
    visibilityMenuIsOpen() {
      return Template.instance().visibilityMenuIsOpen.get();
    },
    visibility() {
      return Template.instance().visibility.get();
    },
    notAllowPrivateVisibilityOnly() {
      return !TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly')?.booleanValue;
    },
    visibilityCheck() {
      return Template.currentData() === Template.instance().visibility.get();
    },
  };
}

async function createBoardSubmit(tpl, event) {
  event.preventDefault();
  const title = tpl.find('.js-new-board-title').value;
  const slug = getSlug(title) || 'board';

  // #5850: template boards are created via the dedicated "Add Template Board"
  // flow (createTemplateContainerPopup), signalled by this Session flag, rather
  // than a checkbox on the generic Create Board popup. Consume it immediately.
  const addTemplateContainer = Session.get('createBoardAsTemplate') === true;
  Session.set('createBoardAsTemplate', false);
  if (addTemplateContainer) {
    tpl.boardId.set(
      await Meteor.callAsync('createBoardWithInitialSwimlanes', {
        title,
        slug,
        permission: 'private',
        type: 'template-container',
        migrationVersion: 1,
        swimlanes: [
          { title: 'Card Templates', sort: 1, type: 'template-container', role: 'card' },
          { title: 'List Templates', sort: 2, type: 'template-container', role: 'list' },
          { title: 'Board Templates', sort: 3, type: 'template-container', role: 'board' },
        ],
      }),
    );

    // Assign to space if one was selected
    const spaceId = Session.get('createBoardInWorkspace');
    if (spaceId) {
      Meteor.call('assignBoardToWorkspace', tpl.boardId.get(), spaceId, (err) => {
        if (err) console.error('Error assigning board to space:', err);
      });
      Session.set('createBoardInWorkspace', null); // Clear after use
    }

    FlowRouter.go('board', { id: tpl.boardId.get(), slug });

  } else {
    const visibility = tpl.visibility.get();

    tpl.boardId.set(
      await Meteor.callAsync('createBoardWithInitialSwimlanes', {
        title,
        slug,
        permission: visibility,
        migrationVersion: 1,
        swimlanes: [{ title: 'Default' }],
      }),
    );

    // Assign to space if one was selected
    const spaceId = Session.get('createBoardInWorkspace');
    if (spaceId) {
      Meteor.call('assignBoardToWorkspace', tpl.boardId.get(), spaceId, (err) => {
        if (err) console.error('Error assigning board to space:', err);
      });
      Session.set('createBoardInWorkspace', null); // Clear after use
    }

    FlowRouter.go('board', { id: tpl.boardId.get(), slug });
  }
}

function createBoardEvents() {
  return {
    'click .js-select-visibility'(event, tpl) {
      tpl.visibility.set(this);
      tpl.visibilityMenuIsOpen.set(false);
    },
    'click .js-change-visibility'(event, tpl) {
      tpl.visibilityMenuIsOpen.set(!tpl.visibilityMenuIsOpen.get());
    },
    async 'submit'(event, tpl) {
      await createBoardSubmit(tpl, event);
    },
    'click .js-import-board': Popup.open('chooseBoardSource'),
    'click .js-board-template': Popup.open('searchElement'),
  };
}

// createBoard (non-popup version)
Template.createBoard.onCreated(function () {
  setupCreateBoardState(this);
});

Template.createBoard.helpers(createBoardHelpers());

Template.createBoard.events(createBoardEvents());

// createBoardPopup
Template.createBoardPopup.onCreated(function () {
  setupCreateBoardState(this);
});

Template.createBoardPopup.helpers(createBoardHelpers());

Template.createBoardPopup.events(createBoardEvents());

// createTemplateContainerPopup
Template.createTemplateContainerPopup.onCreated(function () {
  setupCreateBoardState(this);
});

Template.createTemplateContainerPopup.onRendered(function () {
  // #5850: this dedicated popup always creates a template board.
  Session.set('createBoardAsTemplate', true);
});

Template.createTemplateContainerPopup.helpers(createBoardHelpers());

Template.createTemplateContainerPopup.events(createBoardEvents());

// headerBarCreateBoardPopup
Template.headerBarCreateBoardPopup.onCreated(function () {
  setupCreateBoardState(this);
});

Template.headerBarCreateBoardPopup.helpers(createBoardHelpers());

Template.headerBarCreateBoardPopup.events({
  'click .js-select-visibility'(event, tpl) {
    tpl.visibility.set(this);
    tpl.visibilityMenuIsOpen.set(false);
  },
  'click .js-change-visibility'(event, tpl) {
    tpl.visibilityMenuIsOpen.set(!tpl.visibilityMenuIsOpen.get());
  },
  async submit(event, tpl) {
    await createBoardSubmit(tpl, event);
    // Immediately star boards created with the headerbar popup.
    await ReactiveCache.getCurrentUser().toggleBoardStar(tpl.boardId.get());
  },
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-board-template': Popup.open('searchElement'),
});

Template.boardVisibilityList.helpers({
  notAllowPrivateVisibilityOnly() {
    return !TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly')?.booleanValue;
  },
});

Template.boardChangeVisibilityPopup.onCreated(function () {
  Meteor.subscribe('tableVisibilityModeSettings');
});

Template.boardChangeVisibilityPopup.helpers({
  notAllowPrivateVisibilityOnly(){
    return !TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly')?.booleanValue;
  },
  visibilityCheck() {
    const currentBoard = Utils.getCurrentBoard();
    return this === currentBoard.permission;
  },
});

Template.boardChangeVisibilityPopup.events({
  'click .js-select-visibility'() {
    const currentBoard = Utils.getCurrentBoard();
    const visibility = this;
    if (typeof visibility === 'string') {
      currentBoard.setVisibility(visibility);
      Popup.back();
    }
  },
});

Template.boardChangeWatchPopup.helpers({
  watchLevel() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.getWatchLevel(Meteor.userId());
  },

  watchCheck() {
    const currentBoard = Utils.getCurrentBoard();
    return this === currentBoard.getWatchLevel(Meteor.userId());
  },
});

Template.boardChangeWatchPopup.events({
  'click .js-select-watch'() {
    // `this` is the data context of the clicked row - the string from the
    // enclosing {{#with "watching"}}. Blaze can hand that back as a boxed
    // String, so read it through String() rather than refusing anything that is
    // not typeof 'string'.
    const level = this === null || this === undefined ? '' : String(this);
    if (!level) return;
    Meteor.call(
      'watch',
      'board',
      Session.get('currentBoard'),
      level,
      (err, ret) => {
        if (!err && ret) {
          Popup.back();
          return;
        }
        // AN ERROR MUST NOT BE SILENT. It was: the callback closed the popup on
        // success and did nothing at all otherwise, so a refusal looked exactly
        // like a broken button - "Silent does not respond. If we try to change
        // it does not change. Nothing happens." (email, 2026-08-13). The server
        // refuses for two reasons an admin can act on: the watch feature is
        // turned off in the Admin Panel, and the board is not visible to this
        // user.
        const reason = err && (err.error || err.reason || err.message);
        const message = reason === 'error-watch-disabled'
          ? TAPi18n.__('error-watch-disabled')
          : TAPi18n.__('error-board-notAMember');
        // eslint-disable-next-line no-alert
        if (typeof window !== 'undefined' && window.alert) window.alert(message);
        if (process.env.DEBUG === 'true') console.error('watch failed:', err);
      },
    );
  },
});

/*
// BlazeComponent.extendComponent was removed - this code is unused.
// Original listsortPopup component:
// {
  onCreated() {
    //this.sortBy = new ReactiveVar();
    ////this.sortDirection = new ReactiveVar();
    //this.setSortBy();
    this.downClass = DOWNCLS;
    this.upClass = UPCLS;
  },
  allowedSortValues() {
    const types = [];
    const pushed = {};
    ReactiveCache.getCurrentUser()
      .getListSortTypes()
      .forEach(type => {
        const key = type.replace(/^-/, '');
        if (pushed[key] === undefined) {
          types.push({
            name: key,
            label: `list-label-${key}`,
            shortLabel: `list-label-short-${key}`,
          });
          pushed[key] = 1;
        }
      });
    return types;
  },
  Direction() {
    return ReactiveCache.getCurrentUser().getListSortByDirection() === -1
      ? this.downClass
      : this.upClass;
  },
  sortby() {
    return ReactiveCache.getCurrentUser().getListSortBy();
  },

  setSortBy(type = null) {
    const user = ReactiveCache.getCurrentUser();
    if (type === null) {
      type = user._getListSortBy();
    } else {
      let value = '';
      if (type.map) {
        // is an array
        value = (type[1] === -1 ? '-' : '') + type[0];
      }
      Meteor.call('setListSortBy', value);
    }
    //this.sortBy.set(type[0]);
    //this.sortDirection.set(type[1]);
  },

  events() {
    return [
      {
        'click .js-sort-by'(evt) {
          evt.preventDefault();
          const target = evt.target;
          const sortby = target.getAttribute('name');
          const down = !!target.querySelector(`.${this.upClass}`);
          const direction = down ? -1 : 1;
          this.setSortBy([sortby, direction]);
          if (Utils.isMiniScreen) {
            Popup.back();
          }
        },
      },
    ];
  },
// }.register('listsortPopup');
*/

Template.cardsSortPopup.events({
  'click .js-sort-due'() {
    const sortBy = {
      dueAt: 1,
    };
    setCardsSortBy(sortBy);
    sortCardsBy.set(TAPi18n.__('due-date'));
    Popup.back();
  },
  'click .js-sort-title'() {
    const sortBy = {
      title: 1,
    };
    setCardsSortBy(sortBy);
    sortCardsBy.set(TAPi18n.__('title'));
    Popup.back();
  },
  'click .js-sort-created-asc'() {
    const sortBy = {
      createdAt: 1,
    };
    setCardsSortBy(sortBy);
    sortCardsBy.set(TAPi18n.__('date-created-newest-first'));
    Popup.back();
  },
  'click .js-sort-created-desc'() {
    const sortBy = {
      createdAt: -1,
    };
    setCardsSortBy(sortBy);
    sortCardsBy.set(TAPi18n.__('date-created-oldest-first'));
    Popup.back();
  },
});

// The board's view menu is its own template in the FIRST header bar now, so its
// handler is here rather than on the second bar that used to draw it.
// docs/Design/Page/Header.md
Template.boardViewMenu.events({
  'click .js-toggle-board-view': Popup.open('boardChangeView'),
});

Template.boardViewMenu.helpers({
  boardView() {
    return Utils.boardView();
  },
  // The tooltip: the name of the view that is ON. The button is icon only, so
  // this is the only place the name appears. docs/Design/Page/Header.md
  boardViewName() {
    const names = {
      'board-view-swimlanes': 'swimlanes',
      'board-view-lists': 'lists',
      'board-view-cal': 'calendar',
      'board-view-gantt': 'gantt',
      'board-view-table': 'board-view-table',
      'board-view-stats': 'board-view-stats',
      'board-view-map': 'board-view-map',
    };
    return TAPi18n.__(names[Utils.boardView()] || 'board-view');
  },
});

// The pencil is its own template in the first header bar, beside the board's
// name, so its click is handled here. docs/Design/Page/Header.md
Template.boardEditTitleButton.events({
  'click .js-edit-board-title': Popup.open('boardChangeTitle'),
});

import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import dragscroll from '@wekanteam/dragscroll';
import getSlug from 'limax';
import Boards from '/models/boards';
import Swimlanes from '/models/swimlanes';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { Filter } from '/client/lib/filter';
import { MultiSelection } from '/client/lib/multiSelection';
import { getSidebarInstance } from '/client/features/sidebar/service';
import { Utils } from '/client/lib/utils';

/*
const DOWNCLS = 'fa-sort-down';
const UPCLS = 'fa-sort-up';
*/
const sortCardsBy = new ReactiveVar('');

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
      const board = Utils.getCurrentBoard();
      if (board) {
        await board.rename(newTitle);
        await board.setDescription(newDesc);
      }
      Popup.back();
    }
  },
});

Template.boardHeaderBar.helpers({
  watchLevel() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard && currentBoard.getWatchLevel(Meteor.userId());
  },

  isStarred() {
    const boardId = Session.get('currentBoard');
    const user = ReactiveCache.getCurrentUser();
    return user && user.hasStarred(boardId);
  },

  // Only show the star counter if the number of star is greater than 2
  showStarCounter() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard && currentBoard.stars >= 2;
  },

  boardView() {
    return Utils.boardView();
  },
  isSortActive() {
    return Session.get('sortBy') ? true : false;
  },
  sortCardsIcon() {
    const sortBy = Session.get('sortBy');
    if (!sortBy) {
      return '🃏'; // Card icon when nothing is selected
    }

    // Determine which sort option is active based on sortBy object
    if (sortBy.dueAt) {
      return '📅'; // Due date icon
    } else if (sortBy.title) {
      return '🔤'; // Alphabet icon
    } else if (sortBy.createdAt) {
      return sortBy.createdAt === 1 ? '⬆️' : '⬇️'; // Up/down arrow based on direction
    }

    return '🃏'; // Default card icon
  },
});

Template.boardHeaderBar.events({
  'click .js-edit-board-title': Popup.open('boardChangeTitle'),
  'click .js-star-board'() {
    const boardId = Session.get('currentBoard');
    if (boardId) {
      Meteor.call('toggleBoardStar', boardId);
    }
  },
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click .js-change-visibility': Popup.open('boardChangeVisibility'),
  'click .js-watch-board': Popup.open('boardChangeWatch'),
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
  'click .js-toggle-board-view': Popup.open('boardChangeView'),
  'click .js-toggle-sidebar'() {
    if (process.env.DEBUG === 'true') {
      console.log('Hamburger menu clicked');
    }
    // Use the same approach as keyboard shortcuts
    const sidebar = getSidebarInstance();
    if (sidebar && typeof sidebar.toggle === 'function') {
      if (process.env.DEBUG === 'true') {
        console.log('Using Sidebar.toggle()');
      }
      sidebar.toggle();
    } else {
      if (process.env.DEBUG === 'true') {
        console.warn('Sidebar not available, trying alternative approach');
      }
      // Try to trigger the sidebar through the global Blaze helper
      if (typeof Blaze !== 'undefined' && Blaze._globalHelpers && Blaze._globalHelpers.Sidebar) {
        const blazeSidebar = Blaze._globalHelpers.Sidebar();
        if (blazeSidebar && typeof blazeSidebar.toggle === 'function') {
          if (process.env.DEBUG === 'true') {
            console.log('Using Blaze helper Sidebar.toggle()');
          }
          blazeSidebar.toggle();
        }
      }
    }
  },
  'click .js-open-filter-view'() {
    const sidebar = getSidebarInstance();
    if (sidebar) {
      sidebar.setView('filter');
    } else {
      console.warn('Sidebar not available for setView');
    }
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
    Session.set('sortBy', '');
  },
  'click .js-open-search-view'() {
    const sidebar = getSidebarInstance();
    if (sidebar) {
      sidebar.setView('search');
    } else {
      console.warn('Sidebar not available for setView');
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
});

// Shared setup for all create board popups
function setupCreateBoardState(tpl) {
  tpl.visibilityMenuIsOpen = new ReactiveVar(false);
  tpl.visibility = new ReactiveVar('private');
  tpl.boardId = new ReactiveVar('');
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
      return !TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
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

  const addTemplateContainer = $('#add-template-container.is-checked').length > 0;
  if (addTemplateContainer) {
    tpl.boardId.set(
      await Meteor.callAsync('createBoardWithInitialSwimlanes', {
        title,
        slug,
        permission: 'private',
        type: 'template-container',
        migrationVersion: 1,
        swimlanes: [
          { title: 'Card Templates', sort: 1, type: 'template-container' },
          { title: 'List Templates', sort: 2, type: 'template-container' },
          { title: 'Board Templates', sort: 3, type: 'template-container' },
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
      tpl.visibility.set(Template.currentData());
      tpl.visibilityMenuIsOpen.set(false);
    },
    'click .js-change-visibility'(event, tpl) {
      tpl.visibilityMenuIsOpen.set(!tpl.visibilityMenuIsOpen.get());
    },
    'click .js-import': Popup.open('boardImportBoard'),
    async 'submit'(event, tpl) {
      await createBoardSubmit(tpl, event);
    },
    'click .js-import-board': Popup.open('chooseBoardSource'),
    'click .js-board-template': Popup.open('searchElement'),
    'click .js-toggle-add-template-container'() {
      $('#add-template-container').toggleClass('is-checked');
    },
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
  // Always pre-check the template container checkbox for this popup
  $('#add-template-container').addClass('is-checked');
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
    tpl.visibility.set(Template.currentData());
    tpl.visibilityMenuIsOpen.set(false);
  },
  'click .js-change-visibility'(event, tpl) {
    tpl.visibilityMenuIsOpen.set(!tpl.visibilityMenuIsOpen.get());
  },
  'click .js-import': Popup.open('boardImportBoard'),
  async submit(event, tpl) {
    await createBoardSubmit(tpl, event);
    // Immediately star boards created with the headerbar popup.
    await ReactiveCache.getCurrentUser().toggleBoardStar(tpl.boardId.get());
  },
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-board-template': Popup.open('searchElement'),
  'click .js-toggle-add-template-container'() {
    $('#add-template-container').toggleClass('is-checked');
  },
});

Template.boardChangeVisibilityPopup.onCreated(function () {
  Meteor.subscribe('tableVisibilityModeSettings');
});

Template.boardChangeVisibilityPopup.helpers({
  notAllowPrivateVisibilityOnly(){
    return !TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
  },
  visibilityCheck() {
    const currentBoard = Utils.getCurrentBoard();
    return this === currentBoard.permission;
  },
});

Template.boardChangeVisibilityPopup.events({
  'click .js-select-visibility'() {
    const currentBoard = Utils.getCurrentBoard();
    const visibility = Template.currentData();
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
    const level = Template.currentData();
    if (typeof level === 'string') {
      Meteor.call(
        'watch',
        'board',
        Session.get('currentBoard'),
        level,
        (err, ret) => {
          if (!err && ret) Popup.back();
        },
      );
    }
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
    Session.set('sortBy', sortBy);
    sortCardsBy.set(TAPi18n.__('due-date'));
    Popup.back();
  },
  'click .js-sort-title'() {
    const sortBy = {
      title: 1,
    };
    Session.set('sortBy', sortBy);
    sortCardsBy.set(TAPi18n.__('title'));
    Popup.back();
  },
  'click .js-sort-created-asc'() {
    const sortBy = {
      createdAt: 1,
    };
    Session.set('sortBy', sortBy);
    sortCardsBy.set(TAPi18n.__('date-created-newest-first'));
    Popup.back();
  },
  'click .js-sort-created-desc'() {
    const sortBy = {
      createdAt: -1,
    };
    Session.set('sortBy', sortBy);
    sortCardsBy.set(TAPi18n.__('date-created-oldest-first'));
    Popup.back();
  },
});

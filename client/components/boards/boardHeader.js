import { TAPi18n } from '/imports/i18n';

/*
const DOWNCLS = 'fa-sort-down';
const UPCLS = 'fa-sort-up';
*/
const sortCardsBy = new ReactiveVar('');
Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-custom-fields'() {
    Sidebar.setView('customFields');
    Popup.back();
  },
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.back();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
  'click .js-delete-board': Popup.afterConfirm('deleteBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    Popup.back();
    Boards.remove(currentBoard._id);
    FlowRouter.go('home');
  }),
  'click .js-outgoing-webhooks': Popup.open('outgoingWebhooks'),
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-subtask-settings': Popup.open('boardSubtaskSettings'),
  'click .js-card-settings': Popup.open('boardCardSettings'),
  'click .js-minicard-settings': Popup.open('boardMinicardSettings'),
});

Template.boardChangeTitlePopup.events({
  submit(event, templateInstance) {
    const newTitle = templateInstance
      .$('.js-board-name')
      .val()
      .trim();
    const newDesc = templateInstance
      .$('.js-board-desc')
      .val()
      .trim();
    if (newTitle) {
      this.rename(newTitle);
      this.setDescription(newDesc);
      Popup.back();
    }
    event.preventDefault();
  },
});

BlazeComponent.extendComponent({
  watchLevel() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard && currentBoard.getWatchLevel(Meteor.userId());
  },

  isStarred() {
    const boardId = Session.get('currentBoard');
    const user = Meteor.user();
    return user && user.hasStarred(boardId);
  },

  // Only show the star counter if the number of star is greater than 2
  showStarCounter() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard && currentBoard.stars >= 2;
  },
  /*
  showSort() {
    return Meteor.user().hasSortBy();
  },
  directionClass() {
    return this.currentDirection() === -1 ? DOWNCLS : UPCLS;
  },
  changeDirection() {
    const direction = 0 - this.currentDirection() === -1 ? '-' : '';
    Meteor.call('setListSortBy', direction + this.currentListSortBy());
  },
  currentDirection() {
    return Meteor.user().getListSortByDirection();
  },
  currentListSortBy() {
    return Meteor.user().getListSortBy();
  },
  listSortShortDesc() {
    return `list-label-short-${this.currentListSortBy()}`;
  },
  */
  events() {
    return [
      {
        'click .js-edit-board-title': Popup.open('boardChangeTitle'),
        'click .js-star-board'() {
          Meteor.user().toggleBoardStar(Session.get('currentBoard'));
        },
        'click .js-open-board-menu': Popup.open('boardMenu'),
        'click .js-change-visibility': Popup.open('boardChangeVisibility'),
        'click .js-watch-board': Popup.open('boardChangeWatch'),
        'click .js-open-archived-board'() {
          Modal.open('archivedBoards');
        },
        'click .js-toggle-board-view': Popup.open('boardChangeView'),
        'click .js-toggle-sidebar'() {
          Sidebar.toggle();
        },
        'click .js-open-filter-view'() {
          Sidebar.setView('filter');
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
          Sidebar.setView();
          Filter.reset();
        },
        'click .js-sort-reset'() {
          Session.set('sortBy', '');
        },
        'click .js-open-search-view'() {
          Sidebar.setView('search');
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
      },
    ];
  },
}).register('boardHeaderBar');

Template.boardHeaderBar.helpers({
  canModifyBoard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly()
    );
  },
  boardView() {
    return Utils.boardView();
  },
  isSortActive() {
    return Session.get('sortBy') ? true : false;
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
});

const CreateBoard = BlazeComponent.extendComponent({
  template() {
    return 'createBoard';
  },

  onCreated() {
    this.visibilityMenuIsOpen = new ReactiveVar(false);
    this.visibility = new ReactiveVar('private');
    this.boardId = new ReactiveVar('');
    Meteor.subscribe('tableVisibilityModeSettings');
  },

  notAllowPrivateVisibilityOnly(){
    return !TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
  },

  visibilityCheck() {
    return this.currentData() === this.visibility.get();
  },

  setVisibility(visibility) {
    this.visibility.set(visibility);
    this.visibilityMenuIsOpen.set(false);
  },

  toggleVisibilityMenu() {
    this.visibilityMenuIsOpen.set(!this.visibilityMenuIsOpen.get());
  },

  toggleAddTemplateContainer() {
    $('#add-template-container').toggleClass('is-checked');
  },

  onSubmit(event) {
    event.preventDefault();
    const title = this.find('.js-new-board-title').value;

    const addTemplateContainer = $('#add-template-container.is-checked').length > 0;
    if (addTemplateContainer) {
      //const templateContainerId = Meteor.call('setCreateTemplateContainer');
      //Utils.goBoardId(templateContainerId);
      //alert('niinku template ' + Meteor.call('setCreateTemplateContainer'));

      this.boardId.set(
        Boards.insert({
            // title: TAPi18n.__('templates'),
            title: title,
            permission: 'private',
            type: 'template-container',
          }),
       );

      // Insert the card templates swimlane
      Swimlanes.insert({
          // title: TAPi18n.__('card-templates-swimlane'),
          title: 'Card Templates',
          boardId: this.boardId.get(),
          sort: 1,
          type: 'template-container',
        }),

      // Insert the list templates swimlane
      Swimlanes.insert(
        {
          // title: TAPi18n.__('list-templates-swimlane'),
          title: 'List Templates',
          boardId: this.boardId.get(),
          sort: 2,
          type: 'template-container',
        },
      );

      // Insert the board templates swimlane
      Swimlanes.insert(
        {
          //title: TAPi18n.__('board-templates-swimlane'),
          title: 'Board Templates',
          boardId: this.boardId.get(),
          sort: 3,
          type: 'template-container',
        },
      );

      Utils.goBoardId(this.boardId.get());

    } else {
      const visibility = this.visibility.get();

      this.boardId.set(
        Boards.insert({
          title,
          permission: visibility,
        }),
      );

      Swimlanes.insert({
        title: 'Default',
        boardId: this.boardId.get(),
      });

      Utils.goBoardId(this.boardId.get());
    }
  },

  events() {
    return [
      {
        'click .js-select-visibility'() {
          this.setVisibility(this.currentData());
        },
        'click .js-change-visibility': this.toggleVisibilityMenu,
        'click .js-import': Popup.open('boardImportBoard'),
        submit: this.onSubmit,
        'click .js-import-board': Popup.open('chooseBoardSource'),
        'click .js-board-template': Popup.open('searchElement'),
        'click .js-toggle-add-template-container': this.toggleAddTemplateContainer,
      },
    ];
  },
}).register('createBoardPopup');

(class HeaderBarCreateBoard extends CreateBoard {
  onSubmit(event) {
    super.onSubmit(event);
    // Immediately star boards crated with the headerbar popup.
    Meteor.user().toggleBoardStar(this.boardId.get());
  }
}.register('headerBarCreateBoardPopup'));

BlazeComponent.extendComponent({
  notAllowPrivateVisibilityOnly(){
    return !TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
  },
  visibilityCheck() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return this.currentData() === currentBoard.permission;
  },

  selectBoardVisibility() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const visibility = this.currentData();
    currentBoard.setVisibility(visibility);
    Popup.back();
  },

  events() {
    return [
      {
        'click .js-select-visibility': this.selectBoardVisibility,
      },
    ];
  },
}).register('boardChangeVisibilityPopup');

BlazeComponent.extendComponent({
  watchLevel() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.getWatchLevel(Meteor.userId());
  },

  watchCheck() {
    return this.currentData() === this.watchLevel();
  },

  events() {
    return [
      {
        'click .js-select-watch'() {
          const level = this.currentData();
          Meteor.call(
            'watch',
            'board',
            Session.get('currentBoard'),
            level,
            (err, ret) => {
              if (!err && ret) Popup.back();
            },
          );
        },
      },
    ];
  },
}).register('boardChangeWatchPopup');

/*
BlazeComponent.extendComponent({
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
    Meteor.user()
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
    return Meteor.user().getListSortByDirection() === -1
      ? this.downClass
      : this.upClass;
  },
  sortby() {
    return Meteor.user().getListSortBy();
  },

  setSortBy(type = null) {
    const user = Meteor.user();
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
}).register('listsortPopup');
*/

BlazeComponent.extendComponent({
  events() {
    return [
      {
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
      },
    ];
  },
}).register('cardsSortPopup');

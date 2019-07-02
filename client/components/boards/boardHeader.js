Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-custom-fields'() {
    Sidebar.setView('customFields');
    Popup.close();
  },
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.close();
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
    Popup.close();
    Boards.remove(currentBoard._id);
    FlowRouter.go('home');
  }),
  'click .js-outgoing-webhooks': Popup.open('outgoingWebhooks'),
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-subtask-settings': Popup.open('boardSubtaskSettings'),
});

Template.boardMenuPopup.helpers({
  exportUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/export', params, queryParams);
  },
  exportFilename() {
    const boardId = Session.get('currentBoard');
    return `wekan-export-board-${boardId}.json`;
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'boardChangeTitle';
  },

  onCreated() {
    this.error = new ReactiveVar('');
  },

  onSubmit(evt) {
    evt.preventDefault();
    const newTitle = this.find('.js-board-name').value.trim();
    const newBoardKey = this.find('.js-board-key').value.trim();
    const newDesc = this.find('.js-board-desc').value.trim();

    // validate input
    if (newBoardKey.length > 3) {
      this.error.set('board-key-invalid-length');
      evt.target.boardkey.focus();
    } else if (!newTitle) {
      this.error.set('invalid-title');
      evt.target.title.focus();
    } else {
      const currentBoard = Boards.findOne(Session.get('currentBoard'));

      // only set changed data
      if (currentBoard.title !== newTitle || currentBoard.boardKey !== newBoardKey)
        currentBoard.rename(newTitle, newBoardKey);

      if (currentBoard.description !== newDesc)
        currentBoard.setDescription(newDesc);

      Popup.close();
    }
  },

  events() {
    return [{
      submit: this.onSubmit,
    }];
  },
}).register('boardChangeTitlePopup');

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

  events() {
    return [{
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
      'click .js-toggle-board-view'() {
        const currentUser = Meteor.user();
        if ((currentUser.profile || {}).boardView === 'board-view-swimlanes') {
          currentUser.setBoardView('board-view-cal');
        } else if ((currentUser.profile || {}).boardView === 'board-view-lists') {
          currentUser.setBoardView('board-view-swimlanes');
        } else if ((currentUser.profile || {}).boardView === 'board-view-cal') {
          currentUser.setBoardView('board-view-lists');
        } else {
          currentUser.setBoardView('board-view-swimlanes');
        }
      },
      'click .js-toggle-sidebar'() {
        Sidebar.toggle();
      },
      'click .js-open-filter-view'() {
        Sidebar.setView('filter');
      },
      'click .js-filter-reset'(evt) {
        evt.stopPropagation();
        Sidebar.setView();
        Filter.reset();
      },
      'click .js-open-search-view'() {
        Sidebar.setView('search');
      },
      'click .js-open-rules-view'() {
        Modal.openWide('rulesMain');
      },
      'click .js-multiselection-activate'() {
        const currentCard = Session.get('currentCard');
        MultiSelection.activate();
        if (currentCard) {
          MultiSelection.add(currentCard);
        }
      },
      'click .js-multiselection-reset'(evt) {
        evt.stopPropagation();
        MultiSelection.disable();
      },
      'click .js-log-in'() {
        FlowRouter.go('atSignIn');
      },
    }];
  },
}).register('boardHeaderBar');

Template.boardHeaderBar.helpers({
  canModifyBoard() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
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
    this.error = new ReactiveVar('');
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

  onSubmit(evt) {
    evt.preventDefault();
    const title = this.find('.js-new-board-title').value;
    const boardKey = this.find('.js-new-board-key').value;
    const visibility = this.visibility.get();

    if (boardKey.length > 3) {
      this.error.set('board-key-invalid-length');
      evt.target.boardkey.focus();
    }
    else
    {
      this.boardId.set(Boards.insert({
        title,
        boardKey,
        permission: visibility,
      }));

      Swimlanes.insert({
        title: 'Default',
        boardId: this.boardId.get(),
      });

      Utils.goBoardId(this.boardId.get());
    }
  },

  events() {
    return [{
      'click .js-select-visibility'() {
        this.setVisibility(this.currentData());
      },
      'click .js-change-visibility': this.toggleVisibilityMenu,
      'click .js-import': Popup.open('boardImportBoard'),
      submit: this.onSubmit,
      'click .js-import-board': Popup.open('chooseBoardSource'),
      'click .js-board-template': Popup.open('searchElement'),
    }];
  },
}).register('createBoardPopup');

(class HeaderBarCreateBoard extends CreateBoard {
  onSubmit(evt) {
    super.onSubmit(evt);
    // Immediately star boards crated with the headerbar popup.
    Meteor.user().toggleBoardStar(this.boardId.get());
  }
}).register('headerBarCreateBoardPopup');

BlazeComponent.extendComponent({
  visibilityCheck() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return this.currentData() === currentBoard.permission;
  },

  selectBoardVisibility() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const visibility = this.currentData();
    currentBoard.setVisibility(visibility);
    Popup.close();
  },

  events() {
    return [{
      'click .js-select-visibility': this.selectBoardVisibility,
    }];
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
    return [{
      'click .js-select-watch'() {
        const level = this.currentData();
        Meteor.call('watch', 'board', Session.get('currentBoard'), level, (err, ret) => {
          if (!err && ret) Popup.close();
        });
      },
    }];
  },
}).register('boardChangeWatchPopup');

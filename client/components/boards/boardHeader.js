Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
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
  'click .js-export-board'() {
    const boardId = Session.get('currentBoard');
    Meteor.call('exportBoard', boardId, (error, response) => {
      if(error) {
        // the only error we can anticipate is accessing a non-authorized board
        // and this should have been caugh by UI before.
        // So no treatment here for the time being.
      } else {
        const dataToSave = new Blob([JSON.stringify(response)], {type: 'application/json;charset=utf-8'});
        const filename = `wekan-export-board-${boardId}.json`;
        saveAs(dataToSave, filename);
      }
    });
  }
});

Template.boardMenuPopup.helpers({
  urlExport() {
    return Meteor.absoluteUrl(`api/b/${Session.get('currentBoard')}`);
  },
});

Template.boardChangeTitlePopup.events({
  submit(evt, tpl) {
    const newTitle = tpl.$('.js-board-name').val().trim();
    const newDesc = tpl.$('.js-board-desc').val().trim();
    if (newTitle) {
      this.rename(newTitle);
      this.setDesciption(newDesc);
      Popup.close();
    }
    evt.preventDefault();
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'boardHeaderBar';
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
      'click .js-open-filter-view'() {
        Sidebar.setView('filter');
      },
      'click .js-filter-reset'(evt) {
        evt.stopPropagation();
        Sidebar.setView();
        Filter.reset();
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
    }];
  },
}).register('boardHeaderBar');

BlazeComponent.extendComponent({
  template() {
    return 'boardChangeColorPopup';
  },

  backgroundColors() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.currentData().toString();
  },

  events() {
    return [{
      'click .js-select-background'(evt) {
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const newColor = this.currentData().toString();
        currentBoard.setColor(newColor);
        evt.preventDefault();
      },
    }];
  },
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  template() {
    return 'createBoardPopup';
  },

  onCreated() {
    this.visibilityMenuIsOpen = new ReactiveVar(false);
    this.visibility = new ReactiveVar('private');
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
    const visibility = this.visibility.get();

    const boardId = Boards.insert({
      title,
      permission: visibility,
    });

    Utils.goBoardId(boardId);

    // Immediately star boards crated with the headerbar popup.
    Meteor.user().toggleBoardStar(boardId);
  },

  events() {
    return [{
      'click .js-select-visibility'() {
        this.setVisibility(this.currentData());
      },
      'click .js-change-visibility': this.toggleVisibilityMenu,
      'click .js-import': Popup.open('boardImportBoard'),
      submit: this.onSubmit,
    }];
  },
}).register('createBoardPopup');

BlazeComponent.extendComponent({
  template() {
    return 'boardChangeVisibilityPopup';
  },

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

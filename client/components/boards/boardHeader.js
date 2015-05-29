Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('setLanguage')
});

Template.boardChangeTitlePopup.events({
  submit: function(evt, t) {
    var title = t.$('.js-board-name').val().trim();
    if (title) {
      Boards.update(this._id, {
        $set: {
          title: title
        }
      });
      Popup.close();
    }
    evt.preventDefault();
  }
});

BlazeComponent.extendComponent({
  template: function() {
    return 'headerBoard';
  },

  isStarred: function() {
    var currentBoard  = this.currentData();
    var user = Meteor.user();
    return currentBoard && user && user.hasStarred(currentBoard._id);
  },

  // Only show the star counter if the number of star is greater than 2
  showStarCounter: function() {
    var currentBoard = this.currentData();
    return currentBoard && currentBoard.stars > 2;
  },

  events: function() {
    return [{
      'click .js-edit-board-title': Popup.open('boardChangeTitle'),
      'click .js-star-board': function() {
        Meteor.user().toggleBoardStar(Session.get('currentBoard'));
      },
      'click .js-open-board-menu': Popup.open('boardMenu'),
      'click .js-change-visibility': Popup.open('boardChangeVisibility'),
      'click .js-open-filter-view': function() {
        Sidebar.setView('filter');
      },
      'click .js-filter-reset': function(evt) {
        evt.stopPropagation();
        Sidebar.setView();
        Filter.reset();
      },
      'click .js-multiselection-activate': function() {
        var currentCard = Session.get('currentCard');
        MultiSelection.activate();
        if (currentCard) {
          MultiSelection.add(currentCard);
        }
      },
      'click .js-multiselection-reset': function(evt) {
        evt.stopPropagation();
        MultiSelection.disable();
      }
    }];
  }
}).register('headerBoard');

BlazeComponent.extendComponent({
  template: function() {
    return 'boardChangeColorPopup';
  },

  backgroundColors: function() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected: function() {
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.currentData().toString();
  },

  events: function() {
    return [{
      'click .js-select-background': function(evt) {
        var currentBoardId = Session.get('currentBoard');
        Boards.update(currentBoardId, {
          $set: {
            color: this.currentData().toString()
          }
        });
        evt.preventDefault();
      }
    }];
  }
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  template: function() {
    return 'createBoardPopup';
  },

  onCreated: function() {
    this.visibilityMenuIsOpen = new ReactiveVar(false);
    this.visibility = new ReactiveVar('private');
  },

  visibilityCheck: function() {
    return this.currentData() === this.visibility.get();
  },

  setVisibility: function(visibility) {
    this.visibility.set(visibility);
    this.visibilityMenuIsOpen.set(false);
  },

  toogleVisibilityMenu: function() {
    this.visibilityMenuIsOpen.set(! this.visibilityMenuIsOpen.get());
  },

  onSubmit: function(evt) {
    evt.preventDefault();
    var title = this.find('.js-new-board-title').value;
    var visibility = this.visibility.get();

    var boardId = Boards.insert({
      title: title,
      permission: visibility
    });

    Utils.goBoardId(boardId);
  },

  events: function() {
    return [{
      'click .js-select-visibility': function() {
        this.setVisibility(this.currentData());
      },
      'click .js-change-visibility': this.toogleVisibilityMenu,
      submit: this.onSubmit
    }];
  }
}).register('createBoardPopup');

BlazeComponent.extendComponent({
  template: function() {
    return 'boardChangeVisibilityPopup';
  },

  visibilityCheck: function() {
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    return this.currentData() === currentBoard.permission;
  },

  selectBoardVisibility: function() {
    Boards.update(Session.get('currentBoard'), {
      $set: {
        permission: this.currentData()
      }
    });
    Popup.close();
  },

  events: function() {
    return [{
      'click .js-select-visibility': this.selectBoardVisibility
    }];
  }
}).register('boardChangeVisibilityPopup');

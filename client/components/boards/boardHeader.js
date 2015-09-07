Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.close();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', () => {
    const boardId = Session.get('currentBoard');
    Boards.update(boardId, { $set: { archived: true }});
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
});

Template.boardChangeTitlePopup.events({
  submit(evt, tpl) {
    const title = tpl.$('.js-board-name').val().trim();
    if (title) {
      Boards.update(this._id, {
        $set: {
          title,
        },
      });
      Popup.close();
    }
    evt.preventDefault();
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'headerBoard';
  },

  isStarred() {
    const boardId = Session.get('currentBoard');
    const user = Meteor.user();
    return user && user.hasStarred(boardId);
  },

  // Only show the star counter if the number of star is greater than 2
  showStarCounter: function() {
    var currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard && currentBoard.stars >= 2;
  },

  getSortType: function(){
    // var currentBoard = this.currentData();
    // if( !(currentBoard.sortType))
    //   if( currentBoard.permission === "collaborate" )
    //     currentBoard.sortType = 'votes';
    //   else
    //     currentBoard.sortType = 'sort';

    var sort = Session.get('currentBoardSort');
    if( ! sort ){
      var currentBoard = Boards.findOne(Session.get('currentBoard'));
      sort = currentBoard.sortType;
    }
        
    return  Session.get('currentBoardSort');
   
  },
  getSortTypeText: function(){
    // var currentBoard = this.currentData();
    // if( !(currentBoard.sortType))
    //   if( currentBoard.permission === "collaborate" )
    //     currentBoard.sortType = 'votes';
    //   else
    //     currentBoard.sortType = 'sort';
    return 'sort by '+ this.getSortType();
  },
  events: function() {
    return [{
      'click .js-change-sort': Popup.open('changeBoardSort'),
      'click .js-edit-board-title': Popup.open('boardChangeTitle'),
      'click .js-star-board'() {
        Meteor.user().toggleBoardStar(Session.get('currentBoard'));
      },
      'click .js-open-board-menu': Popup.open('boardMenu'),
      'click .js-change-visibility': Popup.open('boardChangeVisibility'),
      'click .js-open-board-search-view': function() {
        Sidebar.setView('boardsearch');
      },
      'click .js-board-search-reset': function(evt) {
        evt.stopPropagation();
        Sidebar.setView();
      },
      'click .js-open-filter-view': function() {
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
}).register('headerBoard');

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
        const currentBoardId = Session.get('currentBoard');
        Boards.update(currentBoardId, {
          $set: {
            color: this.currentData().toString(),
          },
        });
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
  organizations: function() {
    return Organizations.find({}, {
      sort: ['title']
    });
  },

  isCurrentOrg: function(id){
    if( Session.get('currentOrg') === id)
      return true;
    else
      return false;
  },

  visibilityCheck() {
    return this.currentData() === this.visibility.get();
  },

  setVisibility(visibility) {
    this.visibility.set(visibility);
    this.visibilityMenuIsOpen.set(false);
  },

  toogleVisibilityMenu() {
    this.visibilityMenuIsOpen.set(!this.visibilityMenuIsOpen.get());
  },

  onSubmit(evt) {
    evt.preventDefault();
    var title = this.find('.js-new-board-title').value;
    var visibility = this.visibility.get();
    var organizationId = this.find('.org-sel').value;

    var boardId = Boards.insert({
      title: title,
      organizationId: organizationId,
      permission: visibility
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
      'click .js-change-visibility': this.toogleVisibilityMenu,
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
    Boards.update(Session.get('currentBoard'), {
      $set: {
        permission: this.currentData(),
      },
    });
    Popup.close();
  },

  events() {
    return [{
      'click .js-select-visibility': this.selectBoardVisibility,
    }];
  },
}).register('boardChangeVisibilityPopup');


Template.changeBoardSortPopup.events({
  'click .js-sort-votes, click .js-sort-createAt, click .js-sort-dateLastActivity, click .js-sort-sort': function(event) {
    
    var sortType = "";
    if( $(event.currentTarget).hasClass('js-sort-votes'))
      sortType = "votes";
    else if( $(event.currentTarget).hasClass('js-sort-createAt'))
      sortType = "createAt";
    else if( $(event.currentTarget).hasClass('js-sort-dateLastActivity'))
      sortType = "dateLastActivity";
    else if( $(event.currentTarget).hasClass('js-sort-sort'))
      sortType = "sort";
    Session.set('currentBoardSort', sortType);
    // Boards.update(currentBoard._id, {
    //   sortType: sortType
    // });
    Popup.back(1);
  }
});

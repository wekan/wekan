Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.close();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-invite-emails-for-board': Popup.open('inviteEmailsForBoard'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
});

Template.inviteEmailsForBoardPopup.events({
  submit(evt, tpl) {
    evt.preventDefault();
    const emails = $.trim(tpl.find('.js-invite-emails-input').value);
    
    const emailArray = emails.split(";");
    Meteor.call('enrollAccounts', emailArray, 'board', Session.get('currentBoard'), function (error, result){
      let notify;
    });

    Popup.back();
  },
});

Template.boardChangeTitlePopup.events({
  submit(evt, tpl) {
    const newTitle = tpl.$('.js-board-name').val().trim();
    if (newTitle) {
      this.rename(newTitle);
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
  showStarCounter() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard && currentBoard.stars >= 2;
  },

  getSortType: function(){
    var sort = Session.get('currentBoardSort');
    if( ! sort ){
      var currentBoard = Boards.findOne(Session.get('currentBoard'));
      sort = currentBoard.sortType;
    }      
    return  sort;
  },
  getSortTypeText: function(){
    return 'sort-by-'+ this.getSortType();
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
    let currentOrganization;
    currentOrganization = Organizations.findOne(Session.get('currentOrgIdHomeBoardList'));
    if( !currentOrganization)
      currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    if( !currentOrganization){
      if( Session.get('currentBoard') && Boards.findOne(Session.get('currentBoard')) )
        currentOrganization = Organizations.findOne(  Boards.findOne(Session.get('currentBoard')).organizationId );
    }
    this.showOrgMemberAutoJoin = new ReactiveVar(false);
    this.checkOrgMemberAutoJoin = new ReactiveVar(false);
    if( currentOrganization ){
      this.showOrgMemberAutoJoin = new ReactiveVar(true);
      if( Boards.find({organizationId: currentOrganization._id, orgMemberAutoJoin: false,}).count() < 1)
        this.checkOrgMemberAutoJoin.set(true);
    }
  },

  onDestroyed(){
    Session.set('currentOrgIdHomeBoardList',''); 
  },

  organizations: function() {
    return Organizations.find({}, {
      sort: ['title']
    });
  },

  canCreateBoardOrgs(){
    // meteor mini-mongo not support $elemMatch? it alway return all the elements
    return Organizations.find(
       { members:{ $elemMatch: { userId: Meteor.userId(), isAdmin: true } } }
    )
  },

  isCurrentOrg: function(id){

    let currentOrganization;
    currentOrganization = Organizations.findOne(Session.get('currentOrgIdHomeBoardList'));
    if( !currentOrganization)
      currentOrganization = Organizations.findOne({shortName: Session.get('currentOrganizationShortName')});
    if( !currentOrganization){
      if( Session.get('currentBoard') && Boards.findOne(Session.get('currentBoard')) )
        currentOrganization = Organizations.findOne(  Boards.findOne(Session.get('currentBoard')).organizationId );
    }
    if( (currentOrganization && currentOrganization._id === id) ||
      (!currentOrganization && !id))
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

  toggleVisibilityMenu() {
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
      permission: visibility,
      orgMemberAutoJoin: this.checkOrgMemberAutoJoin.get(),
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
      'change #org-id': function(evt) {
        var orgId = $(evt.target).val();
        if( orgId !== '')
          this.showOrgMemberAutoJoin.set(true);
        else
          this.showOrgMemberAutoJoin.set(false);
      },
      'click .js-org-member-auto-join': function(){
        this.checkOrgMemberAutoJoin.set( !this.checkOrgMemberAutoJoin.get() )
      },
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

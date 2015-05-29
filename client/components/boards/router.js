Meteor.subscribe('boards');

var boardSubsManager = new SubsManager();

Router.route('/boards', {
  name: 'Boards',
  template: 'boards',
  authenticated: true,
  onBeforeAction: function() {
    Session.set('currentBoard', '');
    Filter.reset();
    this.next();
  }
});

Router.route('/boards/:_id/:slug', {
  name: 'Board',
  template: 'board',
  onAfterAction: function() {
    // XXX We probably shouldn't rely on Session
    Session.set('sidebarIsOpen', true);
    Session.set('menuWidgetIsOpen', false);
  },
  waitOn: function() {
    var params = this.params;
    Session.set('currentBoard', params._id);
    Session.set('currentCard', null);

    return boardSubsManager.subscribe('board', params._id, params.slug);
  },
  data: function() {
    return Boards.findOne(this.params._id);
  }
});

Router.route('/boards/:boardId/:slug/:cardId', {
  name: 'Card',
  template: 'board',
  noEscapeActions: true,
  onAfterAction: function() {
    Tracker.nonreactive(function() {
      if (! Session.get('currentCard') && Sidebar) {
        Sidebar.hide();
      }
    });
    var params = this.params;
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);
  },
  waitOn: function() {
    var params = this.params;
    return boardSubsManager.subscribe('board', params.boardId, params.slug);
  },
  data: function() {
    return Boards.findOne(this.params.boardId);
  }
});

// Close the card details pane by pressing escape
EscapeActions.register('detailsPane',
  function() { Utils.goBoardId(Session.get('currentBoard')); },
  function() { return ! Session.equals('currentCard', null); }
);

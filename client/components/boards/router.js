Meteor.subscribe('boards');

BoardSubsManager = new SubsManager();

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
    Session.set('sidebarIsOpen', true);
    Session.set('currentWidget', 'home');
    Session.set('menuWidgetIsOpen', false);
  },
  waitOn: function() {
    var params = this.params;
    Session.set('currentBoard', params._id);
    Session.set('currentCard', null);

    return BoardSubsManager.subscribe('board', params._id, params.slug);
  },
  data: function() {
    return Boards.findOne(this.params._id);
  }
});

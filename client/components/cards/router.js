Router.route('/boards/:boardId/:slug/:cardId', {
  name: 'Card',
  template: 'board',
  waitOn: function() {
    var params = this.params;
    // XXX We probably shouldn't rely on Session
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);

    return BoardSubsManager.subscribe('board', params.boardId, params.slug);
  },
  data: function() {
    return Boards.findOne(this.params.boardId);
  }
});

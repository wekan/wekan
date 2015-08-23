FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action: function() {
    EscapeActions.executeAll();
    Filter.reset();

    Session.set('currentBoard', '');

    BlazeLayout.render('defaultLayout', { content: 'boardList' });
  }
});

FlowRouter.route('/b/:id/:slug', {
  name: 'board',
  action: function(params) {
    EscapeActions.executeAll();

    Session.set('currentBoard', params.id);
    Session.set('currentCard', null);

    BlazeLayout.render('defaultLayout', { content: 'board' });
  }
});

FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  action: function(params) {
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);
    EscapeActions.executeUpTo('popup-close');

    BlazeLayout.render('defaultLayout', { content: 'board' });
  }
});

FlowRouter.notFound = {
  action: function() {
    BlazeLayout.render('defaultLayout', { content: 'notFound' });
  }
}

// We maintain a list of redirections to ensure that we don't break old URLs
// when we change our routing scheme.
var redirections = {
  '/boards': '/',
  '/boards/:id/:slug': '/b/:id/:slug',
  '/boards/:id/:slug/:cardId': '/b/:id/:slug/:cardId'
};

_.each(redirections, function(newPath, oldPath) {
  FlowRouter.route(oldPath, {
    triggersEnter: [function(context, redirect) {
      redirect(FlowRouter.path(newPath, context.params));
    }]
  });
});

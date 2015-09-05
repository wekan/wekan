let previousPath;
FlowRouter.triggers.exit([({path}) => {
  previousPath = path;
}]);

FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action: function() {
    EscapeActions.executeAll();
    Filter.reset();

    Session.set('currentBoard', null);
    Session.set('currentCard', null);

    BlazeLayout.render('boardsLayout', { content: 'boardList' });
  }
});


FlowRouter.route('/o/:shortName', {
  name: 'organization',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action: function(params) {
    //var org = Organizations.findOne({shortName: params.shortName});
    //if( org )
    //  Session.set('currentOrganizationShortName', params._id);  
    Session.set('currentOrganizationShortName', params.shortName);
    // Session.set('currentBoard', null);
    // Session.set('currentCard', null);

    BlazeLayout.render('orgsLayout', { content: 'organization' });
  }
});

FlowRouter.route('/b/:id/:slug', {
  name: 'board',
  action: function(params) {
    let currentBoard = params.id;
    // If we close a card, we'll execute again this route action but we don't
    // want to excape every current actions (filters, etc.)
    if (Session.get('currentBoard') !== currentBoard) {
      EscapeActions.executeAll();
    }

    Session.set('currentBoard', currentBoard);
    Session.set('currentCard', null);
    
    BlazeLayout.render('defaultLayout', { content: 'board' });
  }
});

FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  action: function(params) {
    EscapeActions.executeUpTo('popup-close');
    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);

    BlazeLayout.render('defaultLayout', { content: 'board' });
  }
});

FlowRouter.route('/shortcuts', {
  name: 'shortcuts',
  action: function(params) {
    const shortcutsTemplate = 'keyboardShortcuts';

    EscapeActions.executeUpTo('popup-close');

    if (previousPath) {
      Modal.open(shortcutsTemplate, {
        onCloseGoTo: previousPath
      });
    } else {
      // XXX There is currently no way to escape this page on Sandstorm
      BlazeLayout.render('defaultLayout', { content: shortcutsTemplate });
    }
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

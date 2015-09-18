let previousPath;
FlowRouter.triggers.exit([({path}) => {
  previousPath = path;
}]);

FlowRouter.route('/', {
  name: 'home',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    Session.set('currentBoard', null);
    Session.set('currentCard', null);
    
    Filter.reset();
    EscapeActions.executeAll();

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
  action(params) {
    const currentBoard = params.id;
    const previousBoard = Session.get('currentBoard');
    Session.set('currentBoard', currentBoard);
    Session.set('currentCard', null);

    // If we close a card, we'll execute again this route action but we don't
    // want to excape every current actions (filters, etc.)
    if (previousBoard !== currentBoard) {
      EscapeActions.executeAll();
    } else {
      EscapeActions.executeUpTo('popup-close');
    }

    BlazeLayout.render('defaultLayout', { content: 'board' });
  },
});

FlowRouter.route('/b/:boardId/:slug/:cardId', {
  name: 'card',
  action(params) {
    EscapeActions.executeUpTo('inlinedForm');

    Session.set('currentBoard', params.boardId);
    Session.set('currentCard', params.cardId);

    BlazeLayout.render('defaultLayout', { content: 'board' });
  },
});

FlowRouter.route('/shortcuts', {
  name: 'shortcuts',
  action() {
    const shortcutsTemplate = 'keyboardShortcuts';

    EscapeActions.executeUpTo('popup-close');

    if (previousPath) {
      Modal.open(shortcutsTemplate, {
        onCloseGoTo: previousPath,
      });
    } else {
      // XXX There is currently no way to escape this page on Sandstorm
      BlazeLayout.render('defaultLayout', { content: shortcutsTemplate });
    }
  },
});

FlowRouter.notFound = {
  action() {
    BlazeLayout.render('defaultLayout', { content: 'notFound' });
  },
};

// We maintain a list of redirections to ensure that we don't break old URLs
// when we change our routing scheme.
const redirections = {
  '/boards': '/',
  '/boards/:id/:slug': '/b/:id/:slug',
  '/boards/:id/:slug/:cardId': '/b/:id/:slug/:cardId',
};

_.each(redirections, (newPath, oldPath) => {
  FlowRouter.route(oldPath, {
    triggersEnter: [(context, redirect) => {
      redirect(FlowRouter.path(newPath, context.params));
    }],
  });
});

Router.configure({
  loadingTemplate: 'spinner',
  notFoundTemplate: 'notfound',
  layoutTemplate: 'defaultLayout',

  onBeforeAction: function() {
    var options = this.route.options;

    // Redirect logged in users to Boards view when they try to open Login or
    // signup views.
    if (Meteor.userId() && options.redirectLoggedInUsers) {
      return this.redirect('Boards');
    }

    // Authenticated
    if (! Meteor.userId() && options.authenticated) {
      return this.redirect('atSignIn');
    }

    // Reset default sessions
    Session.set('error', false);

    Tracker.nonreactive(function() {
      EscapeActions.executeLowerThan(40);
    });

    this.next();
  }
});

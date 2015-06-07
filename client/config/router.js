// XXX Switch to Flow-Router?
var previousRoute;

Router.configure({
  loadingTemplate: 'spinner',
  notFoundTemplate: 'notfound',
  layoutTemplate: 'defaultLayout',

  onBeforeAction: function() {
    var options = this.route.options;

    var loggedIn = Tracker.nonreactive(function() {
      return !! Meteor.userId();
    });

    // Redirect logged in users to Boards view when they try to open Login or
    // signup views.
    if (loggedIn && options.redirectLoggedInUsers) {
      return this.redirect('Boards');
    }

    // Authenticated
    if (! loggedIn && options.authenticated) {
      return this.redirect('atSignIn');
    }

    // We want to execute our EscapeActions.executeUpTo method any time the
    // route is changed, but not if the stays the same but only the parameters
    // change (eg when a user is navigation from a card A to a card B). Iron-
    // Router onBeforeAction is a reactive context (which is a bad desig choice
    // as explained in
    // https://github.com/meteorhacks/flow-router#routercurrent-is-evil) so we
    // need to use Tracker.nonreactive
    Tracker.nonreactive(function() {
      if (! options.noEscapeActions &&
          ! (previousRoute && previousRoute.options.noEscapeActions))
      EscapeActions.executeAll();
    });

    previousRoute = this.route;

    this.next();
  }
});

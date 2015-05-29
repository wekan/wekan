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

    Tracker.nonreactive(function() {
      if (! options.noEscapeActions &&
          ! (previousRoute && previousRoute.options.noEscapeActions))
      EscapeActions.executeAll();
    });

    previousRoute = this.route;

    this.next();
  }
});

// We want to execute our EscapeActions.executeLowerThan method any time the
// route is changed, but not if the stays the same but only the parameters
// change (eg when a user is navigation from a card A to a card B). This is why
// we can’t put this function in the above `onBeforeAction` that is being run
// too many times, instead we register a dependency only on the route name and
// use Tracker.autorun. The following paragraph explains the problem quite well:
// https://github.com/meteorhacks/flow-router#routercurrent-is-evil
// Tracker.autorun(function(computation) {
//   routeName.get();
//   if (! computation.firstRun) {
//     EscapeActions.executeLowerThan('inlinedForm');
//   }
// });

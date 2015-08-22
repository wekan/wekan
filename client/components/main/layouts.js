Meteor.subscribe('boards');

Template.userFormsLayout.onRendered(function() {
  EscapeActions.executeAll();
});

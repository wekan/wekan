Meteor.subscribe('organizations');
Meteor.subscribe('boards')

BlazeLayout.setRoot('body');

Template.userFormsLayout.onRendered(() => {
  EscapeActions.executeAll();
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});

Template.boardsLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});

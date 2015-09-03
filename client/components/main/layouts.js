Meteor.subscribe('boards');

BlazeLayout.setRoot('body');

Template.userFormsLayout.onRendered(() => {
  EscapeActions.executeAll();
});

Template.defaultLayout.events({
  'click .js-close-modal': () => {
    Modal.close();
  },
});

Template.header.helpers({
  wrappedHeader() {
    return !Session.get('currentBoard');
  },

  hideLogo() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
});

Template.header.events({
  'click .js-create-board': Popup.open('createBoard'),
});

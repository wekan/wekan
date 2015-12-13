Template.header.helpers({
  wrappedHeader() {
    return !Session.get('currentBoard');
  },
});

Template.header.events({
  'click .js-create-board': Popup.open('createBoard'),
});

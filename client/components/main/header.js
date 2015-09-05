Template.header.helpers({
  // Reactively set the color of the page from the color of the current board.
  headerTemplate() {
    return 'headerBoard';
  },

  wrappedHeader() {
    return !Session.get('currentBoard');
  },
});

Template.header.events({
  'click .js-create-board': Popup.open('createBoard'),
});

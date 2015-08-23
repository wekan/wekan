Template.header.helpers({
  // Reactively set the color of the page from the color of the current board.
  headerTemplate: function() {
    return 'headerBoard';
  },

  wrappedHeader: function() {
    var unwrapedRoutes = ['board', 'card'];
    var currentRouteName = FlowRouter.getRouteName();
    return unwrapedRoutes.indexOf(currentRouteName) === -1;
  }
});

Template.header.events({
  'click .js-create-board': Popup.open('createBoard')
});

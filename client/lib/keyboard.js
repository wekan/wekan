// XXX Pressing `?` should display a list of all shortcuts available.
//
// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

Mousetrap.bind('w', function() {
  Sidebar.toogle();
});

Mousetrap.bind('q', function() {
  var currentBoardId = Session.get('currentBoard');
  var currentUserId = Meteor.userId();
  if (currentBoardId && currentUserId) {
    Filter.members.toogle(currentUserId);
  }
});

Mousetrap.bind('x', function() {
  if (Filter.isActive()) {
    Filter.reset();
  }
});

Mousetrap.bind(['down', 'up'], function(evt, key) {
  if (! Session.get('currentCard')) {
    return;
  }

  var nextFunc = (key === 'down' ? 'next' : 'prev');
  var nextCard = $('.js-minicard.is-selected')[nextFunc]('.js-minicard').get(0);
  if (nextCard) {
    var nextCardId = Blaze.getData(nextCard)._id;
    Utils.goCardId(nextCardId);
  }
});

// XXX Pressing `?` should display a list of all shortcuts available.
//
// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

// Pressing `Escape` should close the last opened “element” and only the last
// one -- curently we handle popups and the card detailed view of the sidebar.
Mousetrap.bind('esc', function() {
  if (currentlyOpenedForm.get() !== null) {
    currentlyOpenedForm.get().close();

  } else if (Popup.isOpen()) {
    Popup.back();

  // XXX We should have a higher level API
  } else if (Session.get('currentCard')) {
    Utils.goBoardId(Session.get('currentBoard'));
  }
});

Mousetrap.bind('w', function() {
  if (! Session.get('currentCard')) {
    Sidebar.toogle();
  } else {
    Utils.goBoardId(Session.get('currentBoard'));
    Sidebar.hide();
  }
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

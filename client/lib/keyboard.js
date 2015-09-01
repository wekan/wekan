// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

Mousetrap.bind('?', () => {
  FlowRouter.go('shortcuts');
});

Mousetrap.bind('w', () => {
  Sidebar.toogle();
});

Mousetrap.bind('q', () => {
  const currentBoardId = Session.get('currentBoard');
  const currentUserId = Meteor.userId();
  if (currentBoardId && currentUserId) {
    Filter.members.toogle(currentUserId);
  }
});

Mousetrap.bind('x', () => {
  if (Filter.isActive()) {
    Filter.reset();
  }
});

Mousetrap.bind(['down', 'up'], (evt, key) => {
  if (! Session.get('currentCard')) {
    return;
  }

  const nextFunc = (key === 'down' ? 'next' : 'prev');
  const nextCard = $('.js-minicard.is-selected')[nextFunc]('.js-minicard').get(0);
  if (nextCard) {
    const nextCardId = Blaze.getData(nextCard)._id;
    Utils.goCardId(nextCardId);
  }
});

Template.keyboardShortcuts.helpers({
  mapping: [{
    keys: ['W'],
    action: 'shortcut-toogle-sidebar'
  }, {
    keys: ['Q'],
    action: 'shortcut-filter-my-cards'
  }, {
    keys: ['X'],
    action: 'shortcut-clear-filters'
  }, {
    keys: ['?'],
    action: 'shortcut-show-shortcuts'
  }, {
    keys: ['ESC'],
    action: 'shortcut-close-dialog'
  }, {
    keys: ['@'],
    action: 'shortcut-autocomplete-members'
  }, {
    keys: [':'],
    action: 'shortcut-autocomplete-emojies'
  }]
});

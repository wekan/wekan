// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

Mousetrap.bind('?', () => {
  FlowRouter.go('shortcuts');
});

Mousetrap.bind('w', () => {
  if (Sidebar.isOpen() && Sidebar.getView() === 'home') {
    Sidebar.toggle();
  } else {
    Sidebar.setView();
  }
});

Mousetrap.bind('q', () => {
  const currentBoardId = Session.get('currentBoard');
  const currentUserId = Meteor.userId();
  if (currentBoardId && currentUserId) {
    Filter.members.toggle(currentUserId);
  }
});

Mousetrap.bind('x', () => {
  if (Filter.isActive()) {
    Filter.reset();
  }
});

Mousetrap.bind('f', () => {
  if (Sidebar.isOpen() && Sidebar.getView() === 'filter') {
    Sidebar.toggle();
  } else {
    Sidebar.setView('filter');
  }
});

Mousetrap.bind(['down', 'up'], (evt, key) => {
  if (!Session.get('currentCard')) {
    return;
  }

  const nextFunc = (key === 'down' ? 'next' : 'prev');
  const nextCard = $('.js-minicard.is-selected')[nextFunc]('.js-minicard').get(0);
  if (nextCard) {
    const nextCardId = Blaze.getData(nextCard)._id;
    Utils.goCardId(nextCardId);
  }
});

// XXX This shortcut should also work when hovering over a card in board view
Mousetrap.bind('space', (evt) => {
  if (!Session.get('currentCard')) {
    return;
  }

  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }

  if (Meteor.user().isBoardMember()) {
    const card = Cards.findOne(Session.get('currentCard'));
    card.toggleMember(currentUserId);
    // We should prevent scrolling in card when spacebar is clicked
    // This should do it according to Mousetrap docs, but it doesn't
    evt.preventDefault();
  }
});

BlazeComponent.extendComponent({
  mapping(){
    return [{
      keys: ['W'],
      action: 'shortcut-toggle-sidebar',
    }, {
      keys: ['Q'],
      action: 'shortcut-filter-my-cards',
    }, {
      keys: ['F'],
      action: 'shortcut-toggle-filterbar',
    }, {
      keys: ['X'],
      action: 'shortcut-clear-filters',
    }, {
      keys: ['?'],
      action: 'shortcut-show-shortcuts',
    }, {
      keys: ['ESC'],
      action: 'shortcut-close-dialog',
    }, {
      keys: ['@'],
      action: 'shortcut-autocomplete-members',
    }, {
      keys: ['SPACE'],
      action: 'shortcut-assign-self',
    }];
  },
}).register('keyboardShortcuts');

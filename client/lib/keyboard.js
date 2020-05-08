// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

function getHoveredCardId() {
  const card = $('.js-minicard:hover').get(0);
  if (!card) return null;
  return Blaze.getData(card)._id;
}

function getSelectedCardId() {
  return Session.get('selectedCard') || getHoveredCardId();
}

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

  const nextFunc = key === 'down' ? 'next' : 'prev';
  const nextCard = $('.js-minicard.is-selected')
    [nextFunc]('.js-minicard')
    .get(0);
  if (nextCard) {
    const nextCardId = Blaze.getData(nextCard)._id;
    Utils.goCardId(nextCardId);
  }
});

Mousetrap.bind('space', evt => {
  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }

  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }

  if (Meteor.user().isBoardMember()) {
    const card = Cards.findOne(cardId);
    card.toggleMember(currentUserId);
    // We should prevent scrolling in card when spacebar is clicked
    // This should do it according to Mousetrap docs, but it doesn't
    evt.preventDefault();
  }
});

Mousetrap.bind('c', evt => {
  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }

  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }

  if (
    Meteor.user().isBoardMember() &&
    !Meteor.user().isCommentOnly() &&
    !Meteor.user().isWorker()
  ) {
    const card = Cards.findOne(cardId);
    card.archive();
    // We should prevent scrolling in card when spacebar is clicked
    // This should do it according to Mousetrap docs, but it doesn't
    evt.preventDefault();
  }
});

Template.keyboardShortcuts.helpers({
  mapping: [
    {
      keys: ['w'],
      action: 'shortcut-toggle-sidebar',
    },
    {
      keys: ['q'],
      action: 'shortcut-filter-my-cards',
    },
    {
      keys: ['f'],
      action: 'shortcut-toggle-filterbar',
    },
    {
      keys: ['x'],
      action: 'shortcut-clear-filters',
    },
    {
      keys: ['?'],
      action: 'shortcut-show-shortcuts',
    },
    {
      keys: ['ESC'],
      action: 'shortcut-close-dialog',
    },
    {
      keys: ['@'],
      action: 'shortcut-autocomplete-members',
    },
    {
      keys: ['SPACE'],
      action: 'shortcut-assign-self',
    },
    {
      keys: ['c'],
      action: 'archive-card',
    },
  ],
});

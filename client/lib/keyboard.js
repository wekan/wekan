// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

function getHoveredCardId() {
  const card = $('.js-minicard:hover').get(0);
  if (!card) return null;
  return Blaze.getData(card)._id;
}

function getSelectedCardId() {
  return Session.get('currentCard') || Session.get('selectedCard') || getHoveredCardId();
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

Mousetrap.bind('/', () => {
  if (Sidebar.isOpen() && Sidebar.getView() === 'search') {
    Sidebar.toggle();
  } else {
    Sidebar.setView('search');
  }
});

Mousetrap.bind(['down', 'up'], (evt, key) => {
  if (!Utils.getCurrentCardId()) {
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

numbArray = _.range(1,10).map(x => 'shift+'+String(x))
Mousetrap.bind(numbArray, (evt, key) => {
  num = parseInt(key.substr(6, key.length));
  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }
  const currentBoardId = Session.get('currentBoard');
  board = Boards.findOne(currentBoardId);
  labels = board.labels;
  if(MultiSelection.isActive())
  {
    const cardIds = MultiSelection.getSelectedCardIds();
    for (const cardId of cardIds)
    {
      card = Cards.findOne(cardId);
      if(num <= board.labels.length)
      {
        card.removeLabel(labels[num-1]["_id"]);
      }
    }
  }
});

numArray = _.range(1,10).map(x => String(x))
Mousetrap.bind(numArray, (evt, key) => {
  num = parseInt(key);
  const currentUserId = Meteor.userId();
  const currentBoardId = Session.get('currentBoard');
  if (currentUserId === null) {
    return;
  }
  board = Boards.findOne(currentBoardId);
  labels = board.labels;
  if(MultiSelection.isActive() && Meteor.user().isBoardMember())
  {
    const cardIds = MultiSelection.getSelectedCardIds();
    for (const cardId of cardIds)
    {
      card = Cards.findOne(cardId);
      if(num <= board.labels.length)
      {
        card.addLabel(labels[num-1]["_id"]);
      }
    }
    return;
  }

  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }
  if (Meteor.user().isBoardMember()) {
    const card = Cards.findOne(cardId);
    if(num <= board.labels.length)
    {
      card.toggleLabel(labels[num-1]["_id"]);
    }
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
      keys: ['/'],
      action: 'shortcut-toggle-searchbar',
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
    {
      keys: ['number keys 1-9'],
      action: 'toggle-labels'
    },
    {
      keys: ['shift + number keys 1-9'],
      action: 'remove-labels-multiselect'
    },
  ],
});

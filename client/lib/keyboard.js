import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
const hotkeys = require('hotkeys-js').default;

// XXX There is no reason to define these shortcuts globally, they should be
// attached to a template (most of them will go in the `board` template).

// Configure hotkeys filter (replaces Mousetrap.stopCallback)
// CRITICAL: Return values are INVERTED from Mousetrap's stopCallback
// hotkeys filter: true = ALLOW shortcut, false = STOP shortcut
hotkeys.filter = (event) => {
  // Are shortcuts enabled for the user?
  if (ReactiveCache.getCurrentUser() && !ReactiveCache.getCurrentUser().isKeyboardShortcuts())
    return false;

  // Always handle escape
  if (event.keyCode === 27)
    return true;

  // Make sure there are no selected characters
  if (window.getSelection().type === "Range")
    return false;

  // Decide what the current element is
  const currentElement = event.target || document.activeElement;

  // If the current element is editable, we don't want to trigger an event
  if (currentElement.isContentEditable)
    return false;

  // Make sure we are not in an input element
  if (currentElement instanceof HTMLInputElement || currentElement instanceof HTMLSelectElement || currentElement instanceof HTMLTextAreaElement)
    return false;

  // We can trigger events!
  return true;
};

// Handle non-Latin keyboards
window.addEventListener('keydown', (e) => {
  // Only handle event if coming from body
  if (e.target !== document.body) return;

  // Only handle event if it's in another language
  if (String.fromCharCode(e.which).toLowerCase() === e.key) return;

  // Trigger the corresponding action by dispatching a new event with the ASCII key
  const key = String.fromCharCode(e.which).toLowerCase();
  // Create a synthetic event for hotkeys to handle
  const syntheticEvent = new KeyboardEvent('keydown', {
    key: key,
    keyCode: e.which,
    which: e.which,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(syntheticEvent);
});

function getHoveredCardId() {
  const card = $('.js-minicard:hover').get(0);
  if (!card) return null;
  return Blaze.getData(card)._id;
}

function getSelectedCardId() {
  return Session.get('currentCard') || Session.get('selectedCard') || getHoveredCardId();
}

hotkeys('?', (event) => {
  event.preventDefault();
  FlowRouter.go('shortcuts');
});

hotkeys('w', (event) => {
  event.preventDefault();
  if (Sidebar.isOpen() && Sidebar.getView() === 'home') {
    Sidebar.toggle();
  } else {
    Sidebar.setView();
  }
});

hotkeys('q', (event) => {
  event.preventDefault();
  const currentBoardId = Session.get('currentBoard');
  const currentUserId = Meteor.userId();
  if (currentBoardId && currentUserId) {
    Filter.members.toggle(currentUserId);
  }
});

hotkeys('a', (event) => {
  event.preventDefault();
  const currentBoardId = Session.get('currentBoard');
  const currentUserId = Meteor.userId();
  if (currentBoardId && currentUserId) {
    Filter.assignees.toggle(currentUserId);
  }
});

hotkeys('x', (event) => {
  event.preventDefault();
  if (Filter.isActive()) {
    Filter.reset();
  }
});

hotkeys('f', (event) => {
  event.preventDefault();
  if (Sidebar.isOpen() && Sidebar.getView() === 'filter') {
    Sidebar.toggle();
  } else {
    Sidebar.setView('filter');
  }
});

hotkeys('/', (event) => {
  event.preventDefault();
  if (Sidebar.isOpen() && Sidebar.getView() === 'search') {
    Sidebar.toggle();
  } else {
    Sidebar.setView('search');
  }
});

hotkeys('down,up', (event, handler) => {
  event.preventDefault();
  if (!Utils.getCurrentCardId()) {
    return;
  }

  const nextFunc = handler.key === 'down' ? 'next' : 'prev';
  const nextCard = $('.js-minicard.is-selected')
    [nextFunc]('.js-minicard')
    .get(0);
  if (nextCard) {
    const nextCardId = Blaze.getData(nextCard)._id;
    Utils.goCardId(nextCardId);
  }
});

// Shift + number keys to remove labels in multiselect
const shiftNums = _.range(1, 10).map(x => `shift+${x}`).join(',');
hotkeys(shiftNums, (event, handler) => {
  event.preventDefault();
  const num = parseInt(handler.key.split('+')[1]);
  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }
  const currentBoardId = Session.get('currentBoard');
  const board = ReactiveCache.getBoard(currentBoardId);
  const labels = board.labels;
  if (MultiSelection.isActive()) {
    const cardIds = MultiSelection.getSelectedCardIds();
    for (const cardId of cardIds) {
      const card = Cards.findOne(cardId);
      if (num <= board.labels.length) {
        card.removeLabel(labels[num - 1]["_id"]);
      }
    }
  }
});

// Number keys to toggle labels
const nums = _.range(1, 10).join(',');
hotkeys(nums, (event, handler) => {
  event.preventDefault();
  const num = parseInt(handler.key);
  const currentUserId = Meteor.userId();
  const currentBoardId = Session.get('currentBoard');
  if (currentUserId === null) {
    return;
  }
  const board = ReactiveCache.getBoard(currentBoardId);
  const labels = board.labels;
  if (MultiSelection.isActive() && ReactiveCache.getCurrentUser().isBoardMember()) {
    const cardIds = MultiSelection.getSelectedCardIds();
    for (const cardId of cardIds) {
      const card = Cards.findOne(cardId);
      if (num <= board.labels.length) {
        card.addLabel(labels[num - 1]["_id"]);
      }
    }
    return;
  }

  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }
  if (ReactiveCache.getCurrentUser().isBoardMember()) {
    const card = Cards.findOne(cardId);
    if (num <= board.labels.length) {
      card.toggleLabel(labels[num - 1]["_id"]);
    }
  }
});

// Ctrl+Alt + number keys to toggle assignees
const ctrlAltNums = _.range(1, 10).map(x => `ctrl+alt+${x}`).join(',');
hotkeys(ctrlAltNums, (event, handler) => {
  event.preventDefault();
  // Make sure the current user is defined
  if (!ReactiveCache.getCurrentUser())
    return;

  // Make sure the current user is a board member
  if (!ReactiveCache.getCurrentUser().isBoardMember())
    return;

  const memberIndex = parseInt(handler.key.split("+").pop()) - 1;
  const currentBoard = Utils.getCurrentBoard();
  const validBoardMembers = currentBoard.memberUsers().filter(member => member.isBoardMember());

  if (memberIndex >= validBoardMembers.length)
    return;

  const memberId = validBoardMembers[memberIndex]._id;

  if (MultiSelection.isActive()) {
    for (const cardId of MultiSelection.getSelectedCardIds())
      Cards.findOne(cardId).toggleAssignee(memberId);
  } else {
    const cardId = getSelectedCardId();

    if (!cardId)
      return;

    Cards.findOne(cardId).toggleAssignee(memberId);
  }
});

hotkeys('m', (event) => {
  event.preventDefault();
  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }

  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }

  if (ReactiveCache.getCurrentUser().isBoardMember()) {
    const card = Cards.findOne(cardId);
    card.toggleAssignee(currentUserId);
  }
});

hotkeys('space', (event) => {
  event.preventDefault();
  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }

  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }

  if (ReactiveCache.getCurrentUser().isBoardMember()) {
    const card = Cards.findOne(cardId);
    card.toggleMember(currentUserId);
  }
});

const archiveCard = (event) => {
  event.preventDefault();
  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }

  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }

  if (Utils.canModifyBoard()) {
    const card = Cards.findOne(cardId);
    card.archive();
  }
};

// Archive card has multiple shortcuts
hotkeys('c', archiveCard);
hotkeys('-', archiveCard);

// Same as above, this time for Persian keyboard.
// https://github.com/wekan/wekan/pull/5589#issuecomment-2516776519
hotkeys('\xf7', archiveCard);

hotkeys('n', (event) => {
  event.preventDefault();
  const cardId = getSelectedCardId();
  if (!cardId) {
    return;
  }

  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }

  if (Utils.canModifyBoard()) {
    // Find the current hovered card
    const card = Cards.findOne(cardId);

    // Find the button and click it
    $(`#js-list-${card.listId} .list-body .minicards .open-minicard-composer`).click();
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
      keys: ['a'],
      action: 'shortcut-filter-my-assigned-cards',
    },
    {
      keys: ['n'],
      action: 'add-card-to-bottom-of-list',
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
      action: 'shortcut-add-self',
    },
    {
      keys: ['m'],
      action: 'shortcut-assign-self',
    },
    {
      keys: ['c', '\xf7', '-'],
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
    {
      keys: ['ctrl + alt + number keys 1-9'],
      action: 'toggle-assignees'
    },
  ],
});

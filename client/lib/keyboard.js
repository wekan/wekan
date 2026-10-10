import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Cards from '/models/cards';
import { Filter } from '/client/lib/filter';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
import { newHistoryRequestId, runKeystroke } from '/client/lib/historyKeyRequest';
import { historyRequestStorage, refreshPendingHistoryRequest } from '/client/lib/historyKeyRecovery';
import { findDueDateControl } from '/client/lib/dueDateHotkey';

// Late-bind Sidebar to avoid circular dependency (sidebar.js needs its template first)
let _Sidebar;
function getSidebar() {
  if (!_Sidebar) _Sidebar = require('/client/features/sidebar/service').getSidebarInstance;
  return _Sidebar();
}
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

  // Synthetic non-Latin keyboard events are dispatched on document, which has
  // no element APIs. Keep filtering against the focused control in that case.
  const currentElement = event.target instanceof Element
    ? event.target
    : document.activeElement;
  if (!currentElement) return false;

  // If the current element is editable, we don't want to trigger an event
  if (currentElement.isContentEditable)
    return false;

  // Make sure we are not in an input element
  if (currentElement instanceof HTMLInputElement || currentElement instanceof HTMLSelectElement || currentElement instanceof HTMLTextAreaElement)
    return false;

  if (currentElement.closest('button, a[href], summary, [role="button"], [role="tab"], [role="checkbox"]'))
    return false;

  // We can trigger events!
  return true;
};

// Handle non-Latin keyboards
window.addEventListener('keydown', (e) => {
  // Only handle event if coming from body
  if (e.target !== document.body) return;

  // Only a character typed on a non-Latin layout: one non-ASCII character.
  // Comparing it with the key code's lowercase letter also matched every
  // SHIFTED Latin key ('D', '!', and 'Shift' itself), and re-dispatched it, so
  // each Shift shortcut ran twice: Shift+D opened the due date editor and the
  // copy clicked the same control again, closing it (#6750).
  if (typeof e.key !== 'string' || e.key.length !== 1 || e.key.charCodeAt(0) < 128) return;

  // Trigger the corresponding action by dispatching a new event with the ASCII key
  const key = String.fromCharCode(e.which).toLowerCase();
  if (!/^[a-z0-9]$/.test(key)) return;
  // Create a synthetic event for hotkeys to handle, with the same modifiers,
  // so Shift shortcuts keep working on non-Latin layouts.
  const syntheticEvent = new KeyboardEvent('keydown', {
    key: key,
    keyCode: e.which,
    which: e.which,
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey,
    metaKey: e.metaKey,
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
  if (getSidebar().isOpen() && getSidebar().getView() === 'home') {
    getSidebar().toggle();
  } else {
    getSidebar().setView();
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
  if (getSidebar().isOpen() && getSidebar().getView() === 'filter') {
    getSidebar().toggle();
  } else {
    getSidebar().setView('filter');
  }
});

hotkeys('/', (event) => {
  event.preventDefault();
  if (getSidebar().isOpen() && getSidebar().getView() === 'search') {
    getSidebar().toggle();
  } else {
    getSidebar().setView('search');
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
const shiftNums = Array.from({length: 9}, (_, i) => `shift+${i + 1}`).join(',');
hotkeys(shiftNums, (event, handler) => {
  event.preventDefault();
  const num = parseInt(handler.key.split('+')[1]);
  const currentUserId = Meteor.userId();
  if (currentUserId === null) {
    return;
  }
  const currentBoardId = Session.get('currentBoard');
  const board = ReactiveCache.getBoard(currentBoardId);
  if (!board) return;
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
const nums = Array.from({length: 9}, (_, i) => i + 1).join(',');
hotkeys(nums, (event, handler) => {
  event.preventDefault();
  const num = parseInt(handler.key);
  const currentUserId = Meteor.userId();
  const currentBoardId = Session.get('currentBoard');
  if (currentUserId === null) {
    return;
  }
  const board = ReactiveCache.getBoard(currentBoardId);
  if (!board) return;
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
const ctrlAltNums = Array.from({length: 9}, (_, i) => `ctrl+alt+${i + 1}`).join(',');
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

const archiveCard = async (event) => {
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
    await card.archive();
  }
};

// Archive card has multiple shortcuts
hotkeys('c', archiveCard);
hotkeys('-', archiveCard);

// Same as above, this time for Persian keyboard.
// https://github.com/wekan/wekan/pull/5589#issuecomment-2516776519
hotkeys('\xf7', archiveCard);

// #6478: Undo / Redo the caller's last position change (card / list / swimlane
// move) with Ctrl+Z / Ctrl+Y (also Cmd+Z / Cmd+Shift+Z on macOS). The hotkeys
// filter above disables shortcuts inside inputs/textareas/contentEditable, so
// native text undo/redo keeps working while typing. Only enabled for members who
// can modify the board.
// Each keystroke carries a request ID kept in sessionStorage until the server
// answers, so a reply lost to a disconnect or reload is retried rather than
// repeated (client/lib/historyKeyRequest.js).
export function undoRedoLast(direction) {
  const boardId = Session.get('currentBoard');
  if (!boardId || !Utils.canModifyBoard()) {
    return Promise.resolve();
  }
  const storage = historyRequestStorage();
  // Whatever happens, the recovery notice shows what is still unanswered
  // (client/lib/historyKeyRecovery.js).
  return runKeystroke({
    storage,
    call: (method, ...args) => Meteor.callAsync(method, ...args),
    boardId,
    direction,
    newId: newHistoryRequestId(),
  }).catch(() => {}).then(() => refreshPendingHistoryRequest(storage));
}
hotkeys('ctrl+z, command+z', event => {
  event.preventDefault();
  undoRedoLast('undo');
});
hotkeys('ctrl+y, ctrl+shift+z, command+shift+z', event => {
  event.preventDefault();
  undoRedoLast('redo');
});

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

// #6750: `d` (and Shift+D, so a capital D works too) opens the Due date
// editor of the OPENED card - the same popup as clicking the due date `+` or
// badge in the card details, by clicking that very control. Like every
// shortcut here it runs only through hotkeys.filter above: nothing when the
// user turned keyboard shortcuts off, nothing while typing in an input,
// textarea or contentEditable. It needs Utils.canModifyCard for the card; the
// card details render the control only for a user who may edit the due date,
// so without one nothing happens.
function clickDueDateControl(cardId) {
  const card = ReactiveCache.getCard(cardId);
  if (!card) return false;
  const control = findDueDateControl(document, {
    cardId,
    canModifyCard: Utils.canModifyCard(card),
    dataOf: element => Blaze.getData(element),
  });
  if (!control) return false;
  control.click();
  return true;
}
export function openDueDateEditorOfOpenedCard() {
  if (Meteor.userId() === null) return false;
  const cardId = Utils.getCurrentCardId();
  if (cardId) return clickDueDateControl(cardId);
  // #6755: with no card opened, `d` on a hovered or selected minicard - the
  // card every other card shortcut here acts on - opens that card and then
  // its Due date editor, rather than doing nothing until the card is opened.
  const minicardId = Session.get('selectedCard') || getHoveredCardId();
  const minicard = minicardId && ReactiveCache.getCard(minicardId);
  if (!minicard || !Utils.canModifyCard(minicard)) return false;
  Utils.goCardId(minicardId);
  // The card details render after the route changes; wait for its control,
  // and give up quietly if it never comes (no due dates on this board).
  const started = Date.now();
  const tryClick = () => {
    if (Utils.getCurrentCardId() === minicardId && clickDueDateControl(minicardId)) return;
    if (Date.now() - started < 3000) setTimeout(tryClick, 50);
  };
  setTimeout(tryClick, 0);
  return true;
}
hotkeys('d, shift+d', (event) => {
  event.preventDefault();
  openDueDateEditorOfOpenedCard();
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
      keys: ['d'],
      action: 'shortcut-edit-due-date',
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

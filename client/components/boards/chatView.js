import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';
import { Utils } from '/client/lib/utils';
import { TAPi18n } from '/imports/i18n';

const {
  DEFAULT_LAYOUT, cleanChatLayout, paneOrder, resizePane, buildChannelTree,
  dropNeighbours, dropAllowed,
} = require('/models/lib/chatView');
const { dropPosition, moveWorkspace } = require('/models/lib/workspacesTree');

// Board View / Chat (chatView.jade). The layout is the member's
// (profile.chatViewLayout): read reactively from the user document, changed
// locally while a border is dragged, and saved once when the drag ends.

const selectedCardId = new ReactiveVar(null);
const dragLayout = new ReactiveVar(null);

// The channel tree (server/chatView.js): the summary of the member's
// conversations, the boards opened with all their cards, and which rows are
// open - kept in this browser, a per-viewer convenience.
const channelSummary = new ReactiveVar(null);
const fullBoards = new ReactiveVar({});
// The board the member is on shows all its cards unless they chose only
// the ones with messages; its cards come from the board's own subscription,
// so a card dragged to another list moves in the tree at once.
const messagesOnly = new ReactiveVar(new Set());
function currentBoardStructure() {
  const boardId = Utils.getCurrentBoardId();
  if (!boardId || messagesOnly.get().has(boardId)) return null;
  const live = item => item && !item.archived;
  return {
    swimlanes: (ReactiveCache.getSwimlanes({ boardId, archived: false }) || []).filter(live)
      .map(s => ({ _id: s._id, boardId, title: s.title || '', sort: s.sort })),
    lists: (ReactiveCache.getLists({ boardId, archived: false }) || []).filter(live)
      .map(l => ({ _id: l._id, boardId, title: l.title || '', sort: l.sort, swimlaneId: l.swimlaneId || '' })),
    cards: (ReactiveCache.getCards({ boardId, archived: false }) || []).filter(live)
      .map(c => ({ cardId: c._id, boardId, swimlaneId: c.swimlaneId, listId: c.listId, title: c.title || '', sort: c.sort })),
  };
}
// { 'board:<id>': true, 'list:<id>': false, ... }: what the member opened
// or closed; every other row is as defaultOpen says.
const OPEN_KEY = 'wekan-chat-view-open';
const readOpen = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(OPEN_KEY) || '{}');
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch (e) { return {}; }
};
const openRows = new ReactiveVar(readOpen());
function setOpen(key, open) {
  const next = { ...openRows.get(), [key]: !!open };
  const keys = Object.keys(next);
  for (const old of keys.slice(0, Math.max(0, keys.length - 500))) delete next[old];
  openRows.set(next);
  try { window.localStorage.setItem(OPEN_KEY, JSON.stringify(next)); } catch (e) { /* not kept */ }
}
let reloadTimer = null;
function loadChannels(delay = 0) {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => Meteor.call('chatViewChannels', (error, summary) => {
    if (!error) channelSummary.set(summary);
  }), delay);
}
function loadFullBoard(boardId) {
  Meteor.call('chatViewBoardChannels', boardId, (error, full) => {
    if (!error) fullBoards.set({ ...fullBoards.get(), [boardId]: full });
  });
}
// The rows open before the member opened or closed any: the board they are
// on and the workspaces above it.
function defaultOpen(key) {
  const boardId = Utils.getCurrentBoardId();
  if (key === `board:${boardId}`) return true;
  // Under a board that is open, its swimlanes and lists are too.
  if (key.startsWith('swimlane:') || key.startsWith('list:')) return true;
  if (!key.startsWith('workspace:')) return false;
  const user = ReactiveCache.getCurrentUser();
  const profile = (user && user.profile) || {};
  const assigned = profile.boardWorkspaceAssignments && profile.boardWorkspaceAssignments[boardId];
  if (!assigned) return false;
  const find = (nodes, id) => {
    for (const node of nodes || []) {
      if (node.id === id) return node;
      const inner = find(node.children, id);
      if (inner) return inner;
    }
    return null;
  };
  const holds = node => !!node && (node.id === assigned || (node.children || []).some(holds));
  return holds(find(profile.boardWorkspacesTree, key.slice('workspace:'.length)));
}
const isOpen = (kind, id) => {
  const key = `${kind}:${id}`;
  const chosen = openRows.get();
  return Object.prototype.hasOwnProperty.call(chosen, key) ? chosen[key] === true : defaultOpen(key);
};

// The language's direction, reactively: the panes re-order the moment the
// member switches to or from a right-to-left language.
function isRtl() {
  return !!(TAPi18n.getLanguageDirection && TAPi18n.getLanguageDirection() === 'rtl');
}

// Blaze hands over jQuery's event when jQuery is there, the DOM's otherwise.
const nativeEvent = event => event.originalEvent || event;

function layout() {
  const live = dragLayout.get();
  if (live) return live;
  const user = ReactiveCache.getCurrentUser();
  return cleanChatLayout(user && user.profile && user.profile.chatViewLayout);
}

function saveLayout(next) {
  const clean = cleanChatLayout(next);
  Meteor.call('setChatViewLayout', clean, () => dragLayout.set(null));
}

// The card opened in the middle, from any board in the tree: its own data
// (popupCardData) and conversation (chatViewCardComments) are subscribed.
function selectedCard() {
  const id = selectedCardId.get();
  return (id && ReactiveCache.getCard(id)) || null;
}

Template.chatView.onCreated(function () {
  // The member's boards, for the Workspaces tree; the open board's own
  // swimlanes, lists and cards are already subscribed by the board page.
  this.subscribe('boards');
  this.autorun(() => {
    const id = selectedCardId.get();
    if (id) {
      this.subscribe('popupCardData', id);
      this.subscribe('chatViewCardComments', id);
    }
  });
});

Template.chatView.helpers({
  dir() { return isRtl() ? 'rtl' : 'ltr'; },
  // The panes in SCREEN order: a flex row with dir=rtl would reverse them by
  // itself, so the container is always laid out left to right (see the css)
  // and the order is decided here, once.
  panes() { return paneOrder(isRtl()); },
  // The border to the end of a pane resizes the tree or the chat - the side
  // panes. The card pane between them takes what is left.
  resizerAfter(pane) {
    const order = paneOrder(isRtl());
    const at = order.indexOf(pane);
    if (at === order.length - 1) return null;
    const next = order[at + 1];
    const side = pane === 'card' ? next : pane;
    const l = layout();
    if (side === 'tree' && l.treeCollapsed) return null;
    if (side === 'chat' && l.chatCollapsed) return null;
    return side;
  },
});

const paneHelpers = {
  collapsed(pane) { return layout()[`${pane}Collapsed`] === true; },
  width(pane) { return layout()[`${pane}Width`] || DEFAULT_LAYOUT[`${pane}Width`]; },
  selectedCard,
};
Template.chatViewTreePane.onCreated(function () {
  loadChannels();
  // A message written on this board - here or anywhere - is a reason to look
  // again: a board's first message moves it out of Other boards.
  this.autorun(() => {
    const boardId = Utils.getCurrentBoardId();
    if (boardId) CardComments.find({ boardId }).count();
    loadChannels(500);
  });
  this.refresh = Meteor.setInterval(() => loadChannels(), 60000);
});
Template.chatViewTreePane.onDestroyed(function () {
  Meteor.clearInterval(this.refresh);
});
Template.chatViewTreePane.helpers({
  ...paneHelpers,
  treeDir() { return isRtl() ? 'rtl' : 'ltr'; },
  channelTree() {
    const user = ReactiveCache.getCurrentUser();
    const profile = (user && user.profile) || {};
    const full = { ...fullBoards.get() };
    const current = currentBoardStructure();
    if (current) full[Utils.getCurrentBoardId()] = current;
    return buildChannelTree(channelSummary.get(), profile.boardWorkspacesTree, profile.boardWorkspaceAssignments, full);
  },
});

const treeHelpers = {
  isOpen,
  // On the board the member is on: only there can rows be dragged, since a
  // drop moves things on the open board.
  isCurrentNode() { return this.boardId === Utils.getCurrentBoardId(); },
  isSelected(id) { return selectedCardId.get() === id; },
};
Template.chatViewWorkspaceNode.helpers(treeHelpers);
Template.chatViewBoardNode.helpers(treeHelpers);
Template.chatViewUnread.helpers({
  countText() { return this.count > 99 ? '99+' : String(this.count); },
});
Template.chatViewCardPane.helpers(paneHelpers);
Template.chatViewChatPane.helpers({
  ...paneHelpers,
  messages() {
    const card = selectedCard();
    if (!card) return [];
    const me = Meteor.userId();
    return CardComments.find({ cardId: card._id }, { sort: { createdAt: 1 } }).fetch().map(c => {
      const user = ReactiveCache.getUser(c.userId);
      return {
        _id: c._id,
        userId: c.userId,
        mine: c.userId === me,
        author: user ? ((user.profile && user.profile.fullname) || user.username) : '',
        time: c.createdAt ? new Date(c.createdAt).toLocaleString() : '',
        text: c.text,
      };
    });
  },
  canComment() {
    // The comment capability on the CARD's board, as the server decides
    // (read-only roles too).
    const card = selectedCard();
    return !!(card && Utils.currentUserCan('comment', ReactiveCache.getBoard(card.boardId)));
  },
});

// --- Drag and drop ------------------------------------------------------

let dragged = null;

async function dropOn(target, position) {
  const boardId = Utils.getCurrentBoardId();
  const { kind, id } = dragged;
  const targetKind = target.dataset.kind;
  const targetId = target.dataset.id;
  if (!dropAllowed(kind, targetKind) || id === targetId) return;

  if (kind === 'workspace') {
    const user = ReactiveCache.getCurrentUser();
    const tree = (user.profile && user.profile.boardWorkspacesTree) || [];
    const next = moveWorkspace(tree, id, targetId, position);
    if (next !== tree) Meteor.call('setWorkspacesTree', next);
    return;
  }
  if (kind === 'board') {
    Meteor.call('assignBoardToWorkspace', id, targetId);
    return;
  }
  if (kind === 'swimlane') {
    const siblings = ReactiveCache.getSwimlanes({ boardId, archived: false }) || [];
    const { prev, next } = dropNeighbours(siblings, id, targetId, position === 'before' ? 'before' : 'after');
    Swimlanes.update(id, { $set: { sort: Utils.calculateIndexData(prev, next, 1).base } });
    return;
  }
  if (kind === 'list') {
    const targetList = ReactiveCache.getList(targetId);
    const siblings = (ReactiveCache.getLists({ boardId, archived: false }) || [])
      .filter(l => !l.swimlaneId || l.swimlaneId === target.dataset.swimlaneId);
    const { prev, next } = dropNeighbours(siblings, id, targetId, position === 'before' ? 'before' : 'after');
    const update = { sort: Utils.calculateIndexData(prev, next, 1).base };
    if (targetList && targetList.swimlaneId) update.swimlaneId = targetList.swimlaneId;
    await Meteor.callAsync('updateListSort', id, boardId, update);
    return;
  }
  // A card: before/after a card, or onto a list (its end). Where it lands is
  // read from the TREE it was dropped on - the list and swimlane the member
  // sees - not from a cached copy of the target card, which can still hold
  // the list it was in before a move a moment ago.
  const card = Cards.findOne(id);
  if (!card) return;
  const listId = targetKind === 'list' ? targetId : target.closest('[data-kind="list"]').dataset.id;
  const swimlaneId = target.closest('[data-kind="swimlane"]').dataset.id;
  const siblings = Cards.find({ boardId, listId, swimlaneId, archived: false }).fetch();
  const neighbours = targetKind === 'list'
    ? dropNeighbours(siblings, id, null, 'after')
    : dropNeighbours(siblings, id, targetId, position === 'before' ? 'before' : 'after');
  await card.move(boardId, swimlaneId, listId, Utils.calculateIndexData(neighbours.prev, neighbours.next, 1).base);
}

Template.chatView.events({
  'click .js-chat-fold'(event) {
    event.preventDefault();
    saveLayout({ ...layout(), [`${event.currentTarget.dataset.pane}Collapsed`]: true });
  },
  'click .js-chat-unfold'(event) {
    event.preventDefault();
    saveLayout({ ...layout(), [`${event.currentTarget.dataset.pane}Collapsed`]: false });
  },
  // A card is a channel: it opens in the middle, with its conversation
  // beside it - from any board, without leaving the board the member is on.
  'click .js-chat-select-card'(event) {
    const link = event.target.closest && event.target.closest('a[href]');
    if (link && event.currentTarget.contains(link)) return;
    event.preventDefault();
    selectedCardId.set(event.currentTarget.dataset.cardId);
  },
  // A workspace, board, swimlane or list folds or unfolds; a board without
  // a conversation shows all its cards when opened, to write the first one.
  'click .js-chat-toggle'(event) {
    const link = event.target.closest && event.target.closest('a[href], button');
    if (link && event.currentTarget.contains(link)) return;
    event.preventDefault();
    const key = event.currentTarget.dataset.key;
    const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    const open = !isOpen(kind, id);
    setOpen(key, open);
    if (open && kind === 'board' && id !== Utils.getCurrentBoardId()) {
      const summary = channelSummary.get();
      const talking = summary && summary.channels.some(c => c.boardId === id);
      if (!talking && !fullBoards.get()[id]) loadFullBoard(id);
    }
  },
  'keydown .js-chat-toggle, keydown .js-chat-select-card'(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.currentTarget.click();
  },
  'click .js-chat-all-cards'(event) {
    event.preventDefault();
    event.stopPropagation();
    const boardId = event.currentTarget.dataset.boardId;
    if (boardId === Utils.getCurrentBoardId()) {
      const only = new Set(messagesOnly.get());
      if (only.has(boardId)) only.delete(boardId); else only.add(boardId);
      messagesOnly.set(only);
    } else {
      const full = { ...fullBoards.get() };
      if (full[boardId]) { delete full[boardId]; fullBoards.set(full); } else loadFullBoard(boardId);
    }
    setOpen(`board:${boardId}`, true);
  },

  // Resize: the pointer is captured on the handle, the width follows it
  // locally, and the layout is saved once on release.
  'pointerdown .js-chat-resize'(event) {
    const handle = event.currentTarget;
    const pane = handle.dataset.pane;
    const rtl = isRtl();
    const start = event.clientX;
    const base = layout();
    handle.setPointerCapture(event.pointerId);
    const move = e => dragLayout.set(resizePane(base, pane, e.clientX - start, rtl));
    const up = e => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      saveLayout(resizePane(base, pane, e.clientX - start, rtl));
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  },
  // The keyboard way to the same thing: arrows move the border 16px.
  'keydown .js-chat-resize'(event) {
    const step = { ArrowLeft: -16, ArrowRight: 16 }[event.key];
    if (!step) return;
    event.preventDefault();
    saveLayout(resizePane(layout(), event.currentTarget.dataset.pane, step, isRtl()));
  },

  'dragstart .js-chat-draggable'(event) {
    event.stopPropagation();
    const node = event.currentTarget;
    dragged = { kind: node.dataset.kind, id: node.dataset.id };
    const dt = nativeEvent(event).dataTransfer;
    if (dt) {
      dt.effectAllowed = 'move';
      dt.setData('text/plain', node.dataset.id);
    }
  },
  'dragover .js-chat-drop'(event) {
    if (!dragged || !dropAllowed(dragged.kind, event.currentTarget.dataset.kind)) return;
    event.preventDefault();
    event.stopPropagation();
  },
  async 'drop .js-chat-drop'(event) {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    const row = target.querySelector('.chat-view-row') || target;
    const rect = row.getBoundingClientRect();
    const position = dropPosition(nativeEvent(event).clientY - rect.top, rect.height);
    try {
      await dropOn(target, position);
    } finally {
      dragged = null;
    }
  },
  'dragend .js-chat-draggable'() { dragged = null; },

  'submit .js-chat-send'(event, tpl) {
    event.preventDefault();
    const input = tpl.$('.js-chat-input');
    const text = String(input.val() || '').trim();
    const card = selectedCard();
    if (!text || !card) return;
    CardComments.insert({ text, boardId: card.boardId, cardId: card._id, parentId: '' });
    input.val('');
    loadChannels(500);
  },
  // Enter sends, Shift+Enter is a new line - as in Slack and Rocket.Chat.
  'keydown .js-chat-input'(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      $(event.currentTarget).closest('form').trigger('submit');
    }
  },
});

// The open channel is read: a message arriving while it is open is seen, so
// its unread count does not grow.
Template.chatViewChatPane.onCreated(function () {
  this.autorun(() => {
    const id = selectedCardId.get();
    if (!id) return;
    CardComments.find({ cardId: id }).count();
    Tracker.nonreactive(() => {
      const user = ReactiveCache.getCurrentUser();
      if (user && typeof user.setCardLastViewed === 'function') Promise.resolve(user.setCardLastViewed(id)).then(() => loadChannels(1000), () => {});
    });
  });
});

// Keep the newest message in view, as a chat does.
Template.chatViewChatPane.onRendered(function () {
  this.autorun(() => {
    Template.currentData();
    selectedCardId.get();
    CardComments.find({ cardId: selectedCardId.get() }).count();
    Tracker.afterFlush(() => {
      const box = this.find('.js-chat-messages');
      if (box) box.scrollTop = box.scrollHeight;
    });
  });
});


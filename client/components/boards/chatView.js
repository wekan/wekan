import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import Swimlanes from '/models/swimlanes';
import { Utils } from '/client/lib/utils';
import { TAPi18n } from '/imports/i18n';

const {
  DEFAULT_LAYOUT, cleanChatLayout, paneOrder, resizePane, buildBoardTree, buildWorkspaceTree,
  dropNeighbours, dropAllowed,
} = require('/models/lib/chatView');
const { dropPosition, moveWorkspace } = require('/models/lib/workspacesTree');

// Board View / Chat (chatView.jade). The layout is the member's
// (profile.chatViewLayout): read reactively from the user document, changed
// locally while a border is dragged, and saved once when the drag ends.

const selectedCardId = new ReactiveVar(null);
const dragLayout = new ReactiveVar(null);

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

function selectedCard() {
  const id = selectedCardId.get();
  const card = id && ReactiveCache.getCard(id);
  return card && card.boardId === Utils.getCurrentBoardId() ? card : null;
}

Template.chatView.onCreated(function () {
  // The member's boards, for the Workspaces tree; the open board's own
  // swimlanes, lists and cards are already subscribed by the board page.
  this.subscribe('boards');
  this.autorun(() => {
    const id = selectedCardId.get();
    if (id) this.subscribe('popupCardData', id);
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
Template.chatViewTreePane.helpers({
  ...paneHelpers,
  workspaceTree() {
    const user = ReactiveCache.getCurrentUser();
    const profile = (user && user.profile) || {};
    const boards = (ReactiveCache.getBoards({ archived: false, type: 'board', 'members.userId': user && user._id },
      { sort: { title: 1 } }) || []).map(b => ({ _id: b._id, title: b.title, slug: b.slug }));
    return buildWorkspaceTree(profile.boardWorkspacesTree, profile.boardWorkspaceAssignments, boards);
  },
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
    // The comment capability, as the server decides (read-only roles too).
    return !!(selectedCard() && Utils.currentUserCan('comment'));
  },
});

Template.chatViewBoard.helpers({
  isCurrentBoard() { return this._id === Utils.getCurrentBoardId(); },
  isSelected(id) { return selectedCardId.get() === id; },
  boardTree() {
    const boardId = Utils.getCurrentBoardId();
    return buildBoardTree({
      swimlanes: ReactiveCache.getSwimlanes({ boardId, archived: false }) || [],
      lists: ReactiveCache.getLists({ boardId, archived: false }) || [],
      cards: ReactiveCache.getCards({ boardId, archived: false }) || [],
    });
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
  'click .js-chat-select-card'(event) {
    event.preventDefault();
    selectedCardId.set(event.currentTarget.dataset.cardId);
  },
  'click .js-chat-open-board'(event) {
    event.preventDefault();
    const boardId = event.currentTarget.dataset.boardId;
    if (boardId === Utils.getCurrentBoardId()) return;
    const board = Boards.findOne(boardId);
    if (board) FlowRouter.go('board', { id: boardId, slug: board.slug });
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
  },
  // Enter sends, Shift+Enter is a new line - as in Slack and Rocket.Chat.
  'keydown .js-chat-input'(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      $(event.currentTarget).closest('form').trigger('submit');
    }
  },
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


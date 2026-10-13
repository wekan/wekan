'use strict';

// Board View / Chat: the board as a Slack / Rocket.Chat workspace. The pure
// parts - the saved layout, the pane order for the reading direction, the
// channel tree and where a drop goes - with no Meteor and no DOM, so
// tests/chatView.test.cjs runs them with plain Node.
//
//   tree   Workspaces > boards > swimlanes > lists > cards (the channels)
//   card   the selected card
//   chat   its comments, as messages
//
// Left to right the panes are tree | card | chat; right to left they are
// mirrored. Each can be collapsed, and the two borders between them dragged;
// both are saved on the member's profile (profile.chatViewLayout).

const PANES = Object.freeze(['tree', 'card', 'chat']);
const MIN_WIDTH = 160;
const MAX_WIDTH = 1200;
const DEFAULT_LAYOUT = Object.freeze({
  treeWidth: 280,
  chatWidth: 380,
  treeCollapsed: false,
  cardCollapsed: false,
  chatCollapsed: false,
});

const clampWidth = (value, fallback) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, n));
};

// Only known keys with valid values, so a stored or submitted layout can never
// carry anything else onto the profile.
function cleanChatLayout(layout) {
  const input = layout && typeof layout === 'object' ? layout : {};
  return {
    treeWidth: clampWidth(input.treeWidth, DEFAULT_LAYOUT.treeWidth),
    chatWidth: clampWidth(input.chatWidth, DEFAULT_LAYOUT.chatWidth),
    treeCollapsed: input.treeCollapsed === true,
    cardCollapsed: input.cardCollapsed === true,
    chatCollapsed: input.chatCollapsed === true,
  };
}

// The panes in visual order, start to end of the SCREEN: the start side is
// the left in a left-to-right language and the right in a right-to-left one.
function paneOrder(rtl) {
  return rtl ? [...PANES].reverse() : [...PANES];
}

// A resize handle moved by `dx` screen pixels (positive = to the right). The
// tree pane's border is on its end side and the chat pane's on its start
// side, so which way is "wider" depends on the direction.
function resizePane(layout, pane, dx, rtl) {
  const clean = cleanChatLayout(layout);
  const d = Number(dx) || 0;
  if (pane === 'tree') clean.treeWidth = clampWidth(clean.treeWidth + (rtl ? -d : d), clean.treeWidth);
  if (pane === 'chat') clean.chatWidth = clampWidth(clean.chatWidth + (rtl ? d : -d), clean.chatWidth);
  return clean;
}

const bySort = (a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0);

// The board as channels: swimlanes, the lists in each (a list with no
// swimlaneId is shared by every swimlane, as on the board), and the cards of
// that swimlane and list. Archived things are not channels.
function buildBoardTree({ swimlanes = [], lists = [], cards = [] } = {}) {
  const live = item => item && !item.archived;
  return swimlanes.filter(live).sort(bySort).map(swimlane => ({
    _id: swimlane._id,
    kind: 'swimlane',
    title: swimlane.title,
    lists: lists.filter(live)
      .filter(list => !list.swimlaneId || list.swimlaneId === swimlane._id)
      .sort(bySort)
      .map(list => ({
        _id: list._id,
        kind: 'list',
        title: list.title,
        swimlaneId: swimlane._id,
        cards: cards.filter(live)
          .filter(card => card.listId === list._id && card.swimlaneId === swimlane._id)
          .sort(bySort)
          .map(card => ({ _id: card._id, kind: 'card', title: card.title, sort: card.sort,
            comments: card.commentCount || 0 })),
      })),
  }));
}

// The Workspaces of All Boards, with each board in the workspace it is
// assigned to; boards in no workspace are listed after the tree.
function buildWorkspaceTree(tree, assignments, boards) {
  const map = assignments && typeof assignments === 'object' ? assignments : {};
  const all = Array.isArray(boards) ? boards : [];
  const placed = new Set();
  const walk = nodes => (Array.isArray(nodes) ? nodes : []).map(node => {
    const inside = all.filter(b => map[b._id] === node.id);
    inside.forEach(b => placed.add(b._id));
    return { id: node.id, name: node.name, boards: inside, children: walk(node.children) };
  });
  const workspaces = walk(tree);
  return { workspaces, unassigned: all.filter(b => !placed.has(b._id)) };
}

// Where a dropped item goes, among its siblings sorted by `sort`: before or
// after the target. Returns { prev, next } - the neighbours the new sort index
// goes between (Utils.calculateIndexData) - leaving the dragged item out.
function dropNeighbours(siblings, draggedId, targetId, position) {
  const ordered = (Array.isArray(siblings) ? siblings : []).filter(s => s._id !== draggedId).sort(bySort);
  const at = ordered.findIndex(s => s._id === targetId);
  if (at < 0) return { prev: ordered[ordered.length - 1] || null, next: null };
  return position === 'before'
    ? { prev: ordered[at - 1] || null, next: ordered[at] }
    : { prev: ordered[at], next: ordered[at + 1] || null };
}

// What a drop may do. A card goes before or after a card, or into a list (at
// its end); a list before or after a list; a swimlane before or after a
// swimlane. Anything else - a card onto a swimlane, a swimlane into a list -
// is refused rather than guessed.
function dropAllowed(dragKind, targetKind) {
  return (dragKind === 'card' && (targetKind === 'card' || targetKind === 'list'))
    || (dragKind === 'list' && targetKind === 'list')
    || (dragKind === 'swimlane' && targetKind === 'swimlane')
    || (dragKind === 'workspace' && targetKind === 'workspace')
    || (dragKind === 'board' && targetKind === 'workspace');
}

module.exports = {
  PANES,
  MIN_WIDTH,
  MAX_WIDTH,
  DEFAULT_LAYOUT,
  cleanChatLayout,
  paneOrder,
  resizePane,
  buildBoardTree,
  buildWorkspaceTree,
  dropNeighbours,
  dropAllowed,
};

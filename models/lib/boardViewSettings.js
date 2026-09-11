'use strict';

// Board Settings / Board View: which entries of the Board View menu a board
// offers, and which one it opens in, separately for a PUBLIC and a PRIVATE
// board (design: docs/Features/Board/Board-View-Settings.md).
//
// Pure CommonJS, no Meteor: the client (the popup, the view menu and
// Utils.boardView), the server (the Board instance setters) and the
// tests/*.test.cjs guards all load this ONE table and these decisions, so
// the menu, the popup and the fallback can not drift apart.
//
// Stored on the board as
//   boardViewSettings:       { '<view>': { showOnPublic, showOnPrivate } }
//   defaultPublicBoardView:  '<view>'
//   defaultPrivateBoardView: '<view>'
// A missing entry or a missing side means SHOWN, and a missing default is
// Swimlanes - a board that never opened the popup behaves as it always did.

// The Board View menu, top to bottom - the same order and the same label
// keys as client/components/boards/boardHeader.jade (boardChangeViewPopup).
// tests/boardViewSettings.test.cjs fails when the two differ.
const BOARD_VIEWS = [
  { view: 'board-view-swimlanes', labelKey: 'swimlanes', icon: 'fa-th-large' },
  { view: 'board-view-lists', labelKey: 'board-view-lists', icon: 'fa-trello' },
  { view: 'board-view-table', labelKey: 'board-view-table', icon: 'fa-table' },
  { view: 'board-view-cal', labelKey: 'board-view-cal', icon: 'fa-calendar' },
  { view: 'board-view-multiboard-cal', labelKey: 'board-view-multiboard-cal', icon: 'fa-calendar-plus-o' },
  { view: 'board-view-time', labelKey: 'board-view-time', icon: 'fa-clock-o' },
  { view: 'board-view-timeline', labelKey: 'board-view-timeline', icon: 'fa-history' },
  { view: 'board-view-stats', labelKey: 'board-view-stats', icon: 'fa-pie-chart' },
  { view: 'board-view-group-by-assignee', labelKey: 'board-view-group-by-assignee', icon: 'fa-users' },
  { view: 'board-view-gantt', labelKey: 'board-view-gantt', icon: 'fa-bar-chart' },
  { view: 'board-view-gantt-frappe', labelKey: 'board-view-gantt-frappe', icon: 'fa-tasks' },
  { view: 'board-view-gantt-dhtmlx', labelKey: 'board-view-gantt-dhtmlx', icon: 'fa-list-alt' },
  { view: 'board-view-roadmap', labelKey: 'board-view-roadmap', icon: 'fa-road' },
  { view: 'board-view-dashboard', labelKey: 'board-view-dashboard', icon: 'fa-tachometer' },
  { view: 'board-view-bigboard', labelKey: 'board-view-bigboard', icon: 'fa-th' },
  { view: 'board-view-burndown', labelKey: 'board-view-burndown', icon: 'fa-line-chart' },
  { view: 'board-view-burnup', labelKey: 'board-view-burnup', icon: 'fa-area-chart' },
  { view: 'board-view-cumulative-flow', labelKey: 'board-view-cumulative-flow', icon: 'fa-signal' },
  { view: 'board-view-control-chart', labelKey: 'board-view-control-chart', icon: 'fa-crosshairs' },
  { view: 'board-view-cycle-time', labelKey: 'board-view-cycle-time', icon: 'fa-refresh' },
  { view: 'board-view-flow-efficiency', labelKey: 'board-view-flow-efficiency', icon: 'fa-percent' },
  { view: 'board-view-lead-time', labelKey: 'board-view-lead-time', icon: 'fa-hourglass-half' },
  { view: 'board-view-throughput-histogram', labelKey: 'board-view-throughput-histogram', icon: 'fa-columns' },
  { view: 'board-view-wip-run', labelKey: 'board-view-wip-run', icon: 'fa-flag-checkered' },
  { view: 'board-view-pulse', labelKey: 'board-view-pulse', icon: 'fa-heartbeat' },
];

const DEFAULT_BOARD_VIEW = 'board-view-swimlanes';

const VIEW_KEYS = BOARD_VIEWS.map(v => v.view);

function isKnownBoardView(view) {
  return VIEW_KEYS.includes(view);
}

// 'public' or 'private'; anything else (undefined on a board doc that
// predates the field, a typo) is treated as private, the safer side.
function normalizeVisibility(visibility) {
  return visibility === 'public' ? 'public' : 'private';
}

function showField(visibility) {
  return normalizeVisibility(visibility) === 'public' ? 'showOnPublic' : 'showOnPrivate';
}

function defaultField(visibility) {
  return normalizeVisibility(visibility) === 'public'
    ? 'defaultPublicBoardView'
    : 'defaultPrivateBoardView';
}

function isBoardViewShown(board, view, visibility) {
  const settings = (board && board.boardViewSettings) || {};
  const entry = settings[view];
  if (!entry || typeof entry !== 'object') return true;
  const value = entry[showField(visibility)];
  return value !== false;
}

function defaultBoardView(board, visibility) {
  const value = board && board[defaultField(visibility)];
  return isKnownBoardView(value) ? value : DEFAULT_BOARD_VIEW;
}

function visibleBoardViews(board, visibility) {
  return BOARD_VIEWS.filter(v => isBoardViewShown(board, v.view, visibility));
}

// The view to RENDER for this board: what the user asked for when the board
// offers it, otherwise the board's default for its visibility. The default
// is always shown (the setters keep that invariant), but a document edited
// by hand could break it, so the last resort is Swimlanes regardless - a
// user is never left on a view that renders nothing.
function resolveBoardView(board, requestedView) {
  if (!board) return requestedView;
  const visibility = board.permission;
  if (isKnownBoardView(requestedView) && isBoardViewShown(board, requestedView, visibility)) {
    return requestedView;
  }
  const fallback = defaultBoardView(board, visibility);
  if (isBoardViewShown(board, fallback, visibility)) return fallback;
  return DEFAULT_BOARD_VIEW;
}

// $set for a "Show on Public/Private Board" click. null when the click would
// hide that side's default view: a default must stay reachable, so the
// popup ignores the click and the admin picks another default first.
function showBoardViewModifier(board, view, visibility, shown) {
  if (!isKnownBoardView(view)) return null;
  const on = shown !== false;
  if (!on && defaultBoardView(board, visibility) === view) return null;
  return { [`boardViewSettings.${view}.${showField(visibility)}`]: on };
}

// $set for a "Default on Public/Private Board" click: radio semantics - the
// one field holds the one default, so setting it un-sets the previous one -
// and the new default is shown on that side, whatever its box said before.
function defaultBoardViewModifier(board, view, visibility) {
  if (!isKnownBoardView(view)) return null;
  return {
    [defaultField(visibility)]: view,
    [`boardViewSettings.${view}.${showField(visibility)}`]: true,
  };
}

module.exports = {
  BOARD_VIEWS,
  DEFAULT_BOARD_VIEW,
  isKnownBoardView,
  normalizeVisibility,
  isBoardViewShown,
  defaultBoardView,
  visibleBoardViews,
  resolveBoardView,
  showBoardViewModifier,
  defaultBoardViewModifier,
};

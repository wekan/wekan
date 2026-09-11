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

// The menu's default order, which is also the popup's default row order.
const DEFAULT_BOARD_VIEW_ORDER = VIEW_KEYS.slice();

// After which entries the menu draws a separator - only in the DEFAULT
// order, where the groups (board views / calendars and time / statistics /
// grouping / the Gantts / roadmap, dashboard, bigboard / the charts) still
// mean something. A custom order has no groups and no separators.
const SEPARATOR_AFTER = [
  'board-view-table',
  'board-view-timeline',
  'board-view-stats',
  'board-view-group-by-assignee',
  'board-view-gantt-dhtmlx',
  'board-view-bigboard',
];

// The class the per-view click handlers in boardHeader.js listen for:
// 'board-view-gantt-frappe' -> 'js-open-gantt-frappe-view'.
function boardViewJsClass(view) {
  return `js-open-${view.replace(/^board-view-/, '')}-view`;
}

function isKnownBoardView(view) {
  return VIEW_KEYS.includes(view);
}

// A stored order made whole (same shape as models/lib/cardFieldOrder.js):
// unknown keys and duplicates are dropped, and every known view that is
// missing is appended in its default position, so the menu always lists
// every view exactly once, whatever an old or hand-edited document holds.
function normalizeBoardViewOrder(storedOrder) {
  const seen = new Set();
  const result = [];
  if (Array.isArray(storedOrder)) {
    storedOrder.forEach(view => {
      if (typeof view === 'string' && isKnownBoardView(view) && !seen.has(view)) {
        seen.add(view);
        result.push(view);
      }
    });
  }
  DEFAULT_BOARD_VIEW_ORDER.forEach(view => {
    if (!seen.has(view)) {
      seen.add(view);
      result.push(view);
    }
  });
  return result;
}

function isDefaultBoardViewOrder(order) {
  const list = normalizeBoardViewOrder(order);
  return list.every((view, i) => view === DEFAULT_BOARD_VIEW_ORDER[i]);
}

// BOARD_VIEWS in the board's order.
function orderedBoardViews(board) {
  const byKey = new Map(BOARD_VIEWS.map(v => [v.view, v]));
  return normalizeBoardViewOrder(board && board.boardViewOrder).map(view => byKey.get(view));
}

// Move `view` one step up or down. Returns a new, normalized array; a no-op
// (unknown view, first item up, last item down) returns the normalized
// order unchanged, so the first row's up arrow and the last row's down
// arrow do nothing.
function moveBoardView(order, view, direction) {
  const list = normalizeBoardViewOrder(order);
  const from = list.indexOf(view);
  if (from === -1) return list;
  const to = direction === 'up' ? from - 1 : from + 1;
  if (to < 0 || to >= list.length) return list;
  const result = list.slice();
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result;
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

// The views the board offers, in the board's order.
function visibleBoardViews(board, visibility) {
  return orderedBoardViews(board).filter(v => isBoardViewShown(board, v.view, visibility));
}

// What the Board View menu renders: the visible views in the board's order,
// each with the class its click handler listens for, whether it is the one
// currently rendered, and whether a separator follows it (default order
// only). `currentView` is what Utils.boardView() returns.
function boardViewMenuEntries(board, currentView) {
  const visibility = board && board.permission;
  const defaultOrder = isDefaultBoardViewOrder(board && board.boardViewOrder);
  const visible = visibleBoardViews(board, visibility);
  return visible.map((v, i) => ({
    view: v.view,
    labelKey: v.labelKey,
    icon: v.icon,
    jsClass: boardViewJsClass(v.view),
    isCurrent: v.view === currentView,
    separatorAfter: defaultOrder && i < visible.length - 1 && SEPARATOR_AFTER.includes(v.view),
  }));
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

// What GET /api/boards/:boardId/boardViewSettings answers, and what the PUT
// answers after it wrote: every view exactly once with both sides made
// explicit (a missing entry/side means SHOWN), the two defaults resolved
// through defaultBoardView() so an unknown or missing default reads as
// Swimlanes, and the order made whole - the same decisions the UI renders
// with, so the API never reports a state the menu would not show.
function boardViewSettingsSnapshot(board) {
  const boardViewSettings = {};
  VIEW_KEYS.forEach(view => {
    boardViewSettings[view] = {
      showOnPublic: isBoardViewShown(board, view, 'public'),
      showOnPrivate: isBoardViewShown(board, view, 'private'),
    };
  });
  return {
    boardViewSettings,
    defaultPublicBoardView: defaultBoardView(board, 'public'),
    defaultPrivateBoardView: defaultBoardView(board, 'private'),
    boardViewOrder: normalizeBoardViewOrder(board && board.boardViewOrder),
    keys: VIEW_KEYS.slice(),
  };
}

// Apply a dotted-key $set ({ 'boardViewSettings.x.showOnPublic': true }) to a
// plain copy of a board document, so a request that changes the default AND
// hides views is checked against the state its earlier parts produced.
function applyDotSet(doc, $set) {
  Object.keys($set).forEach(key => {
    const parts = key.split('.');
    let node = doc;
    parts.slice(0, -1).forEach(part => {
      if (!node[part] || typeof node[part] !== 'object') node[part] = {};
      node = node[part];
    });
    node[parts[parts.length - 1]] = $set[key];
  });
  return doc;
}

// PUT /api/boards/:boardId/boardViewSettings: the request body, any subset
// of { boardViewSettings, defaultPublicBoardView, defaultPrivateBoardView,
// boardViewOrder }, turned into ONE $set through the same pure modifiers the
// popup's clicks use, or refused with a reason. Defaults are applied before
// the show flags (a default is always shown, and the new default is the one
// that must stay shown), an unknown view key anywhere is a 400, hiding a
// side's default is a 400 (the popup silently ignores that click; an API
// caller is told), and an order is normalised after every key in it was
// checked. Returns { $set } - empty when nothing recognised was sent - or
// { error }.
function boardViewSettingsRequest(board, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'body must be a JSON object' };
  }
  const working = JSON.parse(JSON.stringify({
    boardViewSettings: (board && board.boardViewSettings) || {},
    defaultPublicBoardView: board && board.defaultPublicBoardView,
    defaultPrivateBoardView: board && board.defaultPrivateBoardView,
    boardViewOrder: board && board.boardViewOrder,
  }));
  const $set = {};
  const merge = mod => {
    Object.assign($set, mod);
    applyDotSet(working, mod);
  };

  for (const side of ['public', 'private']) {
    const field = defaultField(side);
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    const view = input[field];
    if (typeof view !== 'string' || !isKnownBoardView(view)) {
      return { error: `${field}: unknown board view "${String(view)}"` };
    }
    merge(defaultBoardViewModifier(working, view, side));
  }

  if (Object.prototype.hasOwnProperty.call(input, 'boardViewSettings')) {
    const table = input.boardViewSettings;
    if (!table || typeof table !== 'object' || Array.isArray(table)) {
      return { error: 'boardViewSettings must be an object of { "<view>": { showOnPublic, showOnPrivate } }' };
    }
    for (const view of Object.keys(table)) {
      if (!isKnownBoardView(view)) {
        return { error: `boardViewSettings: unknown board view "${view}"` };
      }
      const entry = table[view];
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return { error: `boardViewSettings.${view} must be an object with showOnPublic and/or showOnPrivate` };
      }
      for (const side of ['public', 'private']) {
        const flag = showField(side);
        if (!Object.prototype.hasOwnProperty.call(entry, flag)) continue;
        const raw = entry[flag];
        const shown = raw === true || String(raw).toLowerCase() === 'true';
        const mod = showBoardViewModifier(working, view, side, shown);
        if (!mod) {
          return { error: `boardViewSettings.${view}.${flag}: cannot hide the ${side} default view; set ${defaultField(side)} to another view first` };
        }
        merge(mod);
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'boardViewOrder')) {
    const order = input.boardViewOrder;
    if (!Array.isArray(order)) {
      return { error: 'boardViewOrder must be an array of board view keys' };
    }
    const unknown = order.find(view => typeof view !== 'string' || !isKnownBoardView(view));
    if (unknown !== undefined) {
      return { error: `boardViewOrder: unknown board view "${String(unknown)}"` };
    }
    merge({ boardViewOrder: normalizeBoardViewOrder(order) });
  }

  return { $set };
}

module.exports = {
  BOARD_VIEWS,
  boardViewSettingsSnapshot,
  boardViewSettingsRequest,
  DEFAULT_BOARD_VIEW,
  DEFAULT_BOARD_VIEW_ORDER,
  SEPARATOR_AFTER,
  boardViewJsClass,
  normalizeBoardViewOrder,
  isDefaultBoardViewOrder,
  orderedBoardViews,
  moveBoardView,
  boardViewMenuEntries,
  isKnownBoardView,
  normalizeVisibility,
  isBoardViewShown,
  defaultBoardView,
  visibleBoardViews,
  resolveBoardView,
  showBoardViewModifier,
  defaultBoardViewModifier,
};

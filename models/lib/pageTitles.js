'use strict';

// What the top header bar calls the page you are on.
//
// The first header bar used to say "All Boards" beside its house icon, on every
// page, whatever page it was - so the bar that is always on screen named a place
// you were not. It shows the page's own title now, and on a board that is the
// BOARD's title, which is the one thing worth having there.
//
// Each page used to write its title into an `h1` of its own, inside its second
// header bar. Those thirteen `h1`s are one question - "what is this page called"
// - answered thirteen times, so it is answered here instead, by route name.
//
// Pure: no Meteor, no i18n, no router. It maps a route name to a translation
// KEY; resolving the key and finding the current route is the caller's job.
// docs/Design/Page/Header.md

// routeName -> i18n key.
const PAGE_TITLE_KEYS = {
  home: 'all-boards',
  allboards: 'all-boards',
  'allboards-templates': 'all-boards',
  'allboards-remaining': 'all-boards',
  public: 'public',
  archive: 'archived-boards',
  setting: 'admin-panel',
  people: 'admin-panel',
  'admin-reports': 'admin-panel',
  attachments: 'admin-panel',
  support: 'support',
  shortcuts: 'keyboard-shortcuts',
  'board-rules': 'r-board-rules',
  'my-cards': 'my-cards',
  mcp: 'mcp-hub',
  'global-search': 'globalSearch-title',
  'due-cards': 'dueCards-title',
  'broken-cards': 'broken-cards',
  accessibility: 'accessibility',
  // Import names its source, so this key is only the fallback.
  import: 'import',
};

// A second segment, after the page's own name: "Admin Panel / Settings".
//
// The Admin Panel is four pages under one name, and its four routes all answer
// `admin-panel`, so the bar said the same three words whichever of them was
// open. The sub-key names WHICH one - the same key the tab beside it uses for
// its tooltip, so the title and the tab that is marked active agree.
//
// Only the Admin Panel has one. A page whose name is already the whole answer
// does not need a second segment, and inventing one for every page would put a
// slash in the bar for nothing.
const PAGE_TITLE_SUBKEYS = {
  setting: 'settings',
  people: 'people',
  attachments: 'attachments',
  'admin-reports': 'problems',
};

// The route names that ARE a board. On those the title is the board's own, so
// there is no key to resolve - the caller reads the board.
const BOARD_ROUTES = ['board', 'card', 'boardCard', 'board-rules'];

function pageTitleKey(routeName) {
  return Object.prototype.hasOwnProperty.call(PAGE_TITLE_KEYS, routeName)
    ? PAGE_TITLE_KEYS[routeName]
    : null;
}

function pageTitleSubKey(routeName) {
  return Object.prototype.hasOwnProperty.call(PAGE_TITLE_SUBKEYS, routeName)
    ? PAGE_TITLE_SUBKEYS[routeName]
    : null;
}

function isBoardRoute(routeName) {
  return BOARD_ROUTES.includes(routeName);
}

// What to show, given the route, whatever board title the caller has, and
// whatever CUSTOM title the page has.
//
// Three sources, in order:
//   the board's title   `board-rules` is a board route AND has a key, because
//                       the rules page belongs to a board and the board is the
//                       more useful thing to name;
//   a custom title      Support and Accessibility can be renamed by an admin,
//                       and Import names its source ("Import / Trello"). Those
//                       are the page's real name, so they beat the key;
//   the key             everything else.
//
// A route nobody has added here answers with nothing, and the caller shows
// nothing - better than naming the wrong page. Both a board title and a custom
// title come back as `title`, because both are text to print as-is: neither may
// go through the translator.
function headerTitle(routeName, boardTitle, customTitle) {
  for (const text of [boardTitle, customTitle]) {
    if (typeof text === 'string' && text.trim()) return { title: text };
  }
  const key = pageTitleKey(routeName);
  if (!key) return { };
  // The sub-key rides along with the key, never with a title: a board's title
  // or a custom one IS the whole name of that page, so there is nothing to put
  // after a slash.
  const subKey = pageTitleSubKey(routeName);
  return subKey ? { key, subKey } : { key };
}

module.exports = {
  PAGE_TITLE_KEYS,
  PAGE_TITLE_SUBKEYS,
  pageTitleSubKey,
  BOARD_ROUTES,
  pageTitleKey,
  isBoardRoute,
  headerTitle,
};

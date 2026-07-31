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
  import: 'import-trello-zip-progress',
  'global-search': 'globalSearch-title',
  'due-cards': 'dueCards-title',
  'broken-cards': 'broken-cards',
  accessibility: 'accessibility',
};

// The route names that ARE a board. On those the title is the board's own, so
// there is no key to resolve - the caller reads the board.
const BOARD_ROUTES = ['board', 'card', 'boardCard', 'board-rules'];

function pageTitleKey(routeName) {
  return Object.prototype.hasOwnProperty.call(PAGE_TITLE_KEYS, routeName)
    ? PAGE_TITLE_KEYS[routeName]
    : null;
}

function isBoardRoute(routeName) {
  return BOARD_ROUTES.includes(routeName);
}

// What to show, given the route and whatever board title the caller has.
//
// A board's title wins wherever there is one: `rules` is a board route AND has
// a key, because the rules page belongs to a board and the board is the more
// useful thing to name. When there is no board and no key - a route nobody has
// added here - the answer is null and the caller shows nothing, which is better
// than naming the wrong page.
function headerTitle(routeName, boardTitle) {
  if (typeof boardTitle === 'string' && boardTitle.trim()) {
    return { title: boardTitle };
  }
  const key = pageTitleKey(routeName);
  return key ? { key } : { };
}

module.exports = {
  PAGE_TITLE_KEYS,
  BOARD_ROUTES,
  pageTitleKey,
  isBoardRoute,
  headerTitle,
};

'use strict';

// Which controls the shared page sidebar shows, per page.
//
// A page's controls used to live in its own second header bar, beside its `h1`.
// The title moved to the first bar (models/lib/pageTitles.js) and the controls
// moved into a right sidebar, so a page is its content plus one panel rather
// than its content plus a strip of buttons above it.
//
// A board has its own sidebar and All Boards has its own; this is for every
// OTHER page. Most have no controls at all - their second bar was only a title
// - and those get no sidebar and no hamburger, because an empty panel is worse
// than none.
//
// Pure: a route name in, a Blaze template name out. No Meteor, no router.
// docs/Features/Page/Header.md

// routeName -> the template that draws that page's controls.
const PAGE_SIDEBAR_TEMPLATES = {
  'my-cards': 'myCardsControls',
  'due-cards': 'dueCardsControls',
  'global-search': 'globalSearchControls',
  'board-rules': 'rulesControls',
};

// The routes that have their own sidebar already, and so must NOT get this one.
const OWN_SIDEBAR_ROUTES = [
  // Every board route: the board sidebar.
  'board', 'card', 'boardCard',
  // All Boards and its sections, and Public: the All Boards sidebar.
  'home', 'allboards', 'allboards-templates', 'allboards-remaining', 'public',
];

// ...and of those, the routes that must NOT be offered the HAMBURGER.
//
// All Boards has a sidebar, but nothing opens it from the top of the panel any
// more: its four controls are in the first header bar, and Search and
// Multi-Selection open the sidebar straight into their own view. The
// hamburger's only destination was a home view listing those same four things,
// so it opened a menu to reach what is now one click away.
//
// A board keeps its hamburger: what its sidebar holds - members, labels,
// activities, settings - is not in the bar and has nowhere else to be opened
// from.
const NO_HAMBURGER_ROUTES = [
  'home', 'allboards', 'allboards-templates', 'allboards-remaining', 'public',
];

function hasHamburger(routeName) {
  return !NO_HAMBURGER_ROUTES.includes(routeName);
}

function hasOwnSidebar(routeName) {
  return OWN_SIDEBAR_ROUTES.includes(routeName);
}

// The controls template for a route, or null when that page has none.
function pageSidebarTemplate(routeName) {
  if (hasOwnSidebar(routeName)) return null;
  return Object.prototype.hasOwnProperty.call(PAGE_SIDEBAR_TEMPLATES, routeName)
    ? PAGE_SIDEBAR_TEMPLATES[routeName]
    : null;
}

// Whether the hamburger should be offered at all. A page with no sidebar and
// nothing to put in one must not show a control that opens an empty panel.
function hasPageSidebar(routeName) {
  return pageSidebarTemplate(routeName) !== null;
}

module.exports = {
  PAGE_SIDEBAR_TEMPLATES,
  OWN_SIDEBAR_ROUTES,
  NO_HAMBURGER_ROUTES,
  hasOwnSidebar,
  hasHamburger,
  pageSidebarTemplate,
  hasPageSidebar,
};

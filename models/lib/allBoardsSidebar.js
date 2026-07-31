'use strict';

// The views of the All Boards right sidebar, and what each one is called.
//
// The All Boards page has its own sidebar rather than the board one: that one
// is built around a board - its members, its labels, its activities, its
// settings - and All Boards has no board. What IS shared is the shape: the same
// `.board-sidebar.sidebar` shell, the same "a view at a time with a title and a
// back arrow", so the two look and behave alike.
//
// Pure: no Meteor, no DOM. The ReactiveVar that holds the current view is
// client/lib/allBoardsSidebar.js.

const SIDEBAR_HOME = 'home';
const SIDEBAR_SEARCH = 'search';
const SIDEBAR_MULTISELECTION = 'multiselection';

// `home` is what the hamburger opens, the way the board sidebar opens
// `homeSidebar`; the other two are what their header-bar buttons open.
const SIDEBAR_VIEWS = [SIDEBAR_HOME, SIDEBAR_SEARCH, SIDEBAR_MULTISELECTION];
const DEFAULT_SIDEBAR_VIEW = SIDEBAR_HOME;

// The i18n key of a view's title. `home` has none: like the board sidebar, the
// default view shows no title row and no back arrow, because there is nothing
// to go back to.
const SIDEBAR_VIEW_TITLES = {
  [SIDEBAR_SEARCH]: 'search-boards',
  [SIDEBAR_MULTISELECTION]: 'multi-selection',
};

// null when the stored/asked-for value is not a view, so a caller can tell
// "not a view" from "the default view".
function normalizeSidebarView(view) {
  return SIDEBAR_VIEWS.includes(view) ? view : null;
}

function resolveSidebarView(view) {
  return normalizeSidebarView(view) || DEFAULT_SIDEBAR_VIEW;
}

function sidebarViewTitleKey(view) {
  return SIDEBAR_VIEW_TITLES[normalizeSidebarView(view)] || null;
}

// The Blaze template that draws a view - named explicitly, NOT derived from the
// view name. Deriving it (`allBoards` + capitalise + `Sidebar`) gave
// `allBoardsMultiselectionSidebar` for a template called
// `allBoardsMultiSelectionSidebar`, and a name that is one letter wrong renders
// nothing at all with no error worth the name. A map is checkable: the guard
// asserts every entry is a template that exists.
const SIDEBAR_VIEW_TEMPLATES = {
  [SIDEBAR_HOME]: 'allBoardsHomeSidebar',
  [SIDEBAR_SEARCH]: 'allBoardsSearchSidebar',
  [SIDEBAR_MULTISELECTION]: 'allBoardsMultiSelectionSidebar',
};

function sidebarViewTemplate(view) {
  return SIDEBAR_VIEW_TEMPLATES[resolveSidebarView(view)];
}

module.exports = {
  SIDEBAR_HOME,
  SIDEBAR_SEARCH,
  SIDEBAR_MULTISELECTION,
  SIDEBAR_VIEWS,
  DEFAULT_SIDEBAR_VIEW,
  SIDEBAR_VIEW_TITLES,
  SIDEBAR_VIEW_TEMPLATES,
  normalizeSidebarView,
  resolveSidebarView,
  sidebarViewTitleKey,
  sidebarViewTemplate,
};

'use strict';

// Jalor's primary navigation: the four whole-application pages, plus the Admin
// Panel for whoever can reach it.
//
// A pure module, with no Meteor and no router in it, so the decision it makes -
// what is in the bar, and which entry is the current one - can be tested as
// arithmetic (tests/jalorNav.test.cjs). client/components/main/header.js is the
// only caller; it passes in what the router and the user say and renders what
// comes back.
//
// EVERY entry is a route WeKan already serves (config/router.js). The point of
// this file is not to invent a structure - it is that WeKan's non-board pages
// were reachable only from the pop-over behind the avatar, so the parts of the
// product that are not a board were invisible until you went looking.

// `routes` is what marks an entry as the current one. It is wider than the
// entry's own route on purpose: a board IS the Boards section, and the Admin
// Panel is a dozen routes that are all the Admin Panel.
const JALOR_NAV = [
  {
    id: 'boards',
    labelKey: 'all-boards',
    icon: 'fa-th-large',
    routeName: 'home',
    routes: [
      'home', 'allboards', 'allboards-templates', 'allboards-remaining',
      'archive', 'public', 'template-container', 'bookmarks',
      'board', 'board-short', 'card', 'list', 'swimlane', 'board-rules',
    ],
  },
  {
    id: 'my-cards',
    labelKey: 'my-cards',
    icon: 'fa-list',
    routeName: 'my-cards',
    routes: ['my-cards', 'broken-cards'],
  },
  {
    id: 'due-cards',
    labelKey: 'dueCards-title',
    icon: 'fa-calendar',
    routeName: 'due-cards',
    routes: ['due-cards'],
  },
  {
    id: 'search',
    // `search` ("Rechercher"), not `globalSearch-title` ("Chercher dans tous
    // les tableaux"): a navigation entry is a word, and the page it opens says
    // what it searches.
    labelKey: 'search',
    icon: 'fa-search',
    routeName: 'global-search',
    routes: ['global-search'],
  },
  {
    // Admins only, and a per-tenant Global Admin lands on People rather than on
    // Settings: their panel is the same one with only their Organization's
    // panes in it, and Settings is not one of them. Same rule as the member
    // menu (client/components/users/userHeader.jade).
    id: 'admin',
    labelKey: 'admin-panel',
    icon: 'fa-lock',
    routeName: 'setting',
    orgAdminRouteName: 'people',
    adminOnly: true,
    routes: [
      'setting', 'people', 'problems', 'attachments', 'information',
      'translation', 'import', 'import-start',
    ],
  },
];

// The entries to draw, in order, each already told whether it is the current
// one. `currentRoute` is FlowRouter's route name, or '' when there is none yet.
function jalorNavEntries({ isAdmin = false, isOrgAdmin = false, currentRoute = '' } = {}) {
  const route = typeof currentRoute === 'string' ? currentRoute : '';
  return JALOR_NAV
    .filter(entry => !entry.adminOnly || isAdmin || isOrgAdmin)
    .map(entry => ({
      id: entry.id,
      labelKey: entry.labelKey,
      icon: entry.icon,
      // A per-tenant admin has no Settings pane, so their link goes elsewhere.
      routeName: entry.adminOnly && !isAdmin && isOrgAdmin && entry.orgAdminRouteName
        ? entry.orgAdminRouteName
        : entry.routeName,
      isCurrent: entry.routes.includes(route),
    }));
}

export { JALOR_NAV, jalorNavEntries };

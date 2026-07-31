'use strict';

// The Admin Panel's URLs: one per left-menu entry.
//
// The panel used to be four URLs - /setting, /people, /admin-reports,
// /attachments - each opening whatever pane its page happened to open first.
// Which pane you were looking at was ReactiveVar state and nothing else, so a
// pane could not be linked to, bookmarked, opened in a second tab, or reached
// by the back button; /setting always landed on Version even if you had just
// been in Global Webhooks.
//
// Every menu entry has a URL now: `/settings/version`, `/settings/visibility`,
// `/settings/global-webhooks`, and the same for the other three pages.
//
// The slug is NOT derived from the pane id. The ids are internal and read like
// it (`tableVisibilityMode-setting`, `layout-setting`, `report-cpu`), while a
// URL is something a person types and reads; and deriving a name from another
// name is how `allBoardsMultiselectionSidebar` happened. So this is an explicit
// map, and a guard checks both directions against the real menus: every pane
// has a slug, every slug names a pane that exists, and no two panes share one.
//
// Slugs are lowercase, words separated by `-`, and say what the pane IS rather
// than what it is called internally.
//
// Pure: no Meteor, no FlowRouter. docs/Design/Page/Admin-Panel-URLs.md

// slug -> pane id, per page. The pane id is what the page's own click handler
// and its `activeXId()` already use, so nothing inside a page has to change.
const ADMIN_PAGES = {
  settings: {
    base: '/settings',
    routeName: 'setting',
    // The pane that opens when no slug is given - the first menu entry.
    defaultSlug: 'version',
    panes: {
      version: 'version-setting',
      visibility: 'tableVisibilityMode-setting',
      announcement: 'announcement-setting',
      accessibility: 'accessibility-setting',
      translation: 'translation-setting',
      pwa: 'layout-setting',
      'global-webhooks': 'webhook-setting',
    },
  },
  people: {
    base: '/people',
    routeName: 'people',
    defaultSlug: 'people',
    panes: {
      login: 'registration-setting',
      email: 'email-setting',
      domains: 'domains-setting',
      organizations: 'org-setting',
      teams: 'team-setting',
      people: 'people-setting',
      'locked-users': 'locked-users-setting',
      roles: 'roles-setting',
      'shared-templates': 'templates-setting',
    },
  },
  problems: {
    base: '/admin-reports',
    routeName: 'admin-reports',
    defaultSlug: 'summary',
    panes: {
      summary: 'report-summary',
      security: 'features-security',
      notifications: 'features-notifications',
      'security-report': 'report-security',
      impersonation: 'report-impersonation',
      performance: 'features-performance',
      speed: 'report-speed',
      tests: 'report-tests',
      cpu: 'report-cpu',
      'broken-cards': 'report-broken',
      files: 'report-files',
      rules: 'report-rules',
      boards: 'report-boards',
      cards: 'report-cards',
      recovery: 'report-recovery',
      database: 'report-database',
    },
  },
  attachments: {
    base: '/attachments',
    routeName: 'attachments',
    defaultSlug: 'backup',
    panes: {
      backup: 'backup',
      move: 'move',
      'default-save-storage': 'default-save-storage',
      limits: 'limits',
      gridfs: 'gridfs',
      filesystem: 'filesystem',
      s3: 's3',
      azure: 'azure',
      gcs: 'gcs',
      'database-migration': 'database-migration',
    },
  },
};

const ADMIN_PAGE_KEYS = Object.keys(ADMIN_PAGES);

// The route names of the panel's four pages. The first header bar shows the
// panel's tabs on all of them, and nowhere else.
const ADMIN_PANEL_ROUTES = ADMIN_PAGE_KEYS.map(k => ADMIN_PAGES[k].routeName);

function adminPage(page) {
  return ADMIN_PAGES[page] || null;
}

// The pane a slug opens, or null when the slug is not one of this page's. A URL
// can be typed, and a typo must fall back to the default pane rather than
// rendering a panel with nothing in it.
function paneIdForSlug(page, slug) {
  const cfg = adminPage(page);
  if (!cfg || typeof slug !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(cfg.panes, slug)
    ? cfg.panes[slug]
    : null;
}

// The slug of a pane, for building the URL when a menu row is clicked.
function slugForPaneId(page, paneId) {
  const cfg = adminPage(page);
  if (!cfg || !paneId) return null;
  const found = Object.keys(cfg.panes).find(slug => cfg.panes[slug] === paneId);
  return found || null;
}

// What to open for a given slug: always a real pane id.
function resolvePaneId(page, slug) {
  const cfg = adminPage(page);
  if (!cfg) return null;
  return paneIdForSlug(page, slug) || cfg.panes[cfg.defaultSlug];
}

// The path of a pane. The DEFAULT pane keeps the bare page URL - `/settings`,
// not `/settings/version` - so the panel's own address stays short and there is
// one address for "the Settings page", not two.
function adminPath(page, paneIdOrSlug) {
  const cfg = adminPage(page);
  if (!cfg) return null;
  const slug = Object.prototype.hasOwnProperty.call(cfg.panes, paneIdOrSlug)
    ? paneIdOrSlug
    : slugForPaneId(page, paneIdOrSlug);
  if (!slug || slug === cfg.defaultSlug) return cfg.base;
  return `${cfg.base}/${slug}`;
}

module.exports = {
  ADMIN_PAGES,
  ADMIN_PAGE_KEYS,
  ADMIN_PANEL_ROUTES,
  adminPage,
  paneIdForSlug,
  slugForPaneId,
  resolvePaneId,
  adminPath,
};

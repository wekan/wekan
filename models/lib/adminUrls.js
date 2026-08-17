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
// Every menu entry has a URL now, and the URL says where you are - the panel,
// the page, and the pane, all three in it:
//
//   /admin/settings/version
//   /admin/settings/global-webhooks
//   /admin/people/login
//   /admin/problems/database
//   /admin/attachments/backup
//
// Under `/admin`, which the pages were not: they sat at the top level -
// /settings, /people, /attachments - as if they were pages of the app rather
// than of the Admin Panel, and /attachments collided with the path the file
// server itself serves attachments from. The prefix says which they are and
// keeps them out of everyone else's way.
//
// The DEFAULT pane is in the URL too. A bare page address showed one pane while
// naming none, so the address of "Settings showing Version" and the address of
// "Settings" were the same string; every pane is named now, including the first
// one. The bare `/admin-settings` still resolves - it redirects to the default
// pane's own address rather than being a second address for it.
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
// Pure: no Meteor, no FlowRouter. docs/Features/Page/Admin-Panel-URLs.md

// slug -> pane id, per page. The pane id is what the page's own click handler
// and its `activeXId()` already use, so nothing inside a page has to change.
const ADMIN_PAGES = {
  settings: {
    base: '/admin/settings',
    // Where this page used to live, kept so old links and bookmarks redirect.
    legacyBase: '/settings',
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
    base: '/admin/people',
    legacyBase: '/people',
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
    base: '/admin/problems',
    legacyBase: '/admin-reports',
    // 'problems', like its siblings' 'setting' / 'people' / 'attachments' - the
    // page key, which is what the menu, the URL and docs/Features all call it.
    // It was 'admin-reports' from when this pane was called Reports: the one
    // route whose name did not match its own address, and the same pane whose
    // template was still called adminReports. Both say problems now.
    //
    // `legacyBase` above is NOT part of that rename and must stay: /admin-reports
    // is an address people have bookmarked, and it still redirects here.
    routeName: 'problems',
    defaultSlug: 'summary',
    panes: {
      summary: 'report-summary',
      security: 'features-security',
      delete: 'features-delete',
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
      // Where people log in from, grouped: an address several accounts use is an
      // office, a VPN or a NAT (models/lib/loginTally.js).
      office: 'report-office',
      // Which REST endpoints are used, by whom, how often.
      api: 'report-api',
      database: 'report-database',
      integrity: 'report-integrity',
    },
  },
  attachments: {
    base: '/admin/attachments',
    legacyBase: '/attachments',
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

// What the header bar calls a pane: "Admin Panel / Settings / Version".
//
// The address names three things and so does the title. The panel is four
// pages and each page is a stack of panes, so "Admin Panel" alone named the
// building and not the room.
//
// The two forms are the ones a left-menu entry already has - a translation key,
// or a literal label for a name that is not translated (PWA is a product name).
// A guard checks every one of these against the REAL menu entry for that pane,
// in `tests/adminUrls.test.cjs`: the title in the bar and the label of the menu
// row that opened it have to be the same words, and this is a second copy of
// them, so nothing but a guard keeps them equal.
const ADMIN_PANE_TITLES = {
  settings: {
    version: { titleKey: 'info' },
    visibility: { titleKey: 'visibility' },
    announcement: { titleKey: 'admin-announcement' },
    accessibility: { titleKey: 'accessibility' },
    translation: { titleKey: 'translation' },
    pwa: { title: 'PWA' },
    'global-webhooks': { titleKey: 'global-webhook' },
  },
  people: {
    login: { titleKey: 'login' },
    email: { titleKey: 'email' },
    domains: { titleKey: 'domains' },
    organizations: { titleKey: 'organizations' },
    teams: { titleKey: 'teams' },
    people: { titleKey: 'people' },
    'locked-users': { titleKey: 'accounts-lockout-locked-users' },
    roles: { titleKey: 'roles' },
    'shared-templates': { titleKey: 'shared-templates' },
  },
  problems: {
    summary: { titleKey: 'summary' },
    security: { titleKey: 'features-security' },
    delete: { titleKey: 'delete' },
    notifications: { titleKey: 'features-notifications' },
    'security-report': { titleKey: 'securityReportTitle' },
    impersonation: { titleKey: 'impersonationReportTitle' },
    performance: { titleKey: 'features-performance' },
    speed: { titleKey: 'speedReportTitle' },
    tests: { titleKey: 'testsReportTitle' },
    cpu: { titleKey: 'cpuReportTitle' },
    'broken-cards': { titleKey: 'broken-cards' },
    files: { titleKey: 'filesReportTitle' },
    rules: { titleKey: 'rulesReportTitle' },
    boards: { titleKey: 'boardsReportTitle' },
    cards: { titleKey: 'cardsReportTitle' },
    recovery: { titleKey: 'recoveryReportTitle' },
    office: { titleKey: 'officeReportTitle' },
    api: { titleKey: 'apiReportTitle' },
    database: { titleKey: 'databaseReportTitle' },
    integrity: { titleKey: 'integrityReportTitle' },
  },
  attachments: {
    backup: { titleKey: 'backup' },
    move: { titleKey: 'attachment-move' },
    'default-save-storage': { titleKey: 'default-save-storage' },
    limits: { titleKey: 'attachment-limits' },
    gridfs: { titleKey: 'mongodb-gridfs-storage' },
    filesystem: { titleKey: 'filesystem-storage' },
    s3: { titleKey: 's3-minio-storage' },
    azure: { titleKey: 'azure-blob-storage' },
    gcs: { titleKey: 'gcs-storage' },
    'database-migration': { titleKey: 'database-migration' },
  },
};

// The title of a pane, in whichever of the two forms it has, or an empty object
// when the slug is not one of this page's - a caller then shows nothing rather
// than a title naming a pane that is not open.
function adminPaneTitle(page, slug) {
  const byPage = ADMIN_PANE_TITLES[page];
  if (!byPage || !Object.prototype.hasOwnProperty.call(byPage, slug)) return {};
  return byPage[slug];
}

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

// The path of a pane - always naming it, the default one included, because the
// point of the address is to say what you are looking at. An unknown pane falls
// back to the page's default rather than building a URL that resolves to
// nothing.
function adminPath(page, paneIdOrSlug) {
  const cfg = adminPage(page);
  if (!cfg) return null;
  const slug = Object.prototype.hasOwnProperty.call(cfg.panes, paneIdOrSlug)
    ? paneIdOrSlug
    : slugForPaneId(page, paneIdOrSlug);
  return `${cfg.base}/${slug || cfg.defaultSlug}`;
}

// The route pattern for a page. The pane is REQUIRED: the bare page address is
// a redirect to the default pane's own address, not a second address for it.
function adminRoutePath(page) {
  const cfg = adminPage(page);
  return cfg ? `${cfg.base}/:pane` : null;
}

module.exports = {
  ADMIN_PAGES,
  ADMIN_PANE_TITLES,
  adminPaneTitle,
  ADMIN_PAGE_KEYS,
  ADMIN_PANEL_ROUTES,
  adminPage,
  paneIdForSlug,
  slugForPaneId,
  resolvePaneId,
  adminPath,
  adminRoutePath,
};

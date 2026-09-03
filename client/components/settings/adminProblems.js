import { ReactiveCache } from '/imports/reactiveCache';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
// The per-pane URLs of the Admin Panel. docs/Features/Page/Admin-Panel-URLs.md
import { adminPath } from '/models/lib/adminUrls';
import { TAPi18n } from '/imports/i18n';
import Attachments, { AttachmentStorage } from '/models/attachments';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Rules from '/models/rules';
import ImpersonatedUsers from '/models/impersonatedUsers';
import RecoveryEvents from '/models/recoveryEvents';
import { Mongo } from 'meteor/mongo';
import { adjacentPage, buildFilters, buildHeader, buildRows, docsByIds, pageInfo, TABLE_PAGE_ROWS_PER_PAGE } from '/models/lib/tablePage';
// The flag and city an office row leads with (models/lib/geoHeaders.js).
const { officeLabel } = require('/models/lib/geoHeaders');
const { officeRowsByPerson } = require('/models/lib/loginTally');
import { ReportPages } from '/client/lib/reportPages';
import { leftMenuData, paneTitle } from '/models/lib/leftMenu';
import Settings from '/models/settings';
const { cleanFileName } = require('/imports/lib/fileNameDisplay');
const { filesize } = require('filesize');

// --- Shared helper functions (formerly AdminReport base class methods) ---

function yesOrNo(value) {
  if (value) {
    return TAPi18n.__('yes');
  } else {
    return TAPi18n.__('no');
  }
}

function fileSizeHelper(size) {
  let ret = "";
  if (typeof size === 'number') {
    ret = filesize(size);
  }
  return ret;
}

function abbreviate(text) {
  if (text?.length > 30) {
    return `${text.substr(0, 29)}...`;
  }
  return text;
}

// The same audit trail is relevant where permanent deletion is enabled and where
// its events are reviewed. Keep one sentence so the two panes cannot drift apart.
const PERMANENT_DELETE_RECOVERY_DESCRIPTION =
  'Recovery also logs permanent-delete setting changes and every successful, failed, or unauthorized permanent-delete attempt, including Done status, user ID, username, trusted IPv4 or IPv6 address, and attempted board IDs and titles.';

// The report publications already send only the current page (server-side
// search + limit/skip, sorted). Display exactly what was published, applying
// the same sort so minimongo order matches the server page. Re-applying
// skip/limit here would paginate an already-paginated set.
function collectionResults(collection, sort) {
  return collection.find({}, sort ? { sort } : {});
}

// The page index the report publications send. Declared once in
// client/lib/reportPages.js, because `new Mongo.Collection(name)` throws if the
// name is taken - it used to be declared here, so the second page to need it
// (/public) could not have one.

// The documents of the page the SERVER named, in the order it sorted them.
//
// `collectionResults` above shows whatever the collection holds, which is right
// only for a collection nothing else fills. Cards and Boards are not those: every
// card of every board the admin has opened is in minimongo, so Broken cards drew
// hundreds of rows while its pager - counted on the server - said "1 / 1", and the
// Cards and Boards reports showed the same rows on every page.
function reportPageResults(collection, reportId) {
  const index = ReportPages.findOne(reportId);
  const ids = (index && index.ids) || [];
  if (!ids.length) return [];
  return docsByIds(ids, collection.find({ _id: { $in: ids } }).fetch());
}

function collectionResultsCount(collection) {
  return collection.find().count();
}

// --- adminProblems template ---

// Rows per page for the paginated reports (files, rules, boards, cards). The one
// rows-per-page of the whole app (docs/Features/Page/Table.md), so every list pages
// alike - a report is not a different kind of page than People or Translation.
const REPORTS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;

// Static description of each paginated report: which page/count reactive vars
// it uses, which publication feeds it and which count method backs it. Lets a
// single loadReport() drive all of them the same way.
function reportConfig(tmpl) {
  return {
    'report-files': { page: tmpl.filesPage, count: tmpl.filesCount, search: tmpl.filesSearch, pub: 'attachmentsList', countMethod: 'getAttachmentsReportCount' },
    'report-rules': { page: tmpl.rulesPage, count: tmpl.rulesCount, search: tmpl.rulesSearch, pub: 'rulesReport', countMethod: 'getRulesReportCount' },
    'report-boards': { page: tmpl.boardsPage, count: tmpl.boardsCount, search: tmpl.boardsSearch, pub: 'boardsReport', countMethod: 'getBoardsReportCount' },
    'report-cards': { page: tmpl.cardsPage, count: tmpl.cardsCount, search: tmpl.cardsSearch, pub: 'cardsReport', countMethod: 'getCardsReportCount' },
    'report-broken': { page: tmpl.brokenPage, count: tmpl.brokenCount, search: tmpl.brokenSearch, pub: 'brokenCardsReport', countMethod: 'getBrokenCardsReportCount' },
    'report-impersonation': { page: tmpl.impersonationPage, count: tmpl.impersonationCount, search: tmpl.impersonationSearch, pub: 'impersonationReport', countMethod: 'getImpersonationReportCount' },
    'report-recovery': { page: tmpl.recoveryPage, count: tmpl.recoveryCount, search: tmpl.recoverySearch, filter: tmpl.recoveryFilter, pub: 'recoveryReport', countMethod: 'getRecoveryReportCount' },
  };
}

Template.adminProblems.onCreated(function () {
  this.subscription = null;
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);

  // Pagination state, one current-page + total-count pair per report.
  this.activeReport = new ReactiveVar('');
  this.filesPage = new ReactiveVar(1);
  this.rulesPage = new ReactiveVar(1);
  this.boardsPage = new ReactiveVar(1);
  this.cardsPage = new ReactiveVar(1);
  this.brokenPage = new ReactiveVar(1);
  this.impersonationPage = new ReactiveVar(1);
  this.recoveryPage = new ReactiveVar(1);
  this.filesCount = new ReactiveVar(0);
  this.rulesCount = new ReactiveVar(0);
  this.boardsCount = new ReactiveVar(0);
  this.cardsCount = new ReactiveVar(0);
  this.brokenCount = new ReactiveVar(0);
  this.impersonationCount = new ReactiveVar(0);
  this.recoveryCount = new ReactiveVar(0);
  // Current search term per report (empty string = no filter).
  this.filesSearch = new ReactiveVar('');
  this.rulesSearch = new ReactiveVar('');
  this.boardsSearch = new ReactiveVar('');
  this.cardsSearch = new ReactiveVar('');
  this.brokenSearch = new ReactiveVar('');
  this.impersonationSearch = new ReactiveVar('');
  this.recoverySearch = new ReactiveVar('');
  this.recoveryFilter = new ReactiveVar('all');

  // Which search term each report's total count was last computed for, so
  // paging does not recount. See loadReport().
  this.countedFor = {};

  // (Re)subscribe the given report for its current page and refresh its total
  // count. Server-side search + limit/skip means only the matching page ever
  // reaches minimongo.
  //
  // `recount` (opening a report, or searching in it) re-runs the count method;
  // plain prev/next paging does NOT. The count is a full collection count —
  // getCardsReportCount counts every card in the database — and the total cannot
  // change just because you moved to the next page, so re-running it on every
  // click only added a second server round trip to each prev/next. That is what
  // made paging through a big Cards report feel slow.
  this.loadReport = (reportId, { recount = false } = {}) => {
    const cfg = reportConfig(this)[reportId];
    if (!cfg) {
      return;
    }
    // Note: we deliberately do not toggle the global `loading` spinner here.
    // The spinner is shown once on tab switch (switchMenu); paging/searching
    // re-subscribes silently so the search box keeps focus and the report
    // stays mounted, just like the admin People panel.
    if (this.subscription) {
      this.subscription.stop();
    }
    const searchTerm = cfg.search.get();
    const filter = cfg.filter ? cfg.filter.get() : null;
    const requestKey = filter === null ? searchTerm : `${searchTerm}\u0000${filter}`;
    // Same helper the controls row uses, so the window that is SUBSCRIBED and the
    // "page X / N" that is DISPLAYED can never disagree. Only this page of rows is
    // requested from the server - the publications apply the limit/skip.
    const { limit, skip } = pageInfo(cfg.count.get(), cfg.page.get(), REPORTS_PER_PAGE);
    const subscriptionArgs = filter === null
      ? [cfg.pub, searchTerm, limit, skip]
      : [cfg.pub, searchTerm, filter, limit, skip];
    this.subscription = Meteor.subscribe(...subscriptionArgs, {
      onReady: () => {
        this.loading.set(false);
      },
      // A publication that errors (or is stopped) must never leave the report
      // stuck on the loading spinner forever: clear the spinner and, on a real
      // error, surface it. Without this an admin only ever saw an endless spinner
      // whenever a report subscription failed on the server.
      onStop: (error) => {
        if (error) {
          console.error(`Report subscription '${cfg.pub}' failed:`, error);
          this.error.set(error.reason || error.message || String(error));
        }
        this.loading.set(false);
      },
    });
    if (!recount && this.countedFor[reportId] === requestKey) {
      return;
    }
    const countArgs = filter === null
      ? [cfg.countMethod, searchTerm]
      : [cfg.countMethod, searchTerm, filter];
    Meteor.call(...countArgs, (error, count) => {
      if (error) {
        console.error(`Failed to load ${cfg.countMethod}:`, error);
        return;
      }
      this.countedFor[reportId] = requestKey;
      const total = count || 0;
      const totalPages = Math.max(1, Math.ceil(total / REPORTS_PER_PAGE));
      // If rows were removed while on a now-out-of-range page, clamp and reload.
      if (cfg.page.get() > totalPages) {
        cfg.page.set(totalPages);
        this.loadReport(reportId);
        return;
      }
      cfg.count.set(total);
    });
  };

  // Which user the open report was subscribed as. See the autorun below.
  this.subscribedAs = null;

  // The pane the URL asks for. The route resolved it, so it is always a real
  // pane id; a bare /admin-reports opens Summary. Reactive, so following a link
  // to another report while this page is open switches to it - the route action
  // runs again without re-creating the template.
  // docs/Features/Page/Admin-Panel-URLs.md
  //
  // It depends on Meteor.userId() as well, and that is not decoration. Opening
  // a report BY ITS ADDRESS - /admin/problems/files typed, bookmarked, or just
  // refreshed - is a full page load, and Meteor resumes the login from
  // localStorage ASYNCHRONOUSLY. The route sets problemsOpenPane before that
  // lands, so the subscription was made with no user; the publication's admin
  // check then answered `this.ready()` with no rows, and nothing ever
  // re-subscribed because this autorun did not depend on the user. The pane drew
  // its column headers, "No results" and a "1 / 1" pager over data that was
  // plainly there - while the count METHOD, called later from the same page,
  // happily reported five. Reached from the menu it worked, because by then the
  // login had landed; only the address did not.
  //
  // openReportPane() returns early when the pane is already open, so re-running
  // it after the login would do nothing at all - hence the second branch, which
  // re-subscribes the report that is already open now that there is a user to
  // subscribe as.
  //
  // The ONLY two things that may re-run this autorun are the pane id and the
  // user - read reactively, above the nonreactive body. Everything the body
  // touches (activeReport, and the count/page/search that loadReport reads
  // through pageInfo) is read INSIDE Tracker.nonreactive, on purpose:
  //
  //   1. loadReport() calls its count method and then cfg.count.set(...). If the
  //      autorun depended on cfg.count, that set would re-run it - and a
  //      Meteor.subscribe made inside an autorun is AUTO-CANCELLED when the
  //      autorun re-runs. The re-run then took the `else if` (same user, same
  //      pane), did NOT re-subscribe, and left the report with no subscription
  //      at all: "attachments in minimongo: 0", the empty table over data that
  //      was plainly there. From the menu it worked only because switchMenu
  //      calls openReportPane from an EVENT, not a computation, so that
  //      subscribe was never auto-managed. By URL it was, which is why only the
  //      address failed.
  //   2. The subscription's lifetime is ours to manage (loadReport stops the
  //      previous one; onDestroyed below stops the last), not the autorun's, so
  //      it must not be created inside this computation's reactive scope.
  this.autorun(() => {
    const paneId = Session.get('problemsOpenPane');
    const userId = Meteor.userId();
    Tracker.nonreactive(() => {
      if (!paneId) {
        return;
      }
      if (paneId !== this.activeReport.get()) {
        openReportPane(this, paneId);
        this.subscribedAs = userId;
      } else if (userId !== this.subscribedAs) {
        this.subscribedAs = userId;
        if (reportConfig(this)[paneId]) {
          this.loadReport(paneId, { recount: true });
        }
      }
    });
  });
});

// The report subscription is created OUTSIDE a reactive computation now (see the
// autorun above), so the autorun no longer tears it down - this does, when the
// panel is left.
Template.adminProblems.onDestroyed(function () {
  if (this.subscription) {
    this.subscription.stop();
  }
});

// The Problems side menu, as data (docs/Features/Page/Left-Menu.md). Every entry
// used to be six lines of markup plus its own click handler; the twelve handlers
// are now the single .js-left-menu-item one below.
const PROBLEMS_MENU = [
  { id: 'report-summary', icon: 'fa-list', labelKey: 'summary' },
  { separator: true },
  // Two groups, each named by a heading rather than by another entry: there is
  // nothing to click on a group title (docs/Features/Page/Left-Menu.md). Both use an
  // i18n key the app already has.
  { heading: true, labelKey: 'settings' },
  // Moved here from Admin Panel / Features. They are settings rather than reports -
  // which is what this heading says - but they are what an admin reaches for when
  // something is unsafe or noisy, which is what this page is about. Performance
  // sits with the reports below, beside the Speed / Tests / CPU usage streams it is
  // about.
  { id: 'features-security', icon: 'fa-shield', labelKey: 'features-security', emoji: true },
  { id: 'features-delete', icon: 'fa-trash', labelKey: 'delete' },
  { id: 'features-notifications', icon: 'fa-bell', labelKey: 'features-notifications', emoji: true },
  { separator: true },
  { heading: true, labelKey: 'reports' },
  // "Security Report", not "Security": the Features pane above is also called
  // Security, and the two sit in the same menu.
  { id: 'report-security', icon: 'fa-shield', labelKey: 'securityReportTitle' },
  { id: 'report-impersonation', icon: 'fa-user-secret', labelKey: 'impersonationReportTitle' },
  { id: 'features-performance', icon: 'fa-tachometer', labelKey: 'features-performance', emoji: true },
  { id: 'report-speed', icon: 'fa-tachometer', labelKey: 'speedReportTitle' },
  { id: 'report-tests', icon: 'fa-flask', labelKey: 'testsReportTitle' },
  { id: 'report-cpu', icon: 'fa-tachometer', labelKey: 'cpuReportTitle' },
  { id: 'report-broken', icon: 'fa-chain-broken', labelKey: 'broken-cards' },
  { id: 'report-files', icon: 'fa-paperclip', labelKey: 'filesReportTitle' },
  { id: 'report-rules', icon: 'fa-magic', labelKey: 'rulesReportTitle' },
  { id: 'report-boards', icon: 'fa-columns', labelKey: 'boardsReportTitle' },
  { id: 'report-cards', icon: 'fa-id-card-o', labelKey: 'cardsReportTitle' },
  { id: 'report-recovery', icon: 'fa-medkit', labelKey: 'recoveryReportTitle' },
  // Where people log in from, grouped by address: the offices, VPNs and NATs
  // several accounts share (models/lib/loginTally.js).
  { id: 'report-office', icon: 'fa-building', labelKey: 'officeReportTitle' },
  // What the REST API is being USED for - who called what, how often. Not a
  // problem report: it sits here because this is where an admin looks at what
  // the server is being asked to do (models/lib/apiUsage.js).
  { id: 'report-api', icon: 'fa-plug', labelKey: 'apiReportTitle' },
  // What the database itself said, classified: which database type, what it
  // means and what to do (server/lib/databaseProblems.js).
  { id: 'report-database', icon: 'fa-database', labelKey: 'databaseReportTitle' },
  // What the FILESYSTEM said: a stored file that is no longer the file WeKan
  // stored, and whether this server stopped cleanly
  // (docs/Security/Remediation/WeKan.md §13).
  { id: 'report-integrity', icon: 'fa-fingerprint', labelKey: 'integrityReportTitle' },
];

Template.adminProblems.helpers({
  menuItems() {
    // The pane opens on Summary, before any menu click has set activeReport.
    return leftMenuData(PROBLEMS_MENU,
      Template.instance().activeReport.get() || 'report-summary');
  },
  // The heading above the pane: the open menu entry's own label
  // (docs/Features/Page/Left-Menu.md). The report tables and the event streams
  // stopped passing a title to the shared table page when this arrived - the menu
  // entry and the report title were the same i18n key, and both would have printed.
  paneTitleData() {
    return paneTitle(PROBLEMS_MENU,
      Template.instance().activeReport.get() || 'report-summary');
  },
  // The shared table page for whichever paginated report is open (null for the
  // Summary / Broken cards panes, which are not table pages).
  tablePageData() {
    return reportTablePageData(Template.instance());
  },
  loading() {
    return Template.instance().loading;
  },
  // WHICH PANE IS OPEN, asked once - `else if isPane 'report-cpu'` in the
  // template, instead of a ReactiveVar, a reset, a setter and a helper per pane.
  //
  // Eleven booleans used to restate what `activeReport` already held, and each
  // new pane needed all four edits to appear. Filesystem integrity got three of
  // them: the menu entry set `tmpl.showIntegrity`, the template asked for
  // `showIntegrity.get`, and the helper was never written - which in Blaze is
  // not an error but a falsy value, so the pane drew a blank page while Summary
  // went on counting the problems it could not show. There is one helper to
  // forget now, and forgetting it is not subtle: every pane goes blank at once.
  // tests/adminPaneHelpers.test.cjs pins both halves.
  isPane(id) {
    return Template.instance().activeReport.get() === id;
  },

  // --- Pagination helpers, passed down into each report sub-template ---
  hasFilesPrevPage() { return Template.instance().filesPage.get() > 1; },
  hasFilesNextPage() {
    const tpl = Template.instance();
    return tpl.filesPage.get() < Math.max(1, Math.ceil((tpl.filesCount.get() || 0) / REPORTS_PER_PAGE));
  },

  hasRulesPrevPage() { return Template.instance().rulesPage.get() > 1; },
  hasRulesNextPage() {
    const tpl = Template.instance();
    return tpl.rulesPage.get() < Math.max(1, Math.ceil((tpl.rulesCount.get() || 0) / REPORTS_PER_PAGE));
  },

  hasBoardsPrevPage() { return Template.instance().boardsPage.get() > 1; },
  hasBoardsNextPage() {
    const tpl = Template.instance();
    return tpl.boardsPage.get() < Math.max(1, Math.ceil((tpl.boardsCount.get() || 0) / REPORTS_PER_PAGE));
  },

  hasCardsPrevPage() { return Template.instance().cardsPage.get() > 1; },
  hasCardsNextPage() {
    const tpl = Template.instance();
    return tpl.cardsPage.get() < Math.max(1, Math.ceil((tpl.cardsCount.get() || 0) / REPORTS_PER_PAGE));
  },

  hasImpersonationPrevPage() { return Template.instance().impersonationPage.get() > 1; },
  hasImpersonationNextPage() {
    const tpl = Template.instance();
    return tpl.impersonationPage.get() < Math.max(1, Math.ceil((tpl.impersonationCount.get() || 0) / REPORTS_PER_PAGE));
  },

  hasRecoveryPrevPage() { return Template.instance().recoveryPage.get() > 1; },
  hasRecoveryNextPage() {
    const tpl = Template.instance();
    return tpl.recoveryPage.get() < Math.max(1, Math.ceil((tpl.recoveryCount.get() || 0) / REPORTS_PER_PAGE));
  },
});

Template.adminProblems.events({
  // One handler for the whole menu: the shared left menu gives every entry the
  // same class and puts the pane id in data-id, so the twelve identical
  // 'click a.js-report-<name>' handlers collapsed to this.
  'click .js-left-menu-item'(event) {
    const tpl = Template.instance();
    switchMenu(event, tpl);
    // ...and into the address bar, so the report can be linked and bookmarked.
    const targetID = $(event.currentTarget || event.target)
      .closest('.js-left-menu-item').data('id');
    const path = adminPath('problems', targetID);
    if (path && FlowRouter.current().path !== path) FlowRouter.go(path);
  },

  // --- Controls: ONE handler each, for every table page ---
  // The shared table page (docs/Features/Page/Table.md) emits the same three
  // controls for every report, so the report is identified by activeReport
  // rather than by a per-report js- class. Twelve prev/next handlers and six
  // search handlers collapsed to these.
  //
  // Clicking a user, and clicking a location, are NOT here: they are the same
  // on every table, so they live on the shared table page itself
  // (client/components/settings/tablePage.js) and reach every report through
  // the template hierarchy. Three identical copies of the edit-user handler is
  // what that replaced.
  'click .js-table-page-prev'(event, tmpl) { goPrevPage(event, tmpl, tmpl.activeReport.get()); },
  'click .js-table-page-next'(event, tmpl) { goNextPage(event, tmpl, tmpl.activeReport.get()); },
  'keydown .js-table-page-search'(event, tmpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      runSearch(tmpl, tmpl.activeReport.get(), '.js-table-page-search');
    }
  },
  'change .js-table-page-filter'(event, tmpl) {
    if (tmpl.activeReport.get() !== 'report-recovery') return;
    tmpl.recoveryFilter.set($(event.currentTarget).val() || 'all');
    tmpl.recoveryPage.set(1);
    tmpl.loadReport('report-recovery', { recount: true });
  },
});

function goPrevPage(event, tmpl, reportId) {
  event.preventDefault();
  const cfg = reportConfig(tmpl)[reportId];
  // Specialized Problems panes (event streams and Offices) own their pager.
  // Blaze events bubble through containing templates, so their clicks can also
  // reach this shared report handler. Pane changes can likewise leave a queued
  // click with an old report id. Neither case has an entry in reportConfig.
  if (!cfg) return;
  movePage(cfg.page, cfg.count.get(), -1, REPORTS_PER_PAGE,
    () => tmpl.loadReport(reportId));
}

function goNextPage(event, tmpl, reportId) {
  event.preventDefault();
  const cfg = reportConfig(tmpl)[reportId];
  if (!cfg) return;
  movePage(cfg.page, cfg.count.get(), 1, REPORTS_PER_PAGE,
    () => tmpl.loadReport(reportId));
}

function movePage(page, total, direction, perPage, load) {
  const current = page.get();
  const next = adjacentPage(total, current, direction, perPage);
  if (next === current) return;
  page.set(next);
  load();
}

// Read the report's search box, store the term, reset to page 1 and reload.
function runSearch(tmpl, reportId, inputSelector) {
  const cfg = reportConfig(tmpl)[reportId];
  if (!cfg) return;
  const value = (tmpl.$(inputSelector).val() || '').trim();
  cfg.search.set(value);
  cfg.page.set(1);
  // A different search term means a different total: recount.
  tmpl.loadReport(reportId, { recount: true });
}

function switchMenu(event, tmpl) {
  // data-id is on the anchor; event.target may be the icon inside it.
  const target = $(event.currentTarget || event.target).closest('.js-left-menu-item');
  openReportPane(tmpl, target.data('id'));
}

// Open a pane BY ID. Split out of switchMenu so the URL can open one too - every
// left-menu entry has an address now (/admin/problems/cpu, /admin/problems/rules).
// docs/Features/Page/Admin-Panel-URLs.md
// The panes that need no subscription: they fetch through methods or have
// nothing to fetch. Everything else falls through to loadReport().
const SELF_LOADING_PANES = [
  'report-summary',
  'features-performance', 'features-security', 'features-delete', 'features-notifications',
  'report-security', 'report-speed', 'report-tests', 'report-cpu',
  'report-database', 'report-integrity', 'report-office', 'report-api',
];

function openReportPane(tmpl, targetID) {
  // Re-opening the open pane must do nothing. The active row is rendered from
  // activeReport now, so compare ids instead of reading a DOM class.
  if (targetID && targetID !== tmpl.activeReport.get()) {
    tmpl.loading.set(true);
    if (tmpl.subscription) {
      tmpl.subscription.stop();
    }

    tmpl.activeReport.set(targetID);

    // PANES THAT LOAD THEMSELVES. Summary, the Features panes and every
    // event-stream report fetch through methods rather than a subscription, or
    // have nothing to fetch at all: setting activeReport above is the whole of
    // opening them, so there is only the spinner to clear.
    //
    // This list replaces eleven `this.showX = new ReactiveVar(false)`, eleven
    // `tmpl.showX.set(false)` resets, eleven `tmpl.showX.set(true)` branches and
    // eleven `showX()` helpers - forty-four lines that all said the same thing
    // activeReport already said. Adding a pane took seven edits and missing one
    // of them rendered the pane BLANK: the menu set a variable, the template
    // asked for a helper that did not exist, and an undefined helper is simply
    // falsy. Both faults had happened - see the note that used to sit on the
    // integrity helper, and the Offices pane below, which shipped without its
    // `loading.set(false)` and would have spun for ever.
    if (SELF_LOADING_PANES.includes(targetID)) {
      tmpl.loading.set(false);
    } else if ('report-broken' === targetID) {
      // A report like the others now: same controls, same paging, same loader.
      tmpl.brokenPage.set(1);
      tmpl.brokenSearch.set('');
      tmpl.loadReport('report-broken', { recount: true });
    } else if ('report-files' === targetID) {
      tmpl.filesPage.set(1);
      tmpl.filesSearch.set('');
      tmpl.loadReport('report-files', { recount: true });
    } else if ('report-rules' === targetID) {
      tmpl.rulesPage.set(1);
      tmpl.rulesSearch.set('');
      tmpl.loadReport('report-rules', { recount: true });
    } else if ('report-boards' === targetID) {
      tmpl.boardsPage.set(1);
      tmpl.boardsSearch.set('');
      tmpl.loadReport('report-boards', { recount: true });
    } else if ('report-cards' === targetID) {
      tmpl.cardsPage.set(1);
      tmpl.cardsSearch.set('');
      tmpl.loadReport('report-cards', { recount: true });
    } else if ('report-impersonation' === targetID) {
      tmpl.impersonationPage.set(1);
      tmpl.impersonationSearch.set('');
      tmpl.loadReport('report-impersonation', { recount: true });
    } else if ('report-recovery' === targetID) {
      tmpl.recoveryPage.set(1);
      tmpl.recoverySearch.set('');
      tmpl.recoveryFilter.set('all');
      tmpl.loadReport('report-recovery', { recount: true });
    }
  }
}

// --- The six paginated reports: ONE implementation ---
//
// Files, Rules, Boards, Cards, Impersonation and Recovery used to be six copies
// of the same page: the same title + search + prev/next markup, the same
// currentPage/totalPages helpers, and the same click/keydown handlers, retyped
// with a different js- prefix each time. They now differ only in the COLUMN
// SPEC below; everything else - markup, layout, paging, search - comes from the
// shared table page. See docs/Features/Page/Table.md.
//
// A column is { label | labelKey, value(doc), align, nowrap, cls, userId(doc) }.

function memberNames(members) {
  return (members || [])
    // #5122: removing a member from a board marks it `isActive: false` (the entry
    // stays in board.members for role history / re-activation). Removed members
    // must not be listed as current members.
    .filter(member => member.isActive !== false)
    .map(member => ReactiveCache.getUser(member.userId)?.username || member.userId)
    .join(', ');
}

function userIdNames(userIds) {
  return (userIds || [])
    .map(userId => ReactiveCache.getUser(userId)?.username || userId)
    .join(', ');
}

function userName(userId) {
  if (!userId) return '';
  return ReactiveCache.getUser(userId)?.username || userId;
}

function formatDate(date) {
  return date ? new Date(date).toLocaleString() : '';
}

// Every table on the Problems tab, keyed by its side-menu id. `docs` returns the
// page that is already in minimongo - the publication sent only that page.
//
// No titleKey here: the pane heading is rendered once for every Admin Panel pane
// from the open menu entry (docs/Features/Page/Left-Menu.md), and PROBLEMS_MENU
// carries these reports' i18n keys already - the same keys this table used to
// repeat.
const REPORT_TABLES = {
  'report-files': {
    emptyKey: 'no-results',
    docs: () => {
      // The UNDERLYING reactive minimongo collection: the 'attachmentsList'
      // publication delivers the page via this.added, and a plain Mongo.Collection
      // cursor reacts to those adds and yields plain docs, whereas the ostrio
      // FilesCursor does not reliably re-run in a helper.
      // The page is the one the publication named - opening a single card puts its
      // attachments in minimongo, and those are not rows of this report.
      // Never throw: a throwing helper blanks the whole pane.
      const coll = (Attachments && Attachments.collection) || Attachments;
      try {
        return reportPageResults(coll, 'report-files');
      } catch (e) {
        // Say what went wrong. This used to return [] in silence, and an empty
        // catch on the one helper that fills the table is indistinguishable
        // from "there is nothing to show": the pane draws its headers, says
        // "No results", and nothing anywhere records that it threw. A report
        // that cannot render its rows is worth one line in the console.
        console.error('[report-files] could not read the page of rows:', e);
        return [];
      }
    },
    columns: [
      // The name is URL-decoded, homoglyphs folded and invisible / exploit
      // characters removed, so it is always shown as a plain, readable name.
      { label: 'Filename', value: d => cleanFileName(d.name) },
      { label: 'Size (kB)', align: 'end', value: d => fileSizeHelper(d.size) },
      { label: 'MIME Type', value: d => d.type },
      { label: 'Attachment ID', value: d => d._id },
      { label: 'Board ID', value: d => d.meta?.boardId },
      { label: 'Card ID', value: d => d.meta?.cardId },
    ],
  },
  'report-rules': {
    emptyKey: 'no-results',
    // The publication's page, not every rule in minimongo: a board's own rules are
    // there whenever its rules editor has been opened.
    docs: () =>
      reportPageResults(Rules, 'report-rules').map(rule => ({
        _id: rule._id,
        title: rule.title,
        boardTitle: rule.board()?.title,
        action: rule.action(),
        trigger: rule.trigger(),
      })),
    columns: [
      { label: 'Rule Title', value: d => d.title },
      { label: 'Board Title', value: d => d.boardTitle },
      { label: 'actionType', value: d => d.action?.actionType },
      { label: 'activityType', value: d => d.trigger?.activityType },
    ],
  },
  'report-boards': {
    emptyKey: 'no-results',
    docs: () => reportPageResults(Boards, 'report-boards'),
    columns: [
      { label: 'Title', value: d => abbreviate(d.title) },
      { label: 'Id', value: d => abbreviate(d._id) },
      { label: 'Permission', value: d => d.permission },
      { label: 'Archived?', value: d => yesOrNo(d.archived) },
      { label: 'Members', value: d => memberNames(d.members) },
      { label: 'Organizations', value: d => (d.orgs || [])
          .map(o => ReactiveCache.getOrg(o.orgId)?.orgDisplayName || o.orgId).join(', ') },
      { label: 'Teams', value: d => (d.teams || [])
          .map(t => ReactiveCache.getTeam(t.teamId)?.teamDisplayName || t.teamId).join(', ') },
    ],
  },
  'report-broken': {
    emptyKey: 'no-results',
    // A broken card is one with no board, swimlane or list - so those cells are
    // exactly the ones that may be empty, and that is the point of the row.
    // The page comes from the publication's own index, not from "every card in
    // minimongo": that is what made this report one endless page.
    docs: () => reportPageResults(Cards, 'report-broken'),
    columns: [
      { label: 'Card Title', value: d => abbreviate(d.title) },
      { label: 'Id', value: d => abbreviate(d._id) },
      { label: 'Board', value: d => abbreviate(d.board()?.title) },
      { label: 'Swimlane', value: d => abbreviate(d.swimlane()?.title) },
      { label: 'List', value: d => abbreviate(d.list()?.title) },
      { label: 'Type', value: d => d.type },
      { labelKey: 'createdAt', nowrap: true, value: d => formatDate(d.createdAt) },
    ],
  },
  'report-cards': {
    emptyKey: 'no-results',
    // The publication's page, in the publication's order (see cards.js).
    docs: () => reportPageResults(Cards, 'report-cards'),
    columns: [
      { label: 'Card Title', value: d => abbreviate(d.title) },
      { label: 'Board', value: d => abbreviate(d.board()?.title) },
      { label: 'Swimlane', value: d => abbreviate(d.swimlane()?.title) },
      { label: 'List', value: d => abbreviate(d.list()?.title) },
      { label: 'Members', value: d => userIdNames(d.members) },
      { label: 'Assignees', value: d => userIdNames(d.assignees) },
    ],
  },
  'report-impersonation': {
    emptyKey: 'no-results',
    // The publication already paginates + sorts newest-first; mirror that sort.
    docs: () => collectionResults(ImpersonatedUsers, { createdAt: -1 }).fetch(),
    columns: [
      { labelKey: 'date', nowrap: true, value: d => formatDate(d.createdAt) },
      // Clicking a username opens the same "Edit user" popup as Admin Panel / People.
      { labelKey: 'impersonation-admin', value: d => userName(d.adminId), userId: d => d.adminId },
      { labelKey: 'impersonation-user', value: d => userName(d.userId), userId: d => d.userId },
      { labelKey: 'board', value: d => d.boardId },
      { labelKey: 'reason', value: d => d.reason },
    ],
  },
  'report-recovery': {
    descKey: 'recovery-report-desc',
    additionalDesc: PERMANENT_DELETE_RECOVERY_DESCRIPTION,
    emptyKey: 'recovery-no-events',
    docs: () => collectionResults(RecoveryEvents, { createdAt: -1 }).fetch(),
    rowClass: d => `recovery-severity-${d.severity || 'info'}`,
    columns: [
      {
        labelKey: 'done',
        nowrap: true,
        value: () => '',
        icons: d => [
          {
            cls: d.done === false
              ? 'fa-exclamation-triangle table-page-status-failed'
              : 'fa-check table-page-status-done',
            title: String(d.done !== false),
          },
          ...(d.deletedData === true ? [{
            cls: 'fa-trash table-page-status-deleted',
            title: 'Deleted data',
          }] : []),
        ],
      },
      { labelKey: 'date', nowrap: true, value: d => formatDate(d.createdAt) },
      { labelKey: 'recovery-event', value: d => d.type },
      { label: 'User ID', value: d => d.userId },
      { labelKey: 'username', value: d => d.username },
      { labelKey: 'event-ipv4', value: d => d.ipv4 },
      { labelKey: 'event-ipv6', value: d => d.ipv6 },
      { labelKey: 'recovery-detail', value: d => d.detail },
    ],
  },
};

// Build the shared table page context for whichever report is open. Registered
// on the PARENT template, which already tracks activeReport - so there is one
// helper, not six, and no child has to reach back up for its parent instance.
function reportTablePageData(tmpl) {
  const reportId = tmpl.activeReport.get();
  const spec = REPORT_TABLES[reportId];
  const cfg = reportConfig(tmpl)[reportId];
  if (!spec || !cfg) return null;
  const docs = spec.docs() || [];
  const info = pageInfo(cfg.count.get(), cfg.page.get(), REPORTS_PER_PAGE);
  return {
    // No title: the pane heading comes from the open menu entry, once, for every
    // Admin Panel pane (docs/Features/Page/Left-Menu.md) - and this report's menu
    // entry carries the very same i18n key, so both would have printed it.
    descKey: spec.descKey,
    additionalDesc: spec.additionalDesc,
    emptyKey: spec.emptyKey,
    searchTerm: cfg.search.get(),
    filters: reportId === 'report-recovery' ? buildFilters([{
      id: 'recovery-status',
      label: 'Show',
      options: [
        { value: 'all', label: 'All' },
        { value: 'done', label: 'Done' },
        { value: 'failed', label: 'Failed' },
        { value: 'deleted', label: 'Deleted' },
      ],
    }], cfg.filter.get()) : [],
    header: buildHeader(spec.columns),
    rows: buildRows(docs, spec.columns, { rowClass: spec.rowClass }),
    rowCount: docs.length,
    page: info.page,
    totalPages: info.totalPages,
    hasPrev: info.hasPrev,
    hasNext: info.hasNext,
  };
}
// Broken cards has no template of its own any more: it is a column spec in
// REPORT_TABLES like every other report, rendered by the shared table page. It
// used to run on the global-search machinery (CardSearchPaged, a session document
// and the nextPage/previousPage publications), which is why it was the one report
// in this menu with a different set of controls - its own prev/next, no search
// box, no total, no "page X / N".

// --- Read-only event stream report (Security / Speed / Tests) ---
// Reads the eventlog collection through the admin-only eventLogPage/eventLogCount
// methods and shows a paginated, searchable, READ-ONLY table (no acknowledge —
// that lives only on the Summary page). See docs/Security/Remediation/WeKan.md.
const EVENTS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;

// The stream's title is not needed here any more: the pane heading is rendered
// once for every Admin Panel pane from the open menu entry
// (docs/Features/Page/Left-Menu.md), and PROBLEMS_MENU already carries these exact
// i18n keys - securityReportTitle, speedReportTitle, testsReportTitle,
// cpuReportTitle - so the words are unchanged and there is only one of them.

Template.eventStreamReport.onCreated(function () {
  this.stream = this.data.stream;
  this.page = new ReactiveVar(1);
  this.total = new ReactiveVar(0);
  this.rows = new ReactiveVar([]);
  this.search = new ReactiveVar('');
  // CPU usage page only: the live figure shown between the title and the search
  // box. The event rows below it are a HISTORY of high-CPU periods, so without
  // this the page could not answer "what is the CPU doing right now?" at all.
  this.cpu = new ReactiveVar(null);
  this.load = () => {
    const stream = this.stream;
    const search = this.search.get();
    const page = this.page.get();
    Meteor.call('eventLogCount', stream, search, (err, count) => {
      if (!err) this.total.set(count || 0);
    });
    Meteor.call('eventLogPage', stream, EVENTS_PER_PAGE, (page - 1) * EVENTS_PER_PAGE, search, (err, rows) => {
      if (!err) this.rows.set(Array.isArray(rows) ? rows : []);
    });
  };
  this.load();

  if (this.stream === 'cpu') {
    this.loadCpu = () => {
      Meteor.call('problemDetailReport', 'cpu', (err, res) => {
        if (!err && res) this.cpu.set(res.current || null);
      });
    };
    this.loadCpu();
    // The monitor samples the system every CPU_SAMPLE_MS; refreshing on the same
    // order keeps the header live without polling the server pointlessly often.
    this.cpuTimer = Meteor.setInterval(this.loadCpu, 5000);
  }
});

Template.eventStreamReport.onDestroyed(function () {
  if (this.cpuTimer) Meteor.clearInterval(this.cpuTimer);
});

// The event streams (Security, Speed, Tests, CPU usage) use the SAME shared
// table page as the six reports - same markup, same controls, same layout - so
// their only difference is these columns and the CPU status row.
// FROM WHERE, in two columns rather than one. An instance reached over IPv6 and
// one reached over IPv4 are different situations, and a single column that
// sometimes holds one and sometimes the other cannot be scanned down.
//
// The fold writes `ipv4`/`ipv6` on every row now, but rows written BEFORE it did
// have only `ip` - so the address is classified here as the fallback, and the
// history displays correctly instead of showing two empty columns for everything
// older than this change.
const { classifyAddress } = require('/models/lib/ipAddress');
const addressColumns = () => [
  { labelKey: 'event-ipv4', nowrap: true, value: r => r.ipv4 || classifyAddress(r.ip).ipv4 || '' },
  { labelKey: 'event-ipv6', nowrap: true, value: r => r.ipv6 || classifyAddress(r.ip).ipv6 || '' },
];

// The API stream is a USAGE report, not a problem report, so its columns are the
// question it answers - who called what, how often, between when and when, from
// which address - and not one of the problem columns applies. Everything else
// about the pane is the shared event-stream report: the same template, the same
// controls, the same paginator, the same loader.
const API_COLUMNS = [
  // WHO. The stored username, like every other report: it is what the account
  // was called when the calls happened, so a later rename does not rewrite
  // history. Empty for an unauthenticated call, which is not a gap - it is the
  // row for "somebody with no account", and the addresses beside it are what
  // identify them.
  { labelKey: 'username', value: r => r.username || '', userId: r => r.userId },
  // WHAT. The route PATTERN - `POST /api/boards/:boardId/lists` - so one row is
  // one endpoint rather than one board (models/lib/apiUsage.js).
  { labelKey: 'api-endpoint', nowrap: true, value: r => r.api || '' },
  // HOW OFTEN, and BETWEEN WHEN AND WHEN. The count and the window are the
  // report: "34 calls" means nothing without the period it covers.
  { labelKey: 'api-calls', align: 'end', value: r => r.count || 0 },
  { labelKey: 'api-first-called', nowrap: true, value: r => formatEventAt(r.firstAt) },
  { labelKey: 'api-last-called', nowrap: true, value: r => formatEventAt(r.at) },
  ...addressColumns(),
];

const EVENT_STREAM_COLUMNS = [
  { labelKey: 'event-datetime', nowrap: true, value: r => formatEventAt(r.at) },
  // The `database` stream answers "which database said this" in this column -
  // MongoDB, or FerretDB over SQLite / PostgreSQL / MySQL / MariaDB / SAP HANA -
  // because the same message means different things depending on which it was,
  // and the other streams have a category here.
  { labelKey: 'event-category', value: r => r.db || r.category },
  { labelKey: 'event-bleed', value: r => r.bleed || r.kind },
  { labelKey: 'event-severity', value: r => r.severity, data: r => r.severity },
  { labelKey: 'event-action', value: r => r.action || r.type },
  { labelKey: 'event-source', value: r => r.source },
  // WHO tried it. The stored `username` wins over looking the account up: it is
  // what the account was CALLED when the event happened, so a later rename does
  // not rewrite history and a deleted account does not erase it. The lookup
  // stays as the fallback for the older events that predate the stored field.
  {
    labelKey: 'username',
    value: r => r.username || userName(r.userId),
    userId: r => r.userId,
  },
  // FROM WHERE, in the same two columns every report uses. Resolved with the
  // same spoofing-safe rule as the login throttle - X-Forwarded-For only as far
  // as HTTP_FORWARDED_COUNT says to trust it - so neither can be written by
  // sending a header.
  ...addressColumns(),
  // HOW MANY attempts this row stands for. A canary counts repeats inside its
  // window rather than writing one row each, so "1" is an ordinary event and a
  // larger number is a burst that was deliberately not written out in full
  // (docs/Security/Remediation/WeKan.md §12).
  {
    labelKey: 'event-attempts',
    nowrap: true,
    value: r => (r.count && r.count > 1 ? String(r.count) : ''),
  },
  // The `database` stream's detail is WeKan's reading of the error - what it means
  // and what to do - and it is worth little without the sentence the database
  // itself produced, which is the one thing an admin can search for or paste into
  // an issue. So this cell carries both, advice first, message after. The other
  // streams have no `message`, and their cell is unchanged.
  { labelKey: 'event-detail', value: r => [r.detail, r.message].filter(Boolean).join(' — ') },
];

// Which columns a stream's table has. One line rather than a template of its
// own: the panes differ in their columns and in nothing else.
function columnsFor(stream) {
  return stream === 'api' ? API_COLUMNS : EVENT_STREAM_COLUMNS;
}

function formatEventAt(at) {
  if (!at) return '';
  try { return new Date(at).toISOString().replace('T', ' ').slice(0, 19); }
  catch (e) { return String(at); }
}

Template.eventStreamReport.helpers({
  tablePageData() {
    const t = Template.instance();
    const rows = t.rows.get() || [];
    const info = pageInfo(t.total.get(), t.page.get(), EVENTS_PER_PAGE);
    const cpu = t.cpu.get();
    return {
      // No title: the pane heading comes from the open menu entry, once, for
      // every Admin Panel pane (docs/Features/Page/Left-Menu.md).
      // The API stream is usage, not problems, so an empty one is not "no new
      // problems" - it is "nothing has called the API", which on most instances
      // means WITH_API is off.
      emptyKey: t.stream === 'api' ? 'api-no-calls' : 'no-new-problems',
      searchTerm: t.search.get(),
      header: buildHeader(columnsFor(t.stream)),
      rows: buildRows(rows, columnsFor(t.stream)),
      rowCount: rows.length,
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      // CPU usage is the only stream with a live status row: the table below it
      // lists PAST high-CPU periods, so this line is the only place the page says
      // what the CPU is doing right now. Null on the other streams, so the shared
      // page simply renders no status row there.
      statusTemplate: cpu ? 'cpuCurrentStatus' : null,
      statusData: cpu ? {
        high: cpu.high,
        percent: cpu.percent,
        cores: cpu.cores,
        activity: cpu.activity,
        // "1.42 / 1.10 / 0.98" - one line, no chart, matching the plain-table
        // look of the rest of the Problems pages.
        loadAverage: Array.isArray(cpu.loadAverage)
          ? cpu.loadAverage.map(n => (Number.isFinite(n) ? n.toFixed(2) : '?')).join(' / ')
          : '',
      } : null,
    };
  },
});

Template.eventStreamReport.events({
  'input .js-table-page-search'(event, tmpl) {
    tmpl.search.set(event.currentTarget.value.trim());
    tmpl.page.set(1);
    tmpl.load();
  },
  'click .js-table-page-prev'(event, tmpl) {
    event.preventDefault();
    event.stopPropagation();
    movePage(tmpl.page, tmpl.total.get(), -1, EVENTS_PER_PAGE, tmpl.load);
  },
  'click .js-table-page-next'(event, tmpl) {
    event.preventDefault();
    event.stopPropagation();
    movePage(tmpl.page, tmpl.total.get(), 1, EVENTS_PER_PAGE, tmpl.load);
  },
});

function toggleSettingField(field) {
  const setting = ReactiveCache.getCurrentSetting();
  if (setting) {
    if (field === 'enablePermanentDelete') {
      Meteor.call('setPermanentDeleteEnabled', !setting[field], (err) => {
        if (err) alert(err.reason || err.message || 'Failed to update permanent delete');
      });
      return;
    }
    Settings.update(setting._id, { $set: { [field]: !setting[field] } });
  }
}

// Performance, Security and Notifications were Admin Panel / Features panes before
// it was removed; Delete exposes the later soft-delete gate beside them. Blaze
// resolves a helper, and delivers an event,
// against the template the element is IN - never an enclosing one - so each pane needs
// these ON it. One shared pair registered on all three: a handler whose element is not
// in a given pane simply never fires there, so splitting them per pane would buy
// nothing.
const featurePaneHelpers = {
  renderLinksAsPlainText() {
    return (ReactiveCache.getCurrentSetting() || {}).renderLinksAsPlainText;
  },
  alwaysShowCodeAsText() {
    return (ReactiveCache.getCurrentSetting() || {}).alwaysShowCodeAsText;
  },
  disableAllImport() {
    return (ReactiveCache.getCurrentSetting() || {}).disableAllImport;
  },
  disableAllExport() {
    return (ReactiveCache.getCurrentSetting() || {}).disableAllExport;
  },
  disableImportAvatars() {
    return (ReactiveCache.getCurrentSetting() || {}).disableImportAvatars;
  },
  disableExportAvatars() {
    return (ReactiveCache.getCurrentSetting() || {}).disableExportAvatars;
  },
  anonymizeImportUsers() {
    return (ReactiveCache.getCurrentSetting() || {}).anonymizeImportUsers;
  },
  anonymizeExportUsers() {
    return (ReactiveCache.getCurrentSetting() || {}).anonymizeExportUsers;
  },
  disableActivities() {
    return (ReactiveCache.getCurrentSetting() || {}).disableActivities;
  },
  disableNotifications() {
    return (ReactiveCache.getCurrentSetting() || {}).disableNotifications;
  },
  disableWatch() {
    return (ReactiveCache.getCurrentSetting() || {}).disableWatch;
  },
  enablePermanentDelete() {
    return (ReactiveCache.getCurrentSetting() || {}).enablePermanentDelete;
  },
  permanentDeleteRecoveryDescription() {
    return PERMANENT_DELETE_RECOVERY_DESCRIPTION;
  },
};
const featurePaneEvents = {
  'click .js-toggle-render-links-as-plain-text'() {
    toggleSettingField('renderLinksAsPlainText');
  },
  'click .js-toggle-always-show-code-as-text'() {
    toggleSettingField('alwaysShowCodeAsText');
  },
  'click .js-toggle-disable-all-import'() {
    toggleSettingField('disableAllImport');
  },
  'click .js-toggle-disable-all-export'() {
    toggleSettingField('disableAllExport');
  },
  'click .js-toggle-disable-import-avatars'() {
    toggleSettingField('disableImportAvatars');
  },
  'click .js-toggle-disable-export-avatars'() {
    toggleSettingField('disableExportAvatars');
  },
  'click .js-toggle-anonymize-import-users'() {
    toggleSettingField('anonymizeImportUsers');
  },
  'click .js-toggle-anonymize-export-users'() {
    toggleSettingField('anonymizeExportUsers');
  },
  'click .js-toggle-disable-activities'() {
    toggleSettingField('disableActivities');
  },
  'click .js-toggle-disable-notifications'() {
    toggleSettingField('disableNotifications');
  },
  'click .js-toggle-disable-watch'() {
    toggleSettingField('disableWatch');
  },
  'click .js-toggle-enable-permanent-delete'() {
    toggleSettingField('enablePermanentDelete');
  },
};
for (const tpl of [Template.featuresPerformance, Template.featuresSecurity,
  Template.featuresDelete, Template.featuresNotifications]) {
  tpl.helpers(featurePaneHelpers);
  tpl.events(featurePaneEvents);
}

// ── Admin Panel / Problems / Offices ────────────────────────────────────────
// Where people log in from, grouped by person. Every address remains its own row
// so IPv4, IPv6, location and that person's successful-login count stay exact.
//
// Through the shared table page like every other report here
// (docs/Features/Page/Table.md): same layout, same controls, same paginator.
const OFFICES_PER_PAGE = 25;

const OFFICE_COLUMNS = [
  {
    labelKey: 'office-people',
    users: d => [{
      userId: d.userId,
      text: d.fullname ? `${d.fullname} (${d.username})` : d.username,
      initials: d.initials,
      avatarUrl: d.avatarUrl,
    }],
    value: () => '',
  },
  { labelKey: 'event-ipv4', nowrap: true, value: d => d.ipv4 },
  { labelKey: 'event-ipv6', nowrap: true, value: d => d.ipv6 },
  // The flag and the city: an admin recognises "London" instantly and the flag
  // says WHICH London.
  {
    labelKey: 'office-location', nowrap: true,
    value: d => (d.locationLabel ? officeLabel(d.location).text : ''),
    flag: d => (d.location ? officeLabel(d.location).flag : ''),
    // And clicking it asks which map to open it at - the same chooser a card's
    // location uses. Only when the CDN sent coordinates: buildRows drops a
    // location without them, so a row that has a country and no lat/lon is a
    // label to read rather than a link that would search for the word.
    location: d => (d.location && {
      latitude: d.location.latitude,
      longitude: d.location.longitude,
      label: d.locationLabel || d.address || '',
    }),
  },
  { labelKey: 'office-logins', align: 'end', value: d => d.logins },
  { labelKey: 'office-first-seen', nowrap: true, value: d => formatDate(d.firstAt) },
  { labelKey: 'office-last-seen', nowrap: true, value: d => formatDate(d.at) },
];

Template.officeReport.onCreated(function () {
  this.rows = new ReactiveVar([]);
  this.total = new ReactiveVar(0);
  this.page = new ReactiveVar(1);
  this.search = new ReactiveVar('');
  this.load = () => {
    Meteor.call('loginOffices', {
      limit: OFFICES_PER_PAGE,
      skip: (this.page.get() - 1) * OFFICES_PER_PAGE,
      search: this.search.get() || undefined,
    }, (err, res) => {
      if (err) return;
      this.rows.set(officeRowsByPerson((res && res.people) || []));
      this.total.set((res && res.total) || 0);
    });
  };
  this.load();
});

Template.officeReport.helpers({
  tablePageData() {
    const t = Template.instance();
    const rows = t.rows.get() || [];
    const info = pageInfo(t.total.get(), t.page.get(), OFFICES_PER_PAGE);
    return {
      // No title: the pane heading is the open menu entry's own label, once, for
      // every Admin Panel pane (docs/Features/Page/Left-Menu.md).
      descKey: 'office-report-desc',
      emptyKey: 'office-no-results',
      searchTerm: t.search.get(),
      header: buildHeader(OFFICE_COLUMNS),
      rows: buildRows(rows, OFFICE_COLUMNS),
      rowCount: rows.length,
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
    };
  },
});

Template.officeReport.events({
  'click .js-table-page-prev'(event, tmpl) {
    event.preventDefault();
    event.stopPropagation();
    movePage(tmpl.page, tmpl.total.get(), -1, OFFICES_PER_PAGE, tmpl.load);
  },
  'click .js-table-page-next'(event, tmpl) {
    event.preventDefault();
    event.stopPropagation();
    movePage(tmpl.page, tmpl.total.get(), 1, OFFICES_PER_PAGE, tmpl.load);
  },
  'keydown .js-table-page-search'(event, tmpl) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      tmpl.search.set(event.currentTarget.value || '');
      tmpl.page.set(1);
      tmpl.load();
    }
  },
});

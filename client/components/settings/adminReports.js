import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Attachments, { AttachmentStorage } from '/models/attachments';
import { CardSearchPaged } from '/client/lib/cardSearch';
import SessionData from '/models/usersessiondata';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Rules from '/models/rules';
import ImpersonatedUsers from '/models/impersonatedUsers';
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

// The report publications already send only the current page (server-side
// search + limit/skip, sorted). Display exactly what was published, applying
// the same sort so minimongo order matches the server page. Re-applying
// skip/limit here would paginate an already-paginated set.
function collectionResults(collection, sort) {
  return collection.find({}, sort ? { sort } : {});
}

function collectionResultsCount(collection) {
  return collection.find().count();
}

// --- adminReports template ---

// Rows per page for the paginated reports (files, rules, boards, cards).
// Kept in sync with the admin People panel so all admin lists page alike.
const REPORTS_PER_PAGE = 25;

// Static description of each paginated report: which page/count reactive vars
// it uses, which publication feeds it and which count method backs it. Lets a
// single loadReport() drive all of them the same way.
function reportConfig(tmpl) {
  return {
    'report-files': { page: tmpl.filesPage, count: tmpl.filesCount, search: tmpl.filesSearch, pub: 'attachmentsList', countMethod: 'getAttachmentsReportCount' },
    'report-rules': { page: tmpl.rulesPage, count: tmpl.rulesCount, search: tmpl.rulesSearch, pub: 'rulesReport', countMethod: 'getRulesReportCount' },
    'report-boards': { page: tmpl.boardsPage, count: tmpl.boardsCount, search: tmpl.boardsSearch, pub: 'boardsReport', countMethod: 'getBoardsReportCount' },
    'report-cards': { page: tmpl.cardsPage, count: tmpl.cardsCount, search: tmpl.cardsSearch, pub: 'cardsReport', countMethod: 'getCardsReportCount' },
    'report-impersonation': { page: tmpl.impersonationPage, count: tmpl.impersonationCount, search: tmpl.impersonationSearch, pub: 'impersonationReport', countMethod: 'getImpersonationReportCount' },
  };
}

Template.adminReports.onCreated(function () {
  this.subscription = null;
  // Problems page opens on the Summary tab (the acknowledge checkbox list).
  this.showSummary = new ReactiveVar(true);
  this.showSecurity = new ReactiveVar(false);
  this.showSpeed = new ReactiveVar(false);
  this.showTests = new ReactiveVar(false);
  this.showCpu = new ReactiveVar(false);
  this.showFilesReport = new ReactiveVar(false);
  this.showBrokenCardsReport = new ReactiveVar(false);
  this.showOrphanedFilesReport = new ReactiveVar(false);
  this.showRulesReport = new ReactiveVar(false);
  this.showCardsReport = new ReactiveVar(false);
  this.showBoardsReport = new ReactiveVar(false);
  this.showImpersonationReport = new ReactiveVar(false);
  this.sessionId = SessionData.getSessionId();
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);

  // Pagination state, one current-page + total-count pair per report.
  this.activeReport = new ReactiveVar('');
  this.filesPage = new ReactiveVar(1);
  this.rulesPage = new ReactiveVar(1);
  this.boardsPage = new ReactiveVar(1);
  this.cardsPage = new ReactiveVar(1);
  this.impersonationPage = new ReactiveVar(1);
  this.filesCount = new ReactiveVar(0);
  this.rulesCount = new ReactiveVar(0);
  this.boardsCount = new ReactiveVar(0);
  this.cardsCount = new ReactiveVar(0);
  this.impersonationCount = new ReactiveVar(0);
  // Current search term per report (empty string = no filter).
  this.filesSearch = new ReactiveVar('');
  this.rulesSearch = new ReactiveVar('');
  this.boardsSearch = new ReactiveVar('');
  this.cardsSearch = new ReactiveVar('');
  this.impersonationSearch = new ReactiveVar('');

  // (Re)subscribe the given report for its current page and refresh its total
  // count. Server-side search + limit/skip means only the matching page ever
  // reaches minimongo.
  this.loadReport = (reportId) => {
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
    const limit = REPORTS_PER_PAGE;
    const skip = (cfg.page.get() - 1) * REPORTS_PER_PAGE;
    this.subscription = Meteor.subscribe(cfg.pub, searchTerm, limit, skip, {
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
    Meteor.call(cfg.countMethod, searchTerm, (error, count) => {
      if (error) {
        console.error(`Failed to load ${cfg.countMethod}:`, error);
        return;
      }
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
});

Template.adminReports.helpers({
  showSummary() {
    return Template.instance().showSummary;
  },
  showSecurity() {
    return Template.instance().showSecurity;
  },
  showSpeed() {
    return Template.instance().showSpeed;
  },
  showTests() {
    return Template.instance().showTests;
  },
  showCpu() {
    return Template.instance().showCpu;
  },
  showFilesReport() {
    return Template.instance().showFilesReport;
  },
  showBrokenCardsReport() {
    return Template.instance().showBrokenCardsReport;
  },
  showOrphanedFilesReport() {
    return Template.instance().showOrphanedFilesReport;
  },
  showRulesReport() {
    return Template.instance().showRulesReport;
  },
  showCardsReport() {
    return Template.instance().showCardsReport;
  },
  showBoardsReport() {
    return Template.instance().showBoardsReport;
  },
  showImpersonationReport() {
    return Template.instance().showImpersonationReport;
  },
  loading() {
    return Template.instance().loading;
  },

  // --- Pagination helpers, passed down into each report sub-template ---
  filesCurrentPage() { return Template.instance().filesPage.get(); },
  filesTotalPages() { return Math.max(1, Math.ceil((Template.instance().filesCount.get() || 0) / REPORTS_PER_PAGE)); },
  hasFilesPrevPage() { return Template.instance().filesPage.get() > 1; },
  hasFilesNextPage() {
    const tpl = Template.instance();
    return tpl.filesPage.get() < Math.max(1, Math.ceil((tpl.filesCount.get() || 0) / REPORTS_PER_PAGE));
  },

  rulesCurrentPage() { return Template.instance().rulesPage.get(); },
  rulesTotalPages() { return Math.max(1, Math.ceil((Template.instance().rulesCount.get() || 0) / REPORTS_PER_PAGE)); },
  hasRulesPrevPage() { return Template.instance().rulesPage.get() > 1; },
  hasRulesNextPage() {
    const tpl = Template.instance();
    return tpl.rulesPage.get() < Math.max(1, Math.ceil((tpl.rulesCount.get() || 0) / REPORTS_PER_PAGE));
  },

  boardsCurrentPage() { return Template.instance().boardsPage.get(); },
  boardsTotalPages() { return Math.max(1, Math.ceil((Template.instance().boardsCount.get() || 0) / REPORTS_PER_PAGE)); },
  hasBoardsPrevPage() { return Template.instance().boardsPage.get() > 1; },
  hasBoardsNextPage() {
    const tpl = Template.instance();
    return tpl.boardsPage.get() < Math.max(1, Math.ceil((tpl.boardsCount.get() || 0) / REPORTS_PER_PAGE));
  },

  cardsCurrentPage() { return Template.instance().cardsPage.get(); },
  cardsTotalPages() { return Math.max(1, Math.ceil((Template.instance().cardsCount.get() || 0) / REPORTS_PER_PAGE)); },
  hasCardsPrevPage() { return Template.instance().cardsPage.get() > 1; },
  hasCardsNextPage() {
    const tpl = Template.instance();
    return tpl.cardsPage.get() < Math.max(1, Math.ceil((tpl.cardsCount.get() || 0) / REPORTS_PER_PAGE));
  },

  impersonationCurrentPage() { return Template.instance().impersonationPage.get(); },
  impersonationTotalPages() { return Math.max(1, Math.ceil((Template.instance().impersonationCount.get() || 0) / REPORTS_PER_PAGE)); },
  hasImpersonationPrevPage() { return Template.instance().impersonationPage.get() > 1; },
  hasImpersonationNextPage() {
    const tpl = Template.instance();
    return tpl.impersonationPage.get() < Math.max(1, Math.ceil((tpl.impersonationCount.get() || 0) / REPORTS_PER_PAGE));
  },
});

Template.adminReports.events({
  'click a.js-report-summary'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-security'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-speed'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-tests'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-cpu'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-broken'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-files'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-rules'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-cards'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-boards'(event) {
    switchMenu(event, Template.instance());
  },
  'click a.js-report-impersonation'(event) {
    switchMenu(event, Template.instance());
  },

  // --- Pagination controls (buttons live inside the report sub-templates,
  // their clicks bubble up to this parent template) ---
  'click .js-files-prev-page'(event, tmpl) { goPrevPage(event, tmpl, 'report-files'); },
  'click .js-files-next-page'(event, tmpl) { goNextPage(event, tmpl, 'report-files'); },
  'click .js-rules-prev-page'(event, tmpl) { goPrevPage(event, tmpl, 'report-rules'); },
  'click .js-rules-next-page'(event, tmpl) { goNextPage(event, tmpl, 'report-rules'); },
  'click .js-boards-prev-page'(event, tmpl) { goPrevPage(event, tmpl, 'report-boards'); },
  'click .js-boards-next-page'(event, tmpl) { goNextPage(event, tmpl, 'report-boards'); },
  'click .js-cards-prev-page'(event, tmpl) { goPrevPage(event, tmpl, 'report-cards'); },
  'click .js-cards-next-page'(event, tmpl) { goNextPage(event, tmpl, 'report-cards'); },
  'click .js-impersonation-prev-page'(event, tmpl) { goPrevPage(event, tmpl, 'report-impersonation'); },
  'click .js-impersonation-next-page'(event, tmpl) { goNextPage(event, tmpl, 'report-impersonation'); },

  // --- Search (one input + button per report, mirrors the People panel) ---
  'keydown .js-files-search-input'(event, tmpl) { if (event.keyCode === 13 && !event.shiftKey) runSearch(tmpl, 'report-files', '.js-files-search-input'); },
  'keydown .js-rules-search-input'(event, tmpl) { if (event.keyCode === 13 && !event.shiftKey) runSearch(tmpl, 'report-rules', '.js-rules-search-input'); },
  'keydown .js-boards-search-input'(event, tmpl) { if (event.keyCode === 13 && !event.shiftKey) runSearch(tmpl, 'report-boards', '.js-boards-search-input'); },
  'keydown .js-cards-search-input'(event, tmpl) { if (event.keyCode === 13 && !event.shiftKey) runSearch(tmpl, 'report-cards', '.js-cards-search-input'); },
  'keydown .js-impersonation-search-input'(event, tmpl) { if (event.keyCode === 13 && !event.shiftKey) runSearch(tmpl, 'report-impersonation', '.js-impersonation-search-input'); },
});

function goPrevPage(event, tmpl, reportId) {
  event.preventDefault();
  const cfg = reportConfig(tmpl)[reportId];
  const current = cfg.page.get();
  if (current > 1) {
    cfg.page.set(current - 1);
    tmpl.loadReport(reportId);
  }
}

function goNextPage(event, tmpl, reportId) {
  event.preventDefault();
  const cfg = reportConfig(tmpl)[reportId];
  const total = cfg.count.get() || 0;
  const totalPages = Math.max(1, Math.ceil(total / REPORTS_PER_PAGE));
  const current = cfg.page.get();
  if (current < totalPages) {
    cfg.page.set(current + 1);
    tmpl.loadReport(reportId);
  }
}

// Read the report's search box, store the term, reset to page 1 and reload.
function runSearch(tmpl, reportId, inputSelector) {
  const cfg = reportConfig(tmpl)[reportId];
  const value = (tmpl.$(inputSelector).val() || '').trim();
  cfg.search.set(value);
  cfg.page.set(1);
  tmpl.loadReport(reportId);
}

function switchMenu(event, tmpl) {
  const target = $(event.target);
  if (!target.hasClass('active')) {
    tmpl.loading.set(true);
    tmpl.showSummary.set(false);
    tmpl.showSecurity.set(false);
    tmpl.showSpeed.set(false);
    tmpl.showTests.set(false);
    tmpl.showCpu.set(false);
    tmpl.showFilesReport.set(false);
    tmpl.showBrokenCardsReport.set(false);
    tmpl.showOrphanedFilesReport.set(false);
    tmpl.showRulesReport.set(false);
    tmpl.showBoardsReport.set(false);
    tmpl.showCardsReport.set(false);
    tmpl.showImpersonationReport.set(false);
    if (tmpl.subscription) {
      tmpl.subscription.stop();
    }

    $('.side-menu li.active').removeClass('active');
    target.parent().addClass('active');
    const targetID = target.data('id');
    tmpl.activeReport.set(targetID);

    // Summary + the Security/Speed/Tests streams load their own data (via methods,
    // not a subscription), so just show them and clear the spinner.
    if ('report-summary' === targetID) {
      tmpl.showSummary.set(true);
      tmpl.loading.set(false);
    } else if ('report-security' === targetID) {
      tmpl.showSecurity.set(true);
      tmpl.loading.set(false);
    } else if ('report-speed' === targetID) {
      tmpl.showSpeed.set(true);
      tmpl.loading.set(false);
    } else if ('report-tests' === targetID) {
      tmpl.showTests.set(true);
      tmpl.loading.set(false);
    } else if ('report-cpu' === targetID) {
      tmpl.showCpu.set(true);
      tmpl.loading.set(false);
    } else if ('report-broken' === targetID) {
      tmpl.showBrokenCardsReport.set(true);
      tmpl.subscription = Meteor.subscribe(
        'brokenCards',
        SessionData.getSessionId(),
        () => {
          tmpl.loading.set(false);
        },
      );
    } else if ('report-files' === targetID) {
      tmpl.showFilesReport.set(true);
      tmpl.filesPage.set(1);
      tmpl.filesSearch.set('');
      tmpl.loadReport('report-files');
    } else if ('report-rules' === targetID) {
      tmpl.showRulesReport.set(true);
      tmpl.rulesPage.set(1);
      tmpl.rulesSearch.set('');
      tmpl.loadReport('report-rules');
    } else if ('report-boards' === targetID) {
      tmpl.showBoardsReport.set(true);
      tmpl.boardsPage.set(1);
      tmpl.boardsSearch.set('');
      tmpl.loadReport('report-boards');
    } else if ('report-cards' === targetID) {
      tmpl.showCardsReport.set(true);
      tmpl.cardsPage.set(1);
      tmpl.cardsSearch.set('');
      tmpl.loadReport('report-cards');
    } else if ('report-impersonation' === targetID) {
      tmpl.showImpersonationReport.set(true);
      tmpl.impersonationPage.set(1);
      tmpl.impersonationSearch.set('');
      tmpl.loadReport('report-impersonation');
    }
  }
}

// --- filesReport template ---

Template.filesReport.helpers({
  results() {
    // The filename cell renders via the global {{cleanFilename}} helper: the name
    // is URL-decoded, homoglyphs are folded, and invisible / exploit characters
    // are removed, so it is always shown as a plain, readable name.
    //
    // Prefer the UNDERLYING reactive minimongo collection (Attachments.collection):
    // the 'attachmentsList' publication delivers the page via this.added, and a
    // plain Mongo.Collection cursor reacts to those adds and yields plain docs,
    // whereas the ostrio FilesCursor (Attachments.find()) does not reliably re-run
    // in a Blaze helper. Fall back to the wrapper if .collection is unavailable and
    // NEVER throw: a throwing helper would abort the whole filesReport render
    // (blank pane instead of the report + its "no results" state).
    const coll = (Attachments && Attachments.collection) || Attachments;
    try {
      return collectionResults(coll, { name: 1 });
    } catch (e) {
      return [];
    }
  },
  resultsCount() {
    const coll = (Attachments && Attachments.collection) || Attachments;
    try {
      return collectionResultsCount(coll);
    } catch (e) {
      return 0;
    }
  },
  fileSize(size) {
    return fileSizeHelper(size);
  },
});

// --- rulesReport template ---

Template.rulesReport.helpers({
  results() {
    const rules = [];

    ReactiveCache.getRules({}, { sort: { boardId: 1 } }).forEach(rule => {
      rules.push({
        _id: rule._id,
        title: rule.title,
        boardId: rule.boardId,
        boardTitle: rule.board()?.title,
        action: rule.action(),
        trigger: rule.trigger(),
      });
    });

    return rules;
  },
  resultsCount() {
    return collectionResultsCount(Rules);
  },
});

// --- boardsReport template ---

Template.boardsReport.helpers({
  results() {
    return collectionResults(Boards, { sort: 1 });
  },
  resultsCount() {
    return collectionResultsCount(Boards);
  },
  yesOrNo(value) {
    return yesOrNo(value);
  },
  abbreviate(text) {
    return abbreviate(text);
  },
  userNames(members) {
    const ret = (members || [])
      // #5122: removing a member from a board marks it `isActive: false` (the
      // entry stays in board.members for role history / re-activation). The
      // boards report must not list those removed members as current members.
      .filter(_member => _member.isActive !== false)
      .map(_member => {
        const _ret = ReactiveCache.getUser(_member.userId)?.username || _member.userId;
        return _ret;
      })
      .join(", ");
    return ret;
  },
  teams(memberTeams) {
    const ret = (memberTeams || [])
      .map(_memberTeam => {
        const _ret = ReactiveCache.getTeam(_memberTeam.teamId)?.teamDisplayName || _memberTeam.teamId;
        return _ret;
      })
      .join(", ");
    return ret;
  },
  orgs(orgs) {
    const ret = (orgs || [])
      .map(_orgs => {
        const _ret = ReactiveCache.getOrg(_orgs.orgId)?.orgDisplayName || _orgs.orgId;
        return _ret;
      })
      .join(", ");
    return ret;
  },
});

// --- cardsReport template ---

Template.cardsReport.helpers({
  results() {
    // Match the server publication's index-backed sort (see cards.js).
    return collectionResults(Cards, { boardId: 1, createdAt: -1 });
  },
  resultsCount() {
    return collectionResultsCount(Cards);
  },
  abbreviate(text) {
    return abbreviate(text);
  },
  userNames(userIds) {
    const ret = (userIds || [])
      .map(_userId => {
        const _ret = ReactiveCache.getUser(_userId)?.username;
        return _ret;
      })
      .join(", ");
    return ret;
  },
});

// --- impersonationReport template ---

Template.impersonationReport.helpers({
  results() {
    // The publication already paginates + sorts newest-first; mirror that sort.
    return collectionResults(ImpersonatedUsers, { createdAt: -1 });
  },
  resultsCount() {
    return collectionResultsCount(ImpersonatedUsers);
  },
  userName(userId) {
    if (!userId) return '';
    return ReactiveCache.getUser(userId)?.username || userId;
  },
  formatDate(date) {
    return date ? new Date(date).toLocaleString() : '';
  },
});

Template.impersonationReport.events({
  // Clicking a username opens the same "Edit user" popup as Admin Panel / People.
  'click .js-impersonation-edit-user'(event) {
    event.preventDefault();
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      Popup.open('editUser').call({ userId }, event);
    }
  },
});

// --- brokenCardsReport template ---

Template.brokenCardsReport.onCreated(function () {
  const search = new CardSearchPaged(this);
  this.search = search;
});

Template.brokenCardsReport.helpers({
  resultsCount() {
    return Template.instance().search.resultsCount;
  },
  resultsHeading() {
    return Template.instance().search.resultsHeading;
  },
  results() {
    return Template.instance().search.results;
  },
  getSearchHref() {
    return Template.instance().search.getSearchHref();
  },
  hasPreviousPage() {
    return Template.instance().search.hasPreviousPage;
  },
  hasNextPage() {
    return Template.instance().search.hasNextPage;
  },
});

Template.brokenCardsReport.events({
  'click .js-next-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.nextPage();
  },
  'click .js-previous-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.previousPage();
  },
});

// --- Read-only event stream report (Security / Speed / Tests) ---
// Reads the eventlog collection through the admin-only eventLogPage/eventLogCount
// methods and shows a paginated, searchable, READ-ONLY table (no acknowledge —
// that lives only on the Summary page). See docs/Security/Remediation/WeKan.md.
const EVENTS_PER_PAGE = 25;

function eventStreamTitleKey(stream) {
  return { security: 'securityReportTitle', speed: 'speedReportTitle', tests: 'testsReportTitle', cpu: 'cpuReportTitle' }[stream] || 'summary';
}

Template.eventStreamReport.onCreated(function () {
  this.stream = this.data.stream;
  this.page = new ReactiveVar(1);
  this.total = new ReactiveVar(0);
  this.rows = new ReactiveVar([]);
  this.search = new ReactiveVar('');
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
});

Template.eventStreamReport.helpers({
  rows() { return Template.instance().rows.get(); },
  rowCount() { return (Template.instance().rows.get() || []).length; },
  currentPage() { return Template.instance().page.get(); },
  totalPages() { return Math.max(1, Math.ceil(Template.instance().total.get() / EVENTS_PER_PAGE)); },
  searchTerm() { return Template.instance().search.get(); },
  streamTitle() { return TAPi18n.__(eventStreamTitleKey(Template.instance().stream)); },
  prevDisabled() { return Template.instance().page.get() <= 1 ? 'disabled' : ''; },
  nextDisabled() {
    const t = Template.instance();
    return t.page.get() >= Math.max(1, Math.ceil(t.total.get() / EVENTS_PER_PAGE)) ? 'disabled' : '';
  },
  formatAt(at) {
    if (!at) return '';
    try { return new Date(at).toISOString().replace('T', ' ').slice(0, 19); } catch (e) { return String(at); }
  },
  // The user who triggered the event (e.g. who uploaded a sanitized file). Empty
  // for events with no associated user.
  userName(userId) {
    if (!userId) return '';
    return ReactiveCache.getUser(userId)?.username || userId;
  },
});

Template.eventStreamReport.events({
  // Clicking the uploader opens the same "Edit user" popup as Admin Panel / People.
  'click .js-event-edit-user'(event) {
    event.preventDefault();
    const userId = event.currentTarget.getAttribute('data-user-id');
    if (userId) {
      Popup.open('editUser').call({ userId }, event);
    }
  },
  'input .js-event-search'(event, tmpl) {
    tmpl.search.set(event.currentTarget.value.trim());
    tmpl.page.set(1);
    tmpl.load();
  },
  'click .js-event-prev'(event, tmpl) {
    if (tmpl.page.get() > 1) { tmpl.page.set(tmpl.page.get() - 1); tmpl.load(); }
  },
  'click .js-event-next'(event, tmpl) {
    const totalPages = Math.max(1, Math.ceil(tmpl.total.get() / EVENTS_PER_PAGE));
    if (tmpl.page.get() < totalPages) { tmpl.page.set(tmpl.page.get() + 1); tmpl.load(); }
  },
});

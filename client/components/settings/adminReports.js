import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Attachments, { AttachmentStorage } from '/models/attachments';
import { CardSearchPaged } from '/client/lib/cardSearch';
import SessionData from '/models/usersessiondata';
import { QueryParams } from '/config/query-classes';
import { OPERATOR_LIMIT } from '/config/search-const';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Rules from '/models/rules';
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

function collectionResults(collection) {
  return collection.find();
}

function collectionResultsCount(collection) {
  return collection.find().count();
}

// --- adminReports template ---

Template.adminReports.onCreated(function () {
  this.subscription = null;
  this.showFilesReport = new ReactiveVar(false);
  this.showBrokenCardsReport = new ReactiveVar(false);
  this.showOrphanedFilesReport = new ReactiveVar(false);
  this.showRulesReport = new ReactiveVar(false);
  this.showCardsReport = new ReactiveVar(false);
  this.showBoardsReport = new ReactiveVar(false);
  this.sessionId = SessionData.getSessionId();
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
});

Template.adminReports.helpers({
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
  loading() {
    return Template.instance().loading;
  },
});

Template.adminReports.events({
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
});

function switchMenu(event, tmpl) {
  const target = $(event.target);
  if (!target.hasClass('active')) {
    tmpl.loading.set(true);
    tmpl.showFilesReport.set(false);
    tmpl.showBrokenCardsReport.set(false);
    tmpl.showOrphanedFilesReport.set(false);
    tmpl.showRulesReport.set(false);
    tmpl.showBoardsReport.set(false);
    tmpl.showCardsReport.set(false);
    if (tmpl.subscription) {
      tmpl.subscription.stop();
    }

    $('.side-menu li.active').removeClass('active');
    target.parent().addClass('active');
    const targetID = target.data('id');

    if ('report-broken' === targetID) {
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
      tmpl.subscription = Meteor.subscribe('attachmentsList', () => {
        tmpl.loading.set(false);
      });
    } else if ('report-rules' === targetID) {
      tmpl.subscription = Meteor.subscribe('rulesReport', () => {
        tmpl.showRulesReport.set(true);
        tmpl.loading.set(false);
      });
    } else if ('report-boards' === targetID) {
      tmpl.subscription = Meteor.subscribe('boardsReport', () => {
        tmpl.showBoardsReport.set(true);
        tmpl.loading.set(false);
      });
    } else if ('report-cards' === targetID) {
      const qp = new QueryParams();
      qp.addPredicate(OPERATOR_LIMIT, 300);
      tmpl.subscription = Meteor.subscribe(
        'globalSearch',
        tmpl.sessionId,
        qp.getParams(),
        qp.text,
        () => {
          tmpl.showCardsReport.set(true);
          tmpl.loading.set(false);
        },
      );
    }
  }
}

// --- filesReport template ---

Template.filesReport.helpers({
  results() {
    return collectionResults(Attachments);
  },
  resultsCount() {
    return collectionResultsCount(Attachments);
  },
  fileSize(size) {
    return fileSizeHelper(size);
  },
});

// --- rulesReport template ---

Template.rulesReport.helpers({
  results() {
    const rules = [];

    ReactiveCache.getRules().forEach(rule => {
      rules.push({
        _id: rule._id,
        title: rule.title,
        boardId: rule.boardId,
        boardTitle: rule.board().title,
        action: rule.action(),
        trigger: rule.trigger(),
      });
    });

    // eslint-disable-next-line no-console
    console.log('rows:', rules);
    return rules;
  },
  resultsCount() {
    return collectionResultsCount(Rules);
  },
});

// --- boardsReport template ---

Template.boardsReport.helpers({
  results() {
    return collectionResults(Boards);
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
    return collectionResults(Cards);
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

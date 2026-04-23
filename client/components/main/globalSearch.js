import { TAPi18n } from '/imports/i18n';
import { CardSearchPaged } from '../../lib/cardSearch';
import { LABEL_COLORS } from '/models/metadata/colors';
import { Query, QueryErrors } from '../../../config/query-classes';
import { ReactiveCache } from '/imports/reactiveCache';

// const subManager = new SubsManager();

Template.globalSearchHeaderBar.events({
  'click .js-due-cards-view-change': Popup.open('globalSearchViewChange'),
});

Template.globalSearch.onCreated(function () {
  const search = new CardSearchPaged(this);
  this.search = search;

  this.myLists = new ReactiveVar([]);
  this.myLabelNames = new ReactiveVar([]);
  this.myBoardNames = new ReactiveVar([]);
  this.parsingErrors = new QueryErrors();
  this.queryParams = null;

  Meteor.call('myLists', (err, data) => {
    if (!err) {
      this.myLists.set(data);
    }
  });

  Meteor.call('myLabelNames', (err, data) => {
    if (!err) {
      this.myLabelNames.set(data);
    }
  });

  Meteor.call('myBoardNames', (err, data) => {
    if (!err) {
      this.myBoardNames.set(data);
    }
  });
});

Template.globalSearch.onRendered(function () {
  Meteor.subscribe('setting');

  // eslint-disable-next-line no-console
  //console.log('lang:', TAPi18n.getLanguage());

  if (Session.get('globalQuery')) {
    searchAllBoards(this, Session.get('globalQuery'));
  }
});

function searchAllBoards(tpl, queryText) {
  const search = tpl.search;

  queryText = queryText.trim();
  // eslint-disable-next-line no-console
  //console.log('queryText:', queryText);

  search.query.set(queryText);

  search.resetSearch();
  tpl.parsingErrors = new QueryErrors();

  if (!queryText) {
    return;
  }

  search.searching.set(true);

  const query = new Query();
  query.buildParams(queryText);

  // eslint-disable-next-line no-console
  // console.log('params:', query.getParams());

  tpl.queryParams = query.getQueryParams().getParams();

  if (query.hasErrors()) {
    search.searching.set(false);
    search.queryErrors = query.errors();
    search.hasResults.set(true);
    search.hasQueryErrors.set(true);
    return;
  }

  search.runGlobalSearch(query.getQueryParams());
}

function errorMessages(tpl) {
  if (tpl.parsingErrors.hasErrors()) {
    return tpl.parsingErrors.errorMessages();
  }
  return tpl.search.queryErrorMessages();
}

Template.globalSearch.helpers({
  userId() {
    return Meteor.userId();
  },

  // Return ReactiveVar values so Blaze can use them
  searching() {
    const val = Template.instance().search.searching.get();
    return val;
  },
  hasResults() {
    const val = Template.instance().search.hasResults.get();
    return val;
  },
  hasQueryErrors() {
    const val = Template.instance().search.hasQueryErrors.get();
    return val;
  },
  serverError() {
    const val = Template.instance().search.serverError.get();
    return val;
  },
  query() {
    return Template.instance().search.query;
  },
  debug() {
    const val = Template.instance().search.debug.get();
    return val;
  },
  resultsHeading() {
    const rv = Template.instance().search.resultsHeading;
    return rv ? rv.get() : '';
  },
  results() {
    const rv = Template.instance().search.results;
    return rv ? rv.get() : [];
  },
  hasNextPage() {
    const rv = Template.instance().search.hasNextPage;
    return rv ? rv.get() : false;
  },
  hasPreviousPage() {
    const rv = Template.instance().search.hasPreviousPage;
    return rv ? rv.get() : false;
  },
  sessionData() {
    return Template.instance().search.sessionData;
  },
  getSearchHref() {
    return Template.instance().search.getSearchHref();
  },

  myLists() {
    const rv = Template.instance().myLists;
    return rv ? rv.get() : [];
  },
  myLabelNames() {
    const rv = Template.instance().myLabelNames;
    return rv ? rv.get() : [];
  },
  myBoardNames() {
    const rv = Template.instance().myBoardNames;
    return rv ? rv.get() : [];
  },

  errorMessages() {
    return errorMessages(Template.instance());
  },

  getSearchData() {
    return Template.instance().search;
  },

  boardColorClass() {
    const boardId = Session.get('currentBoard');
    const board = boardId ? ReactiveCache.getBoard(boardId) : null;
    return board ? board.colorClass() : 'board-color-belize';
  },

  searchInstructions() {
    try {
      const tags = {
        operator_board: TAPi18n.__('operator-board'),
        operator_list: TAPi18n.__('operator-list'),
        operator_swimlane: TAPi18n.__('operator-swimlane'),
        operator_comment: TAPi18n.__('operator-comment'),
        operator_label: TAPi18n.__('operator-label'),
        operator_label_abbrev: TAPi18n.__('operator-label-abbrev'),
        operator_user: TAPi18n.__('operator-user'),
        operator_user_abbrev: TAPi18n.__('operator-user-abbrev'),
        operator_member: TAPi18n.__('operator-member'),
        operator_member_abbrev: TAPi18n.__('operator-member-abbrev'),
        operator_assignee: TAPi18n.__('operator-assignee'),
        operator_assignee_abbrev: TAPi18n.__('operator-assignee-abbrev'),
        operator_creator: TAPi18n.__('operator-creator'),
        operator_due: TAPi18n.__('operator-due'),
        operator_created: TAPi18n.__('operator-created'),
        operator_modified: TAPi18n.__('operator-modified'),
        operator_status: TAPi18n.__('operator-status'),
        operator_has: TAPi18n.__('operator-has'),
        operator_sort: TAPi18n.__('operator-sort'),
        operator_limit: TAPi18n.__('operator-limit'),
        operator_debug: TAPi18n.__('operator-debug'),
        operator_org: TAPi18n.__('operator-org'),
        operator_team: TAPi18n.__('operator-team'),
        predicate_overdue: TAPi18n.__('predicate-overdue'),
        predicate_archived: TAPi18n.__('predicate-archived'),
        predicate_all: TAPi18n.__('predicate-all'),
        predicate_ended: TAPi18n.__('predicate-ended'),
        predicate_week: TAPi18n.__('predicate-week'),
        predicate_month: TAPi18n.__('predicate-month'),
        predicate_quarter: TAPi18n.__('predicate-quarter'),
        predicate_year: TAPi18n.__('predicate-year'),
        predicate_attachment: TAPi18n.__('predicate-attachment'),
        predicate_description: TAPi18n.__('predicate-description'),
        predicate_checklist: TAPi18n.__('predicate-checklist'),
        predicate_public: TAPi18n.__('predicate-public'),
        predicate_private: TAPi18n.__('predicate-private'),
        predicate_due: TAPi18n.__('predicate-due'),
        predicate_created: TAPi18n.__('predicate-created'),
        predicate_modified: TAPi18n.__('predicate-modified'),
        predicate_start: TAPi18n.__('predicate-start'),
        predicate_end: TAPi18n.__('predicate-end'),
        predicate_assignee: TAPi18n.__('predicate-assignee'),
        predicate_member: TAPi18n.__('predicate-member'),
        predicate_selector: TAPi18n.__('predicate-selector'),
        predicate_projection: TAPi18n.__('predicate-projection'),
      };

      let text = '';
      [
        ['# ', 'globalSearch-instructions-heading'],
        ['\n', 'globalSearch-instructions-description'],
        ['\n\n', 'globalSearch-instructions-operators'],
        ['\n- ', 'globalSearch-instructions-operator-board'],
        ['\n- ', 'globalSearch-instructions-operator-list'],
        ['\n- ', 'globalSearch-instructions-operator-swimlane'],
        ['\n- ', 'globalSearch-instructions-operator-comment'],
        ['\n- ', 'globalSearch-instructions-operator-label'],
        ['\n- ', 'globalSearch-instructions-operator-hash'],
        ['\n- ', 'globalSearch-instructions-operator-user'],
        ['\n- ', 'globalSearch-instructions-operator-at'],
        ['\n- ', 'globalSearch-instructions-operator-member'],
        ['\n- ', 'globalSearch-instructions-operator-assignee'],
        ['\n- ', 'globalSearch-instructions-operator-creator'],
        ['\n- ', 'globalSearch-instructions-operator-org'],
        ['\n- ', 'globalSearch-instructions-operator-team'],
        ['\n- ', 'globalSearch-instructions-operator-due'],
        ['\n- ', 'globalSearch-instructions-operator-created'],
        ['\n- ', 'globalSearch-instructions-operator-modified'],
        ['\n- ', 'globalSearch-instructions-operator-status'],
        ['\n    - ', 'globalSearch-instructions-status-archived'],
        ['\n    - ', 'globalSearch-instructions-status-public'],
        ['\n    - ', 'globalSearch-instructions-status-private'],
        ['\n    - ', 'globalSearch-instructions-status-all'],
        ['\n    - ', 'globalSearch-instructions-status-ended'],
        ['\n- ', 'globalSearch-instructions-operator-has'],
        ['\n- ', 'globalSearch-instructions-operator-sort'],
        ['\n- ', 'globalSearch-instructions-operator-limit'],
        ['\n## ', 'heading-notes'],
        ['\n- ', 'globalSearch-instructions-notes-1'],
        ['\n- ', 'globalSearch-instructions-notes-2'],
        ['\n- ', 'globalSearch-instructions-notes-3'],
        ['\n- ', 'globalSearch-instructions-notes-3-2'],
        ['\n- ', 'globalSearch-instructions-notes-4'],
        ['\n- ', 'globalSearch-instructions-notes-5'],
      ].forEach(([prefix, instruction]) => {
        text += `${prefix}${TAPi18n.__(instruction, tags)}`
          // Replace *<text>* with `<text>` so markdown shows correctly
          .replace(/\*\</, '`<')
          .replace(/\>\*/, '\>\`');
      });
      return text;
    } catch (e) {
      console.error('Error building searchInstructions:', e);
      return '';
    }
  },

  labelColors() {
    try {
      if (!LABEL_COLORS) return [];
      return LABEL_COLORS.map(
        color => {
          return { color, name: TAPi18n.__(`color-${color}`) };
        },
      );
    } catch (e) {
      console.error('Error building labelColors:', e);
      return [];
    }
  },
});

Template.globalSearch.events({
  'click input.global-search-query-input'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  },
  'focus input.global-search-query-input'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  },
  'keyup input.global-search-query-input'(evt, tpl) {
    evt.preventDefault();
    evt.stopPropagation();
    // Store the query value
    tpl.search.query.set(evt.target.value);
  },
  'keydown input.global-search-query-input'(evt, tpl) {
    // Allow normal key behavior but capture Enter key
    if (evt.key === 'Enter') {
      evt.preventDefault();
      evt.stopPropagation();
      searchAllBoards(tpl, evt.target.value);
    }
  },
  'submit .js-search-query-form'(evt, tpl) {
    evt.preventDefault();
    searchAllBoards(tpl, evt.target.searchQuery.value);
  },
  'click .js-label-color'(evt, tpl) {
    evt.preventDefault();
    const input = document.getElementById('global-search-input');
    tpl.search.query.set(
      `${input.value} ${TAPi18n.__('operator-label')}:"${
        evt.currentTarget.textContent
      }"`,
    );
    document.getElementById('global-search-input').focus();
  },
  'click .js-board-title'(evt, tpl) {
    evt.preventDefault();
    const input = document.getElementById('global-search-input');
    tpl.search.query.set(
      `${input.value} ${TAPi18n.__('operator-board')}:"${
        evt.currentTarget.textContent
      }"`,
    );
    document.getElementById('global-search-input').focus();
  },
  'click .js-list-title'(evt, tpl) {
    evt.preventDefault();
    const input = document.getElementById('global-search-input');
    tpl.search.query.set(
      `${input.value} ${TAPi18n.__('operator-list')}:"${
        evt.currentTarget.textContent
      }"`,
    );
    document.getElementById('global-search-input').focus();
  },
  'click .js-label-name'(evt, tpl) {
    evt.preventDefault();
    const input = document.getElementById('global-search-input');
    tpl.search.query.set(
      `${input.value} ${TAPi18n.__('operator-label')}:"${
        evt.currentTarget.textContent
      }"`,
    );
    document.getElementById('global-search-input').focus();
  },
  'click .js-new-search'(evt, tpl) {
    evt.preventDefault();
    const input = document.getElementById('global-search-input');
    input.value = '';
    tpl.search.query.set('');
    tpl.search.hasResults.set(false);
  },
  'click .js-next-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.nextPage();
  },
  'click .js-previous-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.previousPage();
  },
});

// resultsPaged template helpers - receives search data context from parent template.
Template.resultsPaged.helpers({
  resultsHeading() {
    const data = Template.currentData();
    if (data && data.resultsHeading) {
      const rv = data.resultsHeading;
      return rv && typeof rv.get === 'function' ? rv.get() : rv;
    }
    return '';
  },
  results() {
    const data = Template.currentData();
    if (data && data.results) {
      const rv = data.results;
      return rv && typeof rv.get === 'function' ? rv.get() : rv;
    }
    return [];
  },
  getSearchHref() {
    const data = Template.currentData();
    if (data && typeof data.getSearchHref === 'function') {
      return data.getSearchHref();
    }
    return '';
  },
  hasPreviousPage() {
    const data = Template.currentData();
    if (data && data.hasPreviousPage) {
      const rv = data.hasPreviousPage;
      return rv && typeof rv.get === 'function' ? rv.get() : rv;
    }
    return false;
  },
  hasNextPage() {
    const data = Template.currentData();
    if (data && data.hasNextPage) {
      const rv = data.hasNextPage;
      return rv && typeof rv.get === 'function' ? rv.get() : rv;
    }
    return false;
  },
});

Template.resultsPaged.events({
  'click .js-next-page'(evt) {
    evt.preventDefault();
    // Walk up to find the search instance
    let view = Template.instance().view;
    while (view) {
      const tplInst = view.templateInstance && view.templateInstance();
      if (tplInst && tplInst.search) {
        tplInst.search.nextPage();
        return;
      }
      view = view.parentView;
    }
  },
  'click .js-previous-page'(evt) {
    evt.preventDefault();
    let view = Template.instance().view;
    while (view) {
      const tplInst = view.templateInstance && view.templateInstance();
      if (tplInst && tplInst.search) {
        tplInst.search.previousPage();
        return;
      }
      view = view.parentView;
    }
  },
});

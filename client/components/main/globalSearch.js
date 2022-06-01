import { TAPi18n } from '/imports/i18n';
import { CardSearchPagedComponent } from '../../lib/cardSearch';
import Boards from '../../../models/boards';
import { Query, QueryErrors } from '../../../config/query-classes';

// const subManager = new SubsManager();

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-due-cards-view-change': Popup.open('globalSearchViewChange'),
      },
    ];
  },
}).register('globalSearchHeaderBar');

Template.globalSearch.helpers({
  userId() {
    return Meteor.userId();
  },
});

class GlobalSearchComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();
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
  }

  onRendered() {
    Meteor.subscribe('setting');

    // eslint-disable-next-line no-console
    //console.log('lang:', TAPi18n.getLanguage());

    if (Session.get('globalQuery')) {
      this.searchAllBoards(Session.get('globalQuery'));
    }
  }

  resetSearch() {
    super.resetSearch();
    this.parsingErrors = new QueryErrors();
  }

  errorMessages() {
    if (this.parsingErrors.hasErrors()) {
      return this.parsingErrors.errorMessages();
    }
    return this.queryErrorMessages();
  }

  parsingErrorMessages() {
    this.parsingErrors.errorMessages();
  }

  searchAllBoards(queryText) {
    queryText = queryText.trim();
    // eslint-disable-next-line no-console
    //console.log('queryText:', queryText);

    this.query.set(queryText);

    this.resetSearch();

    if (!queryText) {
      return;
    }

    this.searching.set(true);

    const query = new Query();
    query.buildParams(queryText);

    // eslint-disable-next-line no-console
    // console.log('params:', query.getParams());

    this.queryParams = query.getQueryParams().getParams();

    if (query.hasErrors()) {
      this.searching.set(false);
      this.queryErrors = query.errors();
      this.hasResults.set(true);
      this.hasQueryErrors.set(true);
      return;
    }

    this.runGlobalSearch(query.getQueryParams());
  }

  searchInstructions() {
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
      .replace(/\>\*/, '\>\`')
    });
    return text;
  }

  labelColors() {
    return Boards.simpleSchema()._schema['labels.$.color'].allowedValues.map(
      color => {
        return { color, name: TAPi18n.__(`color-${color}`) };
      },
    );
  }

  events() {
    return super.events().concat([
      {
        'submit .js-search-query-form'(evt) {
          evt.preventDefault();
          this.searchAllBoards(evt.target.searchQuery.value);
        },
        'click .js-label-color'(evt) {
          evt.preventDefault();
          const input = document.getElementById('global-search-input');
          this.query.set(
            `${input.value} ${TAPi18n.__('operator-label')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
        'click .js-copy-debug-selector'(evt) {
          /* Get the text field */
          const selector = document.getElementById("debug-selector");

          try {
            navigator.clipboard.writeText(selector.textContent);
            alert("Selector copied to clipboard");
          } catch(err) {
            alert("Error copying text: " + err);
          }

        },
        'click .js-copy-debug-projection'(evt) {
          /* Get the text field */
          const projection = document.getElementById("debug-projection");

          try {
            navigator.clipboard.writeText(projection.textContent);
            alert("Projection copied to clipboard");
          } catch(err) {
            alert("Error copying text: " + err);
          }

        },
        'click .js-board-title'(evt) {
          evt.preventDefault();
          const input = document.getElementById('global-search-input');
          this.query.set(
            `${input.value} ${TAPi18n.__('operator-board')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
        'click .js-list-title'(evt) {
          evt.preventDefault();
          const input = document.getElementById('global-search-input');
          this.query.set(
            `${input.value} ${TAPi18n.__('operator-list')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
        'click .js-label-name'(evt) {
          evt.preventDefault();
          const input = document.getElementById('global-search-input');
          this.query.set(
            `${input.value} ${TAPi18n.__('operator-label')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
        'click .js-new-search'(evt) {
          evt.preventDefault();
          const input = document.getElementById('global-search-input');
          input.value = '';
          this.query.set('');
          this.hasResults.set(false);
        },
      },
    ]);
  }
}

GlobalSearchComponent.register('globalSearch');

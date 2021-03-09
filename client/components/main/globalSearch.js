import { CardSearchPagedComponent } from '../../lib/cardSearch';
import moment from 'moment';
import {
  OPERATOR_ASSIGNEE,
  OPERATOR_BOARD,
  OPERATOR_DUE,
  OPERATOR_HAS,
  OPERATOR_LABEL,
  OPERATOR_LIST,
  OPERATOR_MEMBER,
  OPERATOR_SORT,
  OPERATOR_STATUS,
  OPERATOR_SWIMLANE,
  OPERATOR_USER,
  ORDER_ASCENDING,
  ORDER_DESCENDING,
  PREDICATE_ALL,
  PREDICATE_ARCHIVED,
  PREDICATE_ASSIGNEES,
  PREDICATE_ATTACHMENT,
  PREDICATE_CHECKLIST,
  PREDICATE_CREATED_AT,
  PREDICATE_DESCRIPTION,
  PREDICATE_DUE_AT,
  PREDICATE_END_AT,
  PREDICATE_ENDED,
  PREDICATE_MEMBERS,
  PREDICATE_MODIFIED_AT,
  PREDICATE_MONTH,
  PREDICATE_OPEN,
  PREDICATE_OVERDUE,
  PREDICATE_PRIVATE,
  PREDICATE_PUBLIC,
  PREDICATE_QUARTER,
  PREDICATE_START_AT,
  PREDICATE_WEEK,
  PREDICATE_YEAR,
} from '../../../config/search-const';
import { QueryParams } from "../../../config/query-classes";

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

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-due-cards-view-me'() {
          Utils.setDueCardsView('me');
          Popup.close();
        },

        'click .js-due-cards-view-all'() {
          Utils.setDueCardsView('all');
          Popup.close();
        },
      },
    ];
  },
}).register('globalSearchViewChangePopup');

class GlobalSearchComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();
    this.myLists = new ReactiveVar([]);
    this.myLabelNames = new ReactiveVar([]);
    this.myBoardNames = new ReactiveVar([]);
    this.parsingErrors = [];
    this.colorMap = null;
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
    this.colorMap = Boards.colorMap();
    // eslint-disable-next-line no-console
    // console.log('colorMap:', this.colorMap);

    if (Session.get('globalQuery')) {
      this.searchAllBoards(Session.get('globalQuery'));
    }
  }

  resetSearch() {
    super.resetSearch();
    this.parsingErrors = [];
  }

  errorMessages() {
    if (this.parsingErrors.length) {
      return this.parsingErrorMessages();
    }
    return this.queryErrorMessages();
  }

  parsingErrorMessages() {
    const messages = [];

    if (this.parsingErrors.length) {
      this.parsingErrors.forEach(err => {
        messages.push(TAPi18n.__(err.tag, err.value));
      });
    }

    return messages;
  }

  searchAllBoards(query) {
    query = query.trim();
    // eslint-disable-next-line no-console
    //console.log('query:', query);

    this.query.set(query);

    this.resetSearch();

    if (!query) {
      return;
    }

    this.searching.set(true);

    const reOperator1 = new RegExp(
      '^((?<operator>[\\p{Letter}\\p{Mark}]+):|(?<abbrev>[#@]))(?<value>[\\p{Letter}\\p{Mark}]+)(\\s+|$)',
      'iu',
    );
    const reOperator2 = new RegExp(
      '^((?<operator>[\\p{Letter}\\p{Mark}]+):|(?<abbrev>[#@]))(?<quote>["\']*)(?<value>.*?)\\k<quote>(\\s+|$)',
      'iu',
    );
    const reText = new RegExp('^(?<text>\\S+)(\\s+|$)', 'u');
    const reQuotedText = new RegExp(
      '^(?<quote>["\'])(?<text>.*?)\\k<quote>(\\s+|$)',
      'u',
    );
    const reNegatedOperator = new RegExp('^-(?<operator>.*)$');

    const operators = {
      'operator-board': OPERATOR_BOARD,
      'operator-board-abbrev': OPERATOR_BOARD,
      'operator-swimlane': OPERATOR_SWIMLANE,
      'operator-swimlane-abbrev': OPERATOR_SWIMLANE,
      'operator-list': OPERATOR_LIST,
      'operator-list-abbrev': OPERATOR_LIST,
      'operator-label': OPERATOR_LABEL,
      'operator-label-abbrev': OPERATOR_LABEL,
      'operator-user': OPERATOR_USER,
      'operator-user-abbrev': OPERATOR_USER,
      'operator-member': OPERATOR_MEMBER,
      'operator-member-abbrev': OPERATOR_MEMBER,
      'operator-assignee': OPERATOR_ASSIGNEE,
      'operator-assignee-abbrev': OPERATOR_ASSIGNEE,
      'operator-status': OPERATOR_STATUS,
      'operator-due': OPERATOR_DUE,
      'operator-created': 'createdAt',
      'operator-modified': 'modifiedAt',
      'operator-comment': 'comments',
      'operator-has': OPERATOR_HAS,
      'operator-sort': OPERATOR_SORT,
      'operator-limit': 'limit',
    };

    const predicates = {
      due: {
        'predicate-overdue': PREDICATE_OVERDUE,
      },
      durations: {
        'predicate-week': PREDICATE_WEEK,
        'predicate-month': PREDICATE_MONTH,
        'predicate-quarter': PREDICATE_QUARTER,
        'predicate-year': PREDICATE_YEAR,
      },
      status: {
        'predicate-archived': PREDICATE_ARCHIVED,
        'predicate-all': PREDICATE_ALL,
        'predicate-open': PREDICATE_OPEN,
        'predicate-ended': PREDICATE_ENDED,
        'predicate-public': PREDICATE_PUBLIC,
        'predicate-private': PREDICATE_PRIVATE,
      },
      sorts: {
        'predicate-due': PREDICATE_DUE_AT,
        'predicate-created': PREDICATE_CREATED_AT,
        'predicate-modified': PREDICATE_MODIFIED_AT,
      },
      has: {
        'predicate-description': PREDICATE_DESCRIPTION,
        'predicate-checklist': PREDICATE_CHECKLIST,
        'predicate-attachment': PREDICATE_ATTACHMENT,
        'predicate-start': PREDICATE_START_AT,
        'predicate-end': PREDICATE_END_AT,
        'predicate-due': PREDICATE_DUE_AT,
        'predicate-assignee': PREDICATE_ASSIGNEES,
        'predicate-member': PREDICATE_MEMBERS,
      },
    };
    const predicateTranslations = {};
    Object.entries(predicates).forEach(([category, catPreds]) => {
      predicateTranslations[category] = {};
      Object.entries(catPreds).forEach(([tag, value]) => {
        predicateTranslations[category][TAPi18n.__(tag)] = value;
      });
    });
    // eslint-disable-next-line no-console
    // console.log('predicateTranslations:', predicateTranslations);

    const operatorMap = {};
    Object.entries(operators).forEach(([key, value]) => {
      operatorMap[TAPi18n.__(key).toLowerCase()] = value;
    });
    // eslint-disable-next-line no-console
    // console.log('operatorMap:', operatorMap);

    // const params = {
    //   limit: this.resultsPerPage,
    //   // boards: [],
    //   // swimlanes: [],
    //   // lists: [],
    //   // users: [],
    //   members: [],
    //   assignees: [],
    //   // labels: [],
    //   status: [],
    //   // dueAt: null,
    //   createdAt: null,
    //   modifiedAt: null,
    //   comments: [],
    //   has: [],
    // };
    // params[OPERATOR_BOARD] = [];
    // params[OPERATOR_DUE] = null;
    // params[OPERATOR_LABEL] = [];
    // params[OPERATOR_LIST] = [];
    // params[OPERATOR_SWIMLANE] = [];
    // params[OPERATOR_USER] = [];

    const params = new QueryParams();
    let text = '';
    while (query) {
      let m = query.match(reOperator1);
      if (!m) {
        m = query.match(reOperator2);
        if (m) {
          query = query.replace(reOperator2, '');
        }
      } else {
        query = query.replace(reOperator1, '');
      }
      if (m) {
        let op;
        if (m.groups.operator) {
          op = m.groups.operator.toLowerCase();
        } else {
          op = m.groups.abbrev.toLowerCase();
        }
        // eslint-disable-next-line no-prototype-builtins
        if (operatorMap.hasOwnProperty(op)) {
          const operator = operatorMap[op];
          let value = m.groups.value;
          if (operator === OPERATOR_LABEL) {
            if (value in this.colorMap) {
              value = this.colorMap[value];
              // console.log('found color:', value);
            }
          } else if (
            [OPERATOR_DUE, 'createdAt', 'modifiedAt'].includes(operator)
          ) {
            const days = parseInt(value, 10);
            let duration = null;
            if (isNaN(days)) {
              // duration was specified as text
              if (predicateTranslations.durations[value]) {
                duration = predicateTranslations.durations[value];
                let date = null;
                switch (duration) {
                  case PREDICATE_WEEK:
                    // eslint-disable-next-line no-case-declarations
                    const week = moment().week();
                    if (week === 52) {
                      date = moment(1, 'W');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(week + 1, 'W');
                    }
                    break;
                  case PREDICATE_MONTH:
                    // eslint-disable-next-line no-case-declarations
                    const month = moment().month();
                    // .month() is zero indexed
                    if (month === 11) {
                      date = moment(1, 'M');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(month + 2, 'M');
                    }
                    break;
                  case PREDICATE_QUARTER:
                    // eslint-disable-next-line no-case-declarations
                    const quarter = moment().quarter();
                    if (quarter === 4) {
                      date = moment(1, 'Q');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(quarter + 1, 'Q');
                    }
                    break;
                  case PREDICATE_YEAR:
                    date = moment(moment().year() + 1, 'YYYY');
                    break;
                }
                if (date) {
                  value = {
                    operator: '$lt',
                    value: date.format('YYYY-MM-DD'),
                  };
                }
              } else if (operator === 'dueAt' && value === PREDICATE_OVERDUE) {
                value = {
                  operator: '$lt',
                  value: moment().format('YYYY-MM-DD'),
                };
              } else {
                this.parsingErrors.push({
                  tag: 'operator-number-expected',
                  value: { operator: op, value },
                });
                value = null;
              }
            } else if (operator === 'dueAt') {
              value = {
                operator: '$lt',
                value: moment(moment().format('YYYY-MM-DD'))
                  .add(days + 1, duration ? duration : 'days')
                  .format(),
              };
            } else {
              value = {
                operator: '$gte',
                value: moment(moment().format('YYYY-MM-DD'))
                  .subtract(days, duration ? duration : 'days')
                  .format(),
              };
            }
          } else if (operator === OPERATOR_SORT) {
            let negated = false;
            const m = value.match(reNegatedOperator);
            if (m) {
              value = m.groups.operator;
              negated = true;
            }
            if (!predicateTranslations.sorts[value]) {
              this.parsingErrors.push({
                tag: 'operator-sort-invalid',
                value,
              });
            } else {
              value = {
                name: predicateTranslations.sorts[value],
                order: negated ? ORDER_DESCENDING : ORDER_ASCENDING,
              };
            }
          } else if (operator === OPERATOR_STATUS) {
            if (!predicateTranslations.status[value]) {
              this.parsingErrors.push({
                tag: 'operator-status-invalid',
                value,
              });
            } else {
              value = predicateTranslations.status[value];
            }
          } else if (operator === OPERATOR_HAS) {
            let negated = false;
            const m = value.match(reNegatedOperator);
            if (m) {
              value = m.groups.operator;
              negated = true;
            }
            if (!predicateTranslations.has[value]) {
              this.parsingErrors.push({
                tag: 'operator-has-invalid',
                value,
              });
            } else {
              value = {
                field: predicateTranslations.has[value],
                exists: !negated,
              };
            }
          } else if (operator === 'limit') {
            const limit = parseInt(value, 10);
            if (isNaN(limit) || limit < 1) {
              this.parsingErrors.push({
                tag: 'operator-limit-invalid',
                value,
              });
            } else {
              value = limit;
            }
          }

          params.addPredicate(operator, value);
        } else {
          this.parsingErrors.push({
            tag: 'operator-unknown-error',
            value: op,
          });
        }
        continue;
      }

      m = query.match(reQuotedText);
      if (!m) {
        m = query.match(reText);
        if (m) {
          query = query.replace(reText, '');
        }
      } else {
        query = query.replace(reQuotedText, '');
      }
      if (m) {
        text += (text ? ' ' : '') + m.groups.text;
      }
    }

    // eslint-disable-next-line no-console
    // console.log('text:', text);
    params.text = text;

    // eslint-disable-next-line no-console
    console.log('params:', params);

    this.queryParams = params;

    if (this.parsingErrors.length) {
      this.searching.set(false);
      this.queryErrors = this.parsingErrorMessages();
      this.hasResults.set(true);
      this.hasQueryErrors.set(true);
      return;
    }

    this.runGlobalSearch(params.getParams());
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
      operator_due: TAPi18n.__('operator-due'),
      operator_created: TAPi18n.__('operator-created'),
      operator_modified: TAPi18n.__('operator-modified'),
      operator_status: TAPi18n.__('operator-status'),
      operator_has: TAPi18n.__('operator-has'),
      operator_sort: TAPi18n.__('operator-sort'),
      operator_limit: TAPi18n.__('operator-limit'),
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
    };

    let text = '';
    [
      ['# ', 'globalSearch-instructions-heading'],
      ['\n', 'globalSearch-instructions-description'],
      ['\n\n', 'globalSearch-instructions-operators'],
      ['\n* ', 'globalSearch-instructions-operator-board'],
      ['\n* ', 'globalSearch-instructions-operator-list'],
      ['\n* ', 'globalSearch-instructions-operator-swimlane'],
      ['\n* ', 'globalSearch-instructions-operator-comment'],
      ['\n* ', 'globalSearch-instructions-operator-label'],
      ['\n* ', 'globalSearch-instructions-operator-hash'],
      ['\n* ', 'globalSearch-instructions-operator-user'],
      ['\n* ', 'globalSearch-instructions-operator-at'],
      ['\n* ', 'globalSearch-instructions-operator-member'],
      ['\n* ', 'globalSearch-instructions-operator-assignee'],
      ['\n* ', 'globalSearch-instructions-operator-due'],
      ['\n* ', 'globalSearch-instructions-operator-created'],
      ['\n* ', 'globalSearch-instructions-operator-modified'],
      ['\n* ', 'globalSearch-instructions-operator-status'],
      ['\n    * ', 'globalSearch-instructions-status-archived'],
      ['\n    * ', 'globalSearch-instructions-status-public'],
      ['\n    * ', 'globalSearch-instructions-status-private'],
      ['\n    * ', 'globalSearch-instructions-status-all'],
      ['\n    * ', 'globalSearch-instructions-status-ended'],
      ['\n* ', 'globalSearch-instructions-operator-has'],
      ['\n* ', 'globalSearch-instructions-operator-sort'],
      ['\n* ', 'globalSearch-instructions-operator-limit'],
      ['\n## ', 'heading-notes'],
      ['\n* ', 'globalSearch-instructions-notes-1'],
      ['\n* ', 'globalSearch-instructions-notes-2'],
      ['\n* ', 'globalSearch-instructions-notes-3'],
      ['\n* ', 'globalSearch-instructions-notes-3-2'],
      ['\n* ', 'globalSearch-instructions-notes-4'],
      ['\n* ', 'globalSearch-instructions-notes-5'],
    ].forEach(([prefix, instruction]) => {
      text += `${prefix}${TAPi18n.__(instruction, tags)}`;
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
    return [
      {
        ...super.events()[0],
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
      },
    ];
  }
}

GlobalSearchComponent.register('globalSearch');

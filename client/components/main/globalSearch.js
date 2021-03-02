const subManager = new SubsManager();

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

BlazeComponent.extendComponent({
  onCreated() {
    this.searching = new ReactiveVar(false);
    this.hasResults = new ReactiveVar(false);
    this.hasQueryErrors = new ReactiveVar(false);
    this.query = new ReactiveVar('');
    this.resultsHeading = new ReactiveVar('');
    this.searchLink = new ReactiveVar(null);
    this.myLists = new ReactiveVar([]);
    this.myLabelNames = new ReactiveVar([]);
    this.myBoardNames = new ReactiveVar([]);
    this.results = new ReactiveVar([]);
    this.hasNextPage = new ReactiveVar(false);
    this.hasPreviousPage = new ReactiveVar(false);
    this.queryParams = null;
    this.parsingErrors = [];
    this.resultsCount = 0;
    this.totalHits = 0;
    this.queryErrors = null;
    this.colorMap = null;
    this.resultsPerPage = 25;

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
  },

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
  },

  resetSearch() {
    this.searching.set(false);
    this.results.set([]);
    this.hasResults.set(false);
    this.hasQueryErrors.set(false);
    this.resultsHeading.set('');
    this.parsingErrors = [];
    this.resultsCount = 0;
    this.totalHits = 0;
    this.queryErrors = null;
  },

  getSessionData() {
    return SessionData.findOne({
      userId: Meteor.userId(),
      sessionId: SessionData.getSessionId(),
    });
  },

  getResults() {
    // eslint-disable-next-line no-console
    // console.log('getting results');
    if (this.queryParams) {
      const sessionData = this.getSessionData();
      // eslint-disable-next-line no-console
      // console.log('selector:', sessionData.getSelector());
      // console.log('session data:', sessionData);
      const projection = sessionData.getProjection();
      projection.skip = 0;
      const cards = Cards.find({ _id: { $in: sessionData.cards } }, projection);
      this.queryErrors = sessionData.errors;
      if (this.queryErrors.length) {
        this.hasQueryErrors.set(true);
        return null;
      }

      if (cards) {
        this.totalHits = sessionData.totalHits;
        this.resultsCount = cards.count();
        this.resultsStart = sessionData.lastHit - this.resultsCount + 1;
        this.resultsEnd = sessionData.lastHit;
        this.resultsHeading.set(this.getResultsHeading());
        this.results.set(cards);
        this.hasNextPage.set(sessionData.lastHit < sessionData.totalHits);
        this.hasPreviousPage.set(
          sessionData.lastHit - sessionData.resultsCount > 0,
        );
      }
    }
    this.resultsCount = 0;
    return null;
  },

  errorMessages() {
    if (this.parsingErrors.length) {
      return this.parsingErrorMessages();
    }
    return this.queryErrorMessages();
  },

  parsingErrorMessages() {
    const messages = [];

    if (this.parsingErrors.length) {
      this.parsingErrors.forEach(err => {
        messages.push(TAPi18n.__(err.tag, err.value));
      });
    }

    return messages;
  },

  queryErrorMessages() {
    messages = [];

    this.queryErrors.forEach(err => {
      let value = err.color ? TAPi18n.__(`color-${err.value}`) : err.value;
      if (!value) {
        value = err.value;
      }
      messages.push(TAPi18n.__(err.tag, value));
    });

    return messages;
  },

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
      'operator-board': 'boards',
      'operator-board-abbrev': 'boards',
      'operator-swimlane': 'swimlanes',
      'operator-swimlane-abbrev': 'swimlanes',
      'operator-list': 'lists',
      'operator-list-abbrev': 'lists',
      'operator-label': 'labels',
      'operator-label-abbrev': 'labels',
      'operator-user': 'users',
      'operator-user-abbrev': 'users',
      'operator-member': 'members',
      'operator-member-abbrev': 'members',
      'operator-assignee': 'assignees',
      'operator-assignee-abbrev': 'assignees',
      'operator-status': 'status',
      'operator-due': 'dueAt',
      'operator-created': 'createdAt',
      'operator-modified': 'modifiedAt',
      'operator-comment': 'comments',
      'operator-has': 'has',
      'operator-sort': 'sort',
      'operator-limit': 'limit',
    };

    const predicates = {
      due: {
        'predicate-overdue': 'overdue',
      },
      durations: {
        'predicate-week': 'week',
        'predicate-month': 'month',
        'predicate-quarter': 'quarter',
        'predicate-year': 'year',
      },
      status: {
        'predicate-archived': 'archived',
        'predicate-all': 'all',
        'predicate-open': 'open',
        'predicate-ended': 'ended',
        'predicate-public': 'public',
        'predicate-private': 'private',
      },
      sorts: {
        'predicate-due': 'dueAt',
        'predicate-created': 'createdAt',
        'predicate-modified': 'modifiedAt',
      },
      has: {
        'predicate-description': 'description',
        'predicate-checklist': 'checklist',
        'predicate-attachment': 'attachment',
        'predicate-start': 'startAt',
        'predicate-end': 'endAt',
        'predicate-due': 'dueAt',
        'predicate-assignee': 'assignees',
        'predicate-member': 'members',
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

    const params = {
      limit: this.resultsPerPage,
      boards: [],
      swimlanes: [],
      lists: [],
      users: [],
      members: [],
      assignees: [],
      labels: [],
      status: [],
      dueAt: null,
      createdAt: null,
      modifiedAt: null,
      comments: [],
      has: [],
    };

    let text = '';
    while (query) {
      m = query.match(reOperator1);
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
          if (operator === 'labels') {
            if (value in this.colorMap) {
              value = this.colorMap[value];
              // console.log('found color:', value);
            }
          } else if (['dueAt', 'createdAt', 'modifiedAt'].includes(operator)) {
            let days = parseInt(value, 10);
            let duration = null;
            if (isNaN(days)) {
              // duration was specified as text
              if (predicateTranslations.durations[value]) {
                duration = predicateTranslations.durations[value];
                let date = null;
                switch (duration) {
                  case 'week':
                    let week = moment().week();
                    if (week === 52) {
                      date = moment(1, 'W');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(week + 1, 'W');
                    }
                    break;
                  case 'month':
                    let month = moment().month();
                    // .month() is zero indexed
                    if (month === 11) {
                      date = moment(1, 'M');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(month + 2, 'M');
                    }
                    break;
                  case 'quarter':
                    let quarter = moment().quarter();
                    if (quarter === 4) {
                      date = moment(1, 'Q');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(quarter + 1, 'Q');
                    }
                    break;
                  case 'year':
                    date = moment(moment().year() + 1, 'YYYY');
                    break;
                }
                if (date) {
                  value = {
                    operator: '$lt',
                    value: date.format('YYYY-MM-DD'),
                  };
                }
              } else if (operator === 'dueAt' && value === 'overdue') {
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
            } else {
              if (operator === 'dueAt') {
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
            }
          } else if (operator === 'sort') {
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
                order: negated ? 'des' : 'asc',
              };
            }
          } else if (operator === 'status') {
            if (!predicateTranslations.status[value]) {
              this.parsingErrors.push({
                tag: 'operator-status-invalid',
                value,
              });
            } else {
              value = predicateTranslations.status[value];
            }
          } else if (operator === 'has') {
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
          if (Array.isArray(params[operator])) {
            params[operator].push(value);
          } else {
            params[operator] = value;
          }
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

    this.autorun(() => {
      const handle = Meteor.subscribe(
        'globalSearch',
        SessionData.getSessionId(),
        params,
      );
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          if (handle.ready()) {
            this.getResults();
            this.searching.set(false);
            this.hasResults.set(true);
          }
        });
      });
    });
  },

  nextPage() {
    const sessionData = this.getSessionData();

    this.autorun(() => {
      const handle = Meteor.subscribe('nextPage', sessionData.sessionId);
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          if (handle.ready()) {
            this.getResults();
            this.searching.set(false);
            this.hasResults.set(true);
          }
        });
      });
    });
  },

  previousPage() {
    const sessionData = this.getSessionData();

    this.autorun(() => {
      const handle = Meteor.subscribe('previousPage', sessionData.sessionId);
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          if (handle.ready()) {
            this.getResults();
            this.searching.set(false);
            this.hasResults.set(true);
          }
        });
      });
    });
  },

  getResultsHeading() {
    if (this.resultsCount === 0) {
      return TAPi18n.__('no-cards-found');
    } else if (this.resultsCount === 1) {
      return TAPi18n.__('one-card-found');
    } else if (this.resultsCount === this.totalHits) {
      return TAPi18n.__('n-cards-found', this.resultsCount);
    }

    return TAPi18n.__('n-n-of-n-cards-found', {
      start: this.resultsStart,
      end: this.resultsEnd,
      total: this.totalHits,
    });
  },

  getSearchHref() {
    const baseUrl = window.location.href.replace(/([?#].*$|\s*$)/, '');
    return `${baseUrl}?q=${encodeURIComponent(this.query.get())}`;
  },

  searchInstructions() {
    tags = {
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

    let text = `# ${TAPi18n.__('globalSearch-instructions-heading')}`;
    text += `\n${TAPi18n.__('globalSearch-instructions-description', tags)}`;
    text += `\n\n${TAPi18n.__('globalSearch-instructions-operators', tags)}`;

    [
      'globalSearch-instructions-operator-board',
      'globalSearch-instructions-operator-list',
      'globalSearch-instructions-operator-swimlane',
      'globalSearch-instructions-operator-comment',
      'globalSearch-instructions-operator-label',
      'globalSearch-instructions-operator-hash',
      'globalSearch-instructions-operator-user',
      'globalSearch-instructions-operator-at',
      'globalSearch-instructions-operator-member',
      'globalSearch-instructions-operator-assignee',
      'globalSearch-instructions-operator-due',
      'globalSearch-instructions-operator-created',
      'globalSearch-instructions-operator-modified',
      'globalSearch-instructions-operator-status',
    ].forEach(instruction => {
      text += `\n* ${TAPi18n.__(instruction, tags)}`;
    });

    [
      'globalSearch-instructions-status-archived',
      'globalSearch-instructions-status-public',
      'globalSearch-instructions-status-private',
      'globalSearch-instructions-status-all',
      'globalSearch-instructions-status-ended',
    ].forEach(instruction => {
      text += `\n    * ${TAPi18n.__(instruction, tags)}`;
    });

    [
      'globalSearch-instructions-operator-has',
      'globalSearch-instructions-operator-sort',
      'globalSearch-instructions-operator-limit',
    ].forEach(instruction => {
      text += `\n* ${TAPi18n.__(instruction, tags)}`;
    });

    text += `\n## ${TAPi18n.__('heading-notes')}`;
    [
      'globalSearch-instructions-notes-1',
      'globalSearch-instructions-notes-2',
      'globalSearch-instructions-notes-3',
      'globalSearch-instructions-notes-3-2',
      'globalSearch-instructions-notes-4',
      'globalSearch-instructions-notes-5',
    ].forEach(instruction => {
      text += `\n* ${TAPi18n.__(instruction, tags)}`;
    });

    return text;
  },

  labelColors() {
    return Boards.simpleSchema()._schema['labels.$.color'].allowedValues.map(
      color => {
        return { color, name: TAPi18n.__(`color-${color}`) };
      },
    );
  },

  events() {
    return [
      {
        'submit .js-search-query-form'(evt) {
          evt.preventDefault();
          this.searchAllBoards(evt.target.searchQuery.value);
        },
        'click .js-next-page'(evt) {
          evt.preventDefault();
          this.nextPage();
        },
        'click .js-previous-page'(evt) {
          evt.preventDefault();
          this.previousPage();
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
  },
}).register('globalSearch');

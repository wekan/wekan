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
    this.queryParams = null;
    this.parsingErrors = [];
    this.resultsCount = 0;
    this.totalHits = 0;
    this.queryErrors = null;
    this.colorMap = null;
    // this.colorMap = {};
    // for (const color of Boards.simpleSchema()._schema['labels.$.color']
    //   .allowedValues) {
    //   this.colorMap[TAPi18n.__(`color-${color}`)] = color;
    // }
    // // eslint-disable-next-line no-console
    // console.log('colorMap:', this.colorMap);

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

    Meteor.subscribe('setting');
    if (Session.get('globalQuery')) {
      this.searchAllBoards(Session.get('globalQuery'));
    }
  },

  resetSearch() {
    this.searching.set(false);
    this.hasResults.set(false);
    this.hasQueryErrors.set(false);
    this.resultsHeading.set('');
    this.parsingErrors = [];
    this.resultsCount = 0;
    this.totalHits = 0;
    this.queryErrors = null;
  },

  results() {
    // eslint-disable-next-line no-console
    // console.log('getting results');
    if (this.queryParams) {
      const results = Cards.globalSearch(this.queryParams);
      this.queryErrors = results.errors;
      // eslint-disable-next-line no-console
      // console.log('errors:', this.queryErrors);
      if (this.errorMessages().length) {
        this.hasQueryErrors.set(true);
        return null;
      }

      if (results.cards) {
        const sessionData = SessionData.findOne({ userId: Meteor.userId() });
        this.totalHits = sessionData.totalHits;
        this.resultsCount = results.cards.count();
        this.resultsHeading.set(this.getResultsHeading());
        return results.cards;
      }
    }
    this.resultsCount = 0;
    return [];
  },

  errorMessages() {
    const messages = [];

    if (this.queryErrors) {
      this.queryErrors.notFound.boards.forEach(board => {
        messages.push({ tag: 'board-title-not-found', value: board });
      });
      this.queryErrors.notFound.swimlanes.forEach(swim => {
        messages.push({ tag: 'swimlane-title-not-found', value: swim });
      });
      this.queryErrors.notFound.lists.forEach(list => {
        messages.push({ tag: 'list-title-not-found', value: list });
      });
      this.queryErrors.notFound.labels.forEach(label => {
        const color = Object.entries(this.colorMap)
          .filter(value => value[1] === label)
          .map(value => value[0]);
        if (color.length) {
          messages.push({
            tag: 'label-color-not-found',
            value: color[0],
          });
        } else {
          messages.push({ tag: 'label-not-found', value: label });
        }
      });
      this.queryErrors.notFound.users.forEach(user => {
        messages.push({ tag: 'user-username-not-found', value: user });
      });
      this.queryErrors.notFound.members.forEach(user => {
        messages.push({ tag: 'user-username-not-found', value: user });
      });
      this.queryErrors.notFound.assignees.forEach(user => {
        messages.push({ tag: 'user-username-not-found', value: user });
      });
    }

    if (this.parsingErrors.length) {
      this.parsingErrors.forEach(err => {
        messages.push(err);
      });
    }

    return messages;
  },

  searchAllBoards(query) {
    query = query.trim();
    this.query.set(query);

    this.resetSearch();

    if (!query) {
      return;
    }

    // eslint-disable-next-line no-console
    // console.log('query:', query);

    this.searching.set(true);

    if (!this.colorMap) {
      this.colorMap = {};
      for (const color of Boards.simpleSchema()._schema['labels.$.color']
        .allowedValues) {
        this.colorMap[TAPi18n.__(`color-${color}`)] = color;
      }
    }

    const reOperator1 = /^((?<operator>\w+):|(?<abbrev>[#@]))(?<value>\w+)(\s+|$)/;
    const reOperator2 = /^((?<operator>\w+):|(?<abbrev>[#@]))(?<quote>["']*)(?<value>.*?)\k<quote>(\s+|$)/;
    const reText = /^(?<text>\S+)(\s+|$)/;
    const reQuotedText = /^(?<quote>["'])(?<text>\w+)\k<quote>(\s+|$)/;

    const operatorMap = {};
    operatorMap[TAPi18n.__('operator-board')] = 'boards';
    operatorMap[TAPi18n.__('operator-board-abbrev')] = 'boards';
    operatorMap[TAPi18n.__('operator-swimlane')] = 'swimlanes';
    operatorMap[TAPi18n.__('operator-swimlane-abbrev')] = 'swimlanes';
    operatorMap[TAPi18n.__('operator-list')] = 'lists';
    operatorMap[TAPi18n.__('operator-list-abbrev')] = 'lists';
    operatorMap[TAPi18n.__('operator-label')] = 'labels';
    operatorMap[TAPi18n.__('operator-label-abbrev')] = 'labels';
    operatorMap[TAPi18n.__('operator-user')] = 'users';
    operatorMap[TAPi18n.__('operator-user-abbrev')] = 'users';
    operatorMap[TAPi18n.__('operator-member')] = 'members';
    operatorMap[TAPi18n.__('operator-member-abbrev')] = 'members';
    operatorMap[TAPi18n.__('operator-assignee')] = 'assignees';
    operatorMap[TAPi18n.__('operator-assignee-abbrev')] = 'assignees';
    operatorMap[TAPi18n.__('operator-is')] = 'is';
    operatorMap[TAPi18n.__('operator-due')] = 'dueAt';
    operatorMap[TAPi18n.__('operator-created')] = 'createdAt';
    operatorMap[TAPi18n.__('operator-modified')] = 'modifiedAt';

    // eslint-disable-next-line no-console
    console.log('operatorMap:', operatorMap);
    const params = {
      boards: [],
      swimlanes: [],
      lists: [],
      users: [],
      members: [],
      assignees: [],
      labels: [],
      is: [],
      dueAt: null,
      createdAt: null,
      modifiedAt: null,
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
          op = m.groups.abbrev;
        }
        if (op !== "__proto__") {
          if (op in operatorMap) {
            let value = m.groups.value;
            if (operatorMap[op] === 'labels') {
              if (value in this.colorMap) {
                value = this.colorMap[value];
              }
            } else if (
              ['dueAt', 'createdAt', 'modifiedAt'].includes(operatorMap[op])
            ) {
              const days = parseInt(value, 10);
              if (isNaN(days)) {
                if (['day', 'week', 'month', 'quarter', 'year'].includes(value)) {
                  value = moment()
                    .subtract(1, value)
                    .format();
                } else {
                  this.parsingErrors.push({
                    tag: 'operator-number-expected',
                    value: { operator: op, value },
                  });
                  value = null;
                }
              } else {
                value = moment()
                  .subtract(days, 'days')
                  .format();
              }
            }
            if (Array.isArray(params[operatorMap[op]])) {
              params[operatorMap[op]].push(value);
            } else {
              params[operatorMap[op]] = value;
            }
          } else {
            this.parsingErrors.push({
              tag: 'operator-unknown-error',
              value: op,
            });
          }
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
    // console.log('params:', params);

    this.queryParams = params;

    this.autorun(() => {
      const handle = subManager.subscribe('globalSearch', params);
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          // eslint-disable-next-line no-console
          // console.log('ready:', handle.ready());
          if (handle.ready()) {
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
      start: 1,
      end: this.resultsCount,
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
      operator_label: TAPi18n.__('operator-label'),
      operator_label_abbrev: TAPi18n.__('operator-label-abbrev'),
      operator_user: TAPi18n.__('operator-user'),
      operator_user_abbrev: TAPi18n.__('operator-user-abbrev'),
      operator_member: TAPi18n.__('operator-member'),
      operator_member_abbrev: TAPi18n.__('operator-member-abbrev'),
      operator_assignee: TAPi18n.__('operator-assignee'),
      operator_assignee_abbrev: TAPi18n.__('operator-assignee-abbrev'),
    };

    text = `# ${TAPi18n.__('globalSearch-instructions-heading')}`;
    text += `\n${TAPi18n.__('globalSearch-instructions-description', tags)}`;
    text += `\n${TAPi18n.__('globalSearch-instructions-operators', tags)}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-board',
      tags,
    )}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-list',
      tags,
    )}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-swimlane',
      tags,
    )}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-label',
      tags,
    )}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-hash',
      tags,
    )}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-user',
      tags,
    )}`;
    text += `\n* ${TAPi18n.__('globalSearch-instructions-operator-at', tags)}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-member',
      tags,
    )}`;
    text += `\n* ${TAPi18n.__(
      'globalSearch-instructions-operator-assignee',
      tags,
    )}`;

    text += `\n## ${TAPi18n.__('heading-notes')}`;
    text += `\n* ${TAPi18n.__('globalSearch-instructions-notes-1', tags)}`;
    text += `\n* ${TAPi18n.__('globalSearch-instructions-notes-2', tags)}`;
    text += `\n* ${TAPi18n.__('globalSearch-instructions-notes-3', tags)}`;
    text += `\n* ${TAPi18n.__('globalSearch-instructions-notes-4', tags)}`;
    text += `\n* ${TAPi18n.__('globalSearch-instructions-notes-5', tags)}`;

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
        'click .js-label-color'(evt) {
          evt.preventDefault();
          this.query.set(
            `${this.query.get()} ${TAPi18n.__('operator-label')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
        'click .js-board-title'(evt) {
          evt.preventDefault();
          this.query.set(
            `${this.query.get()} ${TAPi18n.__('operator-board')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
        'click .js-list-title'(evt) {
          evt.preventDefault();
          this.query.set(
            `${this.query.get()} ${TAPi18n.__('operator-list')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
        'click .js-label-name'(evt) {
          evt.preventDefault();
          this.query.set(
            `${this.query.get()} ${TAPi18n.__('operator-label')}:"${
              evt.currentTarget.textContent
            }"`,
          );
          document.getElementById('global-search-input').focus();
        },
      },
    ];
  },
}).register('globalSearch');

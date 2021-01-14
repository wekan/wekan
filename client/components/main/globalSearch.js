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
    this.isPageReady = new ReactiveVar(true);
    this.searching = new ReactiveVar(false);
    this.hasResults = new ReactiveVar(false);
    this.query = new ReactiveVar('');
    this.queryParams = null;
    this.resultsCount = new ReactiveVar(0);
    this.totalHits = new ReactiveVar(0);
    this.queryErrors = new ReactiveVar(null);
    Meteor.subscribe('setting');
  },

  results() {
    if (this.queryParams) {
      const results = Cards.globalSearch(this.queryParams);
      // eslint-disable-next-line no-console
      // console.log('user:', Meteor.user());
      // eslint-disable-next-line no-console
      // console.log('user:', Meteor.user().sessionData);
      // console.log('errors:', results.errors);
      this.totalHits.set(Meteor.user().sessionData.totalHits);
      this.resultsCount.set(results.cards.count());
      this.queryErrors.set(results.errors);
      return results.cards;
    }
    this.resultsCount.set(0);
    return [];
  },

  errorMessages() {
    const errors = this.queryErrors.get();
    const messages = [];

    errors.notFound.boards.forEach(board => {
      messages.push({ tag: 'board-title-not-found', value: board });
    });
    errors.notFound.swimlanes.forEach(swim => {
      messages.push({ tag: 'swimlane-title-not-found', value: swim });
    });
    errors.notFound.lists.forEach(list => {
      messages.push({ tag: 'list-title-not-found', value: list });
    });
    errors.notFound.users.forEach(user => {
      messages.push({ tag: 'user-username-not-found', value: user });
    });

    return messages;
  },

  events() {
    return [
      {
        'submit .js-search-query-form'(evt) {
          evt.preventDefault();
          this.query.set(evt.target.searchQuery.value);
          this.queryErrors.set(null);

          if (!this.query.get()) {
            this.searching.set(false);
            this.hasResults.set(false);
            return;
          }

          this.searching.set(true);
          this.hasResults.set(false);

          let query = this.query.get();
          // eslint-disable-next-line no-console
          // console.log('query:', query);

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
          operatorMap[TAPi18n.__('operator-is')] = 'is';

          // eslint-disable-next-line no-console
          // console.log('operatorMap:', operatorMap);
          const params = {
            boards: [],
            swimlanes: [],
            lists: [],
            users: [],
            labels: [],
            is: [],
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
              if (op in operatorMap) {
                params[operatorMap[op]].push(m.groups.value);
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
      },
    ];
  },
}).register('globalSearch');

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
    this.query = new ReactiveVar('');

    // this.autorun(() => {
    //   const handle = subManager.subscribe('globalSearch');
    //   Tracker.nonreactive(() => {
    //     Tracker.autorun(() => {
    //       this.isPageReady.set(handle.ready());
    //     });
    //   });
    // });
    Meteor.subscribe('setting');
  },

  events() {
    return [
      {
        'submit .js-search-query-form'(evt) {
          evt.preventDefault();
          this.query.set(evt.target.searchQuery.value);
          // eslint-disable-next-line no-console
          console.log('query:', this.query.get());

          let query = this.query.get();
          const reUser = /^@(?<user>\w+)(\s+|$)/;
          const reLabel = /^#(?<label>\w+)(\s+|$)/;
          const reOperator1 = /^(?<operator>\w+):(?<value>\w+)(\s+|$)/;
          const reOperator2 = /^(?<operator>\w+):(?<quote>["']*)(?<value>.*?)\k<quote>(\s+|$)/;
          const reText = /^(?<text>[^:@#\s]+)(\s+|$)/;
          const reQuotedText = /^(?<quote>["'])(?<text>\w+)\k<quote>(\s+|$)/;
          const operatorMap = {
            board: 'boards',
            b: 'boards',
            label: 'labels',
            lable: 'labels',
            user: 'users',
            u: 'users',
            swimlane: 'swimlanes',
            swim: 'swimlanes',
            s: 'swimlanes',
            list: 'lists',
            l: 'lists',
          };
          const selector = {
            boards: [],
            swimlanes: [],
            lists: [],
            users: [],
            labels: [],
          };
          let text = '';
          while (query) {
            // eslint-disable-next-line no-console
            console.log('query:', query);
            let m = query.match(reUser);
            if (m) {
              query = query.replace(reUser, '');
              selector.users.push(m.groups.user);
              continue;
            }

            m = query.match(reLabel);
            if (m) {
              query = query.replace(reLabel, '');
              selector.labels.push(m.groups.label);
              continue;
            }

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
              const op = m.groups.operator.toLowerCase();
              if (op in operatorMap) {
                selector[operatorMap[op]].push(m.groups.value);
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
          console.log('selector:', selector);
          // eslint-disable-next-line no-console
          console.log('text:', text);
        },
      },
    ];
  },

  globalSearchList() {},
}).register('globalSearch');

import { CardSearchPaged } from '../../lib/cardSearch';
import { Utils } from '/client/lib/utils';

Template.myCardsHeaderBar.helpers({
  myCardsSort() {
    // eslint-disable-next-line no-console
    // console.log('sort:', Utils.myCardsSort());
    return Utils.myCardsSort();
  },

  myCardsView() {
    // eslint-disable-next-line no-console
    // console.log('sort:', Utils.myCardsView());
    return Utils.myCardsView();
  },
});

Template.myCardsHeaderBar.events({
  'click .js-toggle-my-cards-choose-sort': Popup.open(
    'myCardsSortChange',
  ),
  'click .js-my-cards-view-change': Popup.open(
    'myCardsViewChange'),
});

Template.myCards.onCreated(function () {
  const search = new CardSearchPaged(this);
  this.search = search;

  // Override getSubscription for myCards
  search.getSubscription = function (queryParams) {
    return Meteor.subscribe(
      'myCards',
      search.sessionId,
      search.subscriptionCallbacks,
    );
  };

  search.runGlobalSearch(null);
  Meteor.subscribe('setting');
});

Template.myCards.helpers({
  userId() {
    return Meteor.userId();
  },

  // Return ReactiveVar so jade can use .get pattern
  searching() {
    return Template.instance().search.searching;
  },

  myCardsView() {
    // eslint-disable-next-line no-console
    //console.log('sort:', Utils.myCardsView());
    return Utils.myCardsView();
  },

  labelName(board, labelId) {
    const label = board.getLabelById(labelId);
    const name = label.name;
    return name;
  },

  labelColor(board, labelId) {
    const label = board.getLabelById(labelId);
    const color = label.color;
    return color;
  },

  myCardsList() {
    const search = Template.instance().search;
    const boards = [];
    let board = null;
    let swimlane = null;
    let list = null;

    const cursor = search.getResults();

    if (cursor) {
      cursor.forEach(card => {
        // eslint-disable-next-line no-console
        // console.log('card:', card.title);
        if (board === null || card.boardId !== board._id) {
          // eslint-disable-next-line no-console
          // console.log('new board');
          board = card.getBoard();
          if (board.archived) {
            board = null;
            return;
          }
          // eslint-disable-next-line no-console
          // console.log('board:', b, b._id, b.title);
          boards.push(board);
          board.mySwimlanes = [];
          swimlane = null;
          list = null;
        }

        if (swimlane === null || card.swimlaneId !== swimlane._id) {
          // eslint-disable-next-line no-console
          // console.log('new swimlane');
          swimlane = card.getSwimlane();
          if (swimlane.archived) {
            swimlane = null;
            return;
          }
          board.mySwimlanes.push(swimlane);
          swimlane.myLists = [];
          list = null;
        }

        if (list === null || card.listId !== list._id) {
          // eslint-disable-next-line no-console
          // console.log('new list');
          list = card.getList();
          if (list.archived) {
            list = null;
            return;
          }
          swimlane.myLists.push(list);
          list.myCards = [];
        }

        list.myCards.push(card);
      });

      // sort the data structure
      boards.forEach(board => {
        board.mySwimlanes.forEach(swimlane => {
          swimlane.myLists.forEach(list => {
            list.myCards.sort((a, b) => {
              return a.sort - b.sort;
            });
          });
          swimlane.myLists.sort((a, b) => {
            return a.sort - b.sort;
          });
        });
        board.mySwimlanes.sort((a, b) => {
          return a.sort - b.sort;
        });
      });

      boards.sort((a, b) => {
        let x = a.sort;
        let y = b.sort;

        // show the template board last
        if (a.type === 'template-container') {
          x = 99999999;
        } else if (b.type === 'template-container') {
          y = 99999999;
        }
        return x - y;
      });

      // eslint-disable-next-line no-console
      // console.log('boards:', boards);
      return boards;
    }

    return [];
  },
});

Template.myCards.events({
  'click .js-next-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.nextPage();
  },
  'click .js-previous-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.previousPage();
  },
});

Template.myCardsViewChangePopup.events({
  'click .js-my-cards-view-boards'() {
    Utils.setMyCardsView('boards');
    Popup.back();
  },

  'click .js-my-cards-view-table'() {
    Utils.setMyCardsView('table');
    Popup.back();
  },
});

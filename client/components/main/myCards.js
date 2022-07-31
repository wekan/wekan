import { CardSearchPagedComponent } from '../../lib/cardSearch';

BlazeComponent.extendComponent({
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

  events() {
    return [
      {
        'click .js-toggle-my-cards-choose-sort': Popup.open(
          'myCardsSortChange',
        ),
        'click .js-my-cards-view-change': Popup.open(
          'myCardsViewChange'),
      },
    ];
  },
}).register('myCardsHeaderBar');

Template.myCards.helpers({
  userId() {
    return Meteor.userId();
  },
});

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-my-cards-view-boards'() {
          Utils.setMyCardsView('boards');
          Popup.back();
        },

        'click .js-my-cards-view-table'() {
          Utils.setMyCardsView('table');
          Popup.back();
        },
      },
    ];
  },
}).register('myCardsViewChangePopup');

class MyCardsComponent extends CardSearchPagedComponent {
  onCreated() {
    super.onCreated();

    this.runGlobalSearch(null);
    Meteor.subscribe('setting');
  }

  // eslint-disable-next-line no-unused-vars
  getSubscription(queryParams) {
    return Meteor.subscribe(
      'myCards',
      this.sessionId,
      this.subscriptionCallbacks,
    );
  }

  myCardsView() {
    // eslint-disable-next-line no-console
    //console.log('sort:', Utils.myCardsView());
    return Utils.myCardsView();
  }

  labelName(board, labelId) {
    const label = board.getLabelById(labelId)
    const name = label.name
    return name
  }

  labelColor(board, labelId) {
    const label = board.getLabelById(labelId)
    const color = label.color
    return color
  }

  myCardsList() {
    const boards = [];
    let board = null;
    let swimlane = null;
    let list = null;

    const cursor = this.getResults();

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
  }
}
MyCardsComponent.register('myCards');

const subManager = new SubsManager();

BlazeComponent.extendComponent({
  myCardsSort() {
    // eslint-disable-next-line no-console
    // console.log('sort:', Utils.myCardsSort());
    return Utils.myCardsSort();
  },

  events() {
    return [
      {
        'click .js-toggle-my-cards-choose-sort': Popup.open(
          'myCardsSortChange',
        ),
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
        'click .js-my-cards-sort-board'() {
          Utils.setMyCardsSort('board');
          Popup.close();
        },

        'click .js-my-cards-sort-dueat'() {
          Utils.setMyCardsSort('dueAt');
          Popup.close();
        },
      },
    ];
  },
}).register('myCardsSortChangePopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.isPageReady = new ReactiveVar(false);

    this.autorun(() => {
      const handle = subManager.subscribe('myCards');
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          this.isPageReady.set(handle.ready());
        });
      });
    });
    Meteor.subscribe('setting');
  },

  myCardsSort() {
    // eslint-disable-next-line no-console
    //console.log('sort:', Utils.myCardsSort());
    return Utils.myCardsSort();
  },

  sortByBoard() {
    return this.myCardsSort() === 'board';
  },

  myCardsList() {
    const userId = Meteor.userId();
    const boards = [];
    let board = null;
    let swimlane = null;
    let list = null;

    const cursor = Cards.find(
      {
        $or: [{ members: userId }, { assignees: userId }],
        archived: false,
      },
      {
        sort: {
          boardId: 1,
          swimlaneId: 1,
          listId: 1,
          sort: 1,
        },
      },
    );

    let newBoard = false;
    let newSwimlane = false;
    let newList = false;

    cursor.forEach(card => {
      // eslint-disable-next-line no-console
      // console.log('card:', card.title);
      if (list === null || card.listId !== list._id) {
        // eslint-disable-next-line no-console
        // console.log('new list');
        list = card.getList();
        if (list.archived) {
          list = null;
          return;
        }
        list.myCards = [card];
        newList = true;
      }
      if (swimlane === null || card.swimlaneId !== swimlane._id) {
        // eslint-disable-next-line no-console
        // console.log('new swimlane');
        swimlane = card.getSwimlane();
        if (swimlane.archived) {
          swimlane = null;
          return;
        }
        swimlane.myLists = [list];
        newSwimlane = true;
      }
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
        board.mySwimlanes = [swimlane];
        newBoard = true;
      }

      if (newBoard) {
        boards.push(board);
      } else if (newSwimlane) {
        board.mySwimlanes.push(swimlane);
      } else if (newList) {
        swimlane.myLists.push(list);
      } else {
        list.myCards.push(card);
      }

      newBoard = false;
      newSwimlane = false;
      newList = false;
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
  },

  myDueCardsList() {
    const userId = Meteor.userId();

    const cursor = Cards.find(
      {
        $or: [{ members: userId }, { assignees: userId }],
        archived: false,
      },
      {
        sort: {
          dueAt: -1,
          boardId: 1,
          swimlaneId: 1,
          listId: 1,
          sort: 1,
        },
      },
    );

    // eslint-disable-next-line no-console
    // console.log('cursor:', cursor);

    const cards = [];
    cursor.forEach(card => {
      if (
        !card.getBoard().archived &&
        !card.getSwimlane().archived &&
        !card.getList().archived
      ) {
        cards.push(card);
      }
    });

    cards.sort((a, b) => {
      const x = a.dueAt === null ? Date('2100-12-31') : a.dueAt;
      const y = b.dueAt === null ? Date('2100-12-31') : b.dueAt;

      if (x > y) return 1;
      else if (x < y) return -1;

      return 0;
    });

    // eslint-disable-next-line no-console
    // console.log('cursor:', cards);
    return cards;
  },

  events() {
    return [
      {
        // 'click .js-my-card'(evt) {
        //   const card = this.currentData().card;
        //   // eslint-disable-next-line no-console
        //   console.log('currentData():', this.currentData());
        //   // eslint-disable-next-line no-console
        //   console.log('card:', card);
        //   if (card) {
        //     Utils.goCardId(card._id);
        //   }
        //   evt.preventDefault();
        // },
      },
    ];
  },
}).register('myCards');

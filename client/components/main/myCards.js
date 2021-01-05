const subManager = new SubsManager();
Meteor.subscribe('myCards');
Meteor.subscribe('mySwimlanes');
Meteor.subscribe('myLists');

Template.myCardsHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

Template.myCardsHeaderBar.helpers({
  title() {
    return FlowRouter.getRouteName() === 'home' ? 'my-boards' : 'public';
  },
  templatesUser() {
    return Meteor.user();
  },
});

Template.myCards.helpers({
  userId() {
    return Meteor.userId();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
    // subManager.subscribe('myCards');
  },

  myBoards() {
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
        list = card.list();
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
        swimlane = card.swimlane();
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
        board = card.board();
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

  events() {
    return [
      {
        'click .js-my-card'(evt) {
          const card = this.currentData().card;
          // eslint-disable-next-line no-console
          console.log('currentData():', this.currentData());
          // eslint-disable-next-line no-console
          console.log('card:', card);
          if (card) {
            Utils.goCardId(card._id);
          }
          evt.preventDefault();
        },
      },
    ];
  },
}).register('myCards');

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

  cardsFind() {
    const userId = Meteor.userId();
    const boards = [];
    let board = null;
    let swimlane = null;
    let list = null;

    const cursor = Cards.find(
      {
        archived: false,
        $or: [{ members: userId }, { assignees: userId }],
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
    // eslint-disable-next-line no-console
    // console.log('cursor:', cursor);

    let newBoard = false;
    let newSwimlane = false;
    let newList = false;

    cursor.forEach(card => {
      // eslint-disable-next-line no-console
      // console.log('card:', card.title);
      if (list === null || list.id !== card.listId) {
        // eslint-disable-next-line no-console
        // console.log('new list');
        let l = Lists.findOne(card.listId);
        if (!l) {
          l = {
            _id: card.listId,
            title: 'undefined list',
          };
        }
        // eslint-disable-next-line no-console
        // console.log('list:', l);
        list = {
          id: l._id,
          title: l.title,
          cards: [card],
        };
        newList = true;
      }
      if (swimlane === null || card.swimlaneId !== swimlane.id) {
        // eslint-disable-next-line no-console
        // console.log('new swimlane');
        let s = Swimlanes.findOne(card.swimlaneId);
        if (!s) {
          s = {
            _id: card.swimlaneId,
            title: 'undefined swimlane',
          };
        }
        // eslint-disable-next-line no-console
        // console.log('swimlane:', s);
        swimlane = {
          id: s._id,
          title: s.title,
          lists: [list],
        };
        newSwimlane = true;
      }
      if (board === null || card.boardId !== board.id) {
        // eslint-disable-next-line no-console
        // console.log('new board');
        const b = Boards.findOne(card.boardId);
        // eslint-disable-next-line no-console
        // console.log('board:', b, b._id, b.title);
        board = {
          id: b._id,
          title: b.title,
          slug: b.slug,
          swimlanes: [swimlane],
        };
        newBoard = true;
      }

      if (newBoard) {
        boards.push(board);
      } else if (newSwimlane) {
        board.swimlanes.push(swimlane);
      } else if (newList) {
        swimlane.lists.push(list);
      } else {
        list.cards.push(card);
      }

      newBoard = false;
      newSwimlane = false;
      newList = false;
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

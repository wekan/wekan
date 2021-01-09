BlazeComponent.extendComponent({}).register('brokenCardsHeaderBar');

Template.brokenCards.helpers({
  userId() {
    return Meteor.userId();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
    Meteor.subscribe('brokenCards');
  },

  brokenCardsList() {
    const user = Meteor.user();

    const permiitedBoards = [null];
    let selector = {};
    // if user is not an admin allow her to see cards only from boards where
    // she is a member
    if (!user.isAdmin) {
      selector.$or = [
        { permission: 'public' },
        { members: { $elemMatch: { userId: user._id, isActive: true } } },
      ];
    }
    Boards.find(selector).forEach(board => {
      permiitedBoards.push(board._id);
    });

    selector = {
      boardId: { $in: permiitedBoards },
      $or: [{ boardId: null }, { swimlaneId: null }, { listId: null }],
    };

    const cards = Cards.find(selector, {
      fields: {
        _id: 1,
        archived: 1,
        boardId: 1,
        swimlaneId: 1,
        listId: 1,
        title: 1,
        type: 1,
        sort: 1,
        members: 1,
        assignees: 1,
        colors: 1,
        dueAt: 1,
      },
    });

    // eslint-disable-next-line no-console
    // console.log('cards:', cards);
    return cards;
  },
}).register('brokenCards');

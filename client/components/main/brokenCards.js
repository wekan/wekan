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
    const selector = {
      $or: [
        { boardId: { $in: [null, ''] } },
        { swimlaneId: { $in: [null, ''] } },
        { listId: { $in: [null, ''] } },
        { permission: 'public' },
        { members: { $elemMatch: { userId: user._id, isActive: true } } },
      ],
    };

    return Cards.find(selector);
  },
}).register('brokenCards');

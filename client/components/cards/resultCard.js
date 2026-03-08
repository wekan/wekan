Template.resultCard.helpers({
  userId() {
    return Meteor.userId();
  },
});

Template.resultCard.events({
  'click .js-minicard'(event) {
    event.preventDefault();
    const cardId = Template.currentData()._id;
    const boardId = Template.currentData().boardId;
    Meteor.subscribe('popupCardData', cardId, {
      onReady() {
        Session.set('popupCardId', cardId);
        Session.set('popupCardBoardId', boardId);
        if (!Popup.isOpen()) {
          Popup.open("cardDetails")(event);
        }
      },
    });
  },
});

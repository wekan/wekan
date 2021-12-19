Template.resultCard.helpers({
  userId() {
    return Meteor.userId();
  },
});

BlazeComponent.extendComponent({
  clickOnMiniCard(evt) {
    evt.preventDefault();
    const this_ = this;
    const cardId = this.currentData()._id;
    const boardId = this.currentData().boardId;
    Meteor.subscribe('popupCardData', cardId, {
      onReady() {
        Session.set('popupCardId', cardId);
        Session.set('popupCardBoardId', boardId);
        this_.cardDetailsPopup(evt);
      },
    });
  },

  cardDetailsPopup(event) {
    if (!Popup.isOpen()) {
      Popup.open("cardDetails")(event);
    }
  },

  events() {
    return [
      {
        'click .js-minicard': this.clickOnMiniCard,
      },
    ];
  },
}).register('resultCard');

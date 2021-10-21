Template.resultCard.helpers({
  userId() {
    return Meteor.userId();
  },
});

BlazeComponent.extendComponent({
  clickOnMiniCard(evt) {
    evt.preventDefault();
    Session.set('popupCard', this.currentData()._id);
    this.cardDetailsPopup(evt);
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

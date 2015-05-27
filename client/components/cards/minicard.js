// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });


BlazeComponent.extendComponent({
  template: function() {
    return 'minicard';
  },

  isSelected: function() {
    return Session.equals('currentCard', this.currentData()._id);
  }
}).register('minicard');

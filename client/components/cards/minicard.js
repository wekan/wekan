// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template: function() {
    return 'minicard';
  }
}).register('minicard');

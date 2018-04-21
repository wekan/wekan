// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template() {
    return 'minicard';
  },

  makeCompactLabelName(name) {
    return name.replace(/\(.*\)/g, '').trim()
  }
}).register('minicard');

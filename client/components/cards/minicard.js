// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  onCreated() {
    this.currentColor = new ReactiveVar(this.data().color);
  },

  template() {
    return 'minicard';
  },

  events() {
    return [{
      'click .js-linked-link' () {
        if (this.data().isLinkedCard())
          Utils.goCardId(this.data().linkedId);
        else if (this.data().isLinkedBoard())
          Utils.goBoardId(this.data().linkedId);
      },
    }];
  },
}).register('minicard');

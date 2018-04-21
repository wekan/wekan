// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template() {
    return 'minicard';
  },

  events() {
    return [{
      'click .js-imported-link' (evt) {
        if (this.data().isImportedCard())
          Utils.goCardId(this.data().importedId);
        else if (this.data().isImportedBoard())
          Utils.goBoardId(this.data().importedId);
      },
    }];
  },
}).register('minicard');

// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template() {
    return 'minicard';
  },
  importedCard() {
    return this.currentData().type === 'cardType-importedCard';
  },
  importedBoard() {
    return this.currentData().type === 'cardType-importedBoard';
  },
  imported() {
    return this.importedCard() || this.importedBoard();
  },
}).register('minicard');

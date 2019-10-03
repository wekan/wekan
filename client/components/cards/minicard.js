// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template() {
    return 'minicard';
  },

  events() {
    return [
      {
        'click .js-linked-link'() {
          if (this.data().isLinkedCard()) Utils.goCardId(this.data().linkedId);
          else if (this.data().isLinkedBoard())
            Utils.goBoardId(this.data().linkedId);
        },
      },
      {
        'click .js-toggle-minicard-label-text'() {
          Meteor.call('toggleMinicardLabelText');
        },
      },
    ];
  },
}).register('minicard');

Template.minicard.helpers({
  hiddenMinicardLabelText() {
    return Meteor.user().hasHiddenMinicardLabelText();
  },
});

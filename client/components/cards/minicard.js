// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

BlazeComponent.extendComponent({
  template: function() {
    return 'minicard';
  },

  isSelected: function() {
    return Session.equals('currentCard', this.currentData()._id);
  },

  toggleMultiSelection: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    MultiSelection.toogle(this.currentData()._id);
  },

  clickOnMiniCard: function(evt) {
    if (MultiSelection.isActive() || evt.shiftKey) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      var methodName = evt.shiftKey ? 'toogleRange' : 'toogle';
      MultiSelection[methodName](this.currentData()._id);
    }
  },

  events: function() {
    return [{
      submit: this.addCard,
      'click .js-toggle-multi-selection': this.toggleMultiSelection,
      'click .js-minicard': this.clickOnMiniCard,
      'click .open-minicard-composer': this.scrollToBottom
    }];
  }
}).register('minicard');

Popup.template.events({
  click: function(evt) {
    if (evt.originalEvent) {
      evt.originalEvent.clickInPopup = true;
    }
  },
  'click .js-back-view': function() {
    Popup.back();
  },
  'click .js-close-pop-over': function() {
    Popup.close();
  },
  'click .js-confirm': function() {
    this.__afterConfirmAction.call(this);
  }
});

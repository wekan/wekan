BlazeComponent.extendComponent({
  editTitle(evt) {
    evt.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0].getValue().trim();
    const swimlane = this.currentData();
    if (newTitle) {
      swimlane.rename(newTitle.trim());
    }
  },

  events() {
    return [{
      'click .js-open-swimlane-menu': Popup.open('swimlaneAction'),
      submit: this.editTitle,
    }];
  },
}).register('swimlaneHeader');

Template.swimlaneActionPopup.events({
  'click .js-close-swimlane' (evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
});

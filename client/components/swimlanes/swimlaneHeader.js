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
      'click .js-open-add-swimlane-menu': Popup.open('swimlaneAdd'),
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

BlazeComponent.extendComponent({
  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        const titleInput = this.find('.swimlane-name-input');
        const title = titleInput.value.trim();
        if (title) {
          Swimlanes.insert({
            title,
            boardId: Session.get('currentBoard'),
            // XXX we should insert the swimlane right after the caller
            sort: $('.swimlane').length,
          });

          titleInput.value = '';
          titleInput.focus();
        }
        // XXX ideally, we should move the popup to the newly
        // created swimlane so a user can add more than one swimlane
        // with a minimum of interactions
        Popup.close();
      },
    }];
  },
}).register('swimlaneAddPopup');

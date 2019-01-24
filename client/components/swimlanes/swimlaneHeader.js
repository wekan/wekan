const { calculateIndexData } = Utils;

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
  onCreated() {
    this.currentSwimlane = this.currentData();
  },

  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const nextSwimlane = currentBoard.nextSwimlane(this.currentSwimlane);
        const titleInput = this.find('.swimlane-name-input');
        const title = titleInput.value.trim();
        const sortValue = calculateIndexData(this.currentSwimlane, nextSwimlane, 1);

        if (title) {
          Swimlanes.insert({
            title,
            boardId: Session.get('currentBoard'),
            sort: sortValue.base,
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

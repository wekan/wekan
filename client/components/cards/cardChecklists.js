BlazeComponent.extendComponent({
  toggleSelection(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    const isFinished = !this.currentData().isFinished;
    if (isFinished != null) {
      CardChecklists.update(this.currentData()._id, {
        $set: {
          isFinished: isFinished,
          finishedAt: new Date(),
        },
      });
    }
  },
  
  updateChecklistItemText(evt) {
    evt.preventDefault();
    const text = this.currentComponent().getValue().trim();
    if (text) {
      const checklistId = this.currentData()._id;
      CardChecklists.update(checklistId, {
        $set: {
          text: text,
        },
      });
    }
  },
  
  removeChecklistItem() {
    const checklistId = this.currentData()._id;
    CardChecklists.remove(checklistId);
  },
  
  addChecklistItem(evt) {
    evt.preventDefault();
    const text = this.currentComponent().getValue().trim();
    if (text) {
      CardChecklists.insert({
        text,
        boardId: this.currentData().card.boardId,
        cardId: this.currentData().card._id,
        isFinished: false,
      });
    }
  },
  
  events() {
    return [{
      'click .js-toggle-multi-selection': this.toggleSelection,
      'submit .js-card-add-checklist-item': this.addChecklistItem,
      'submit .js-card-checklist-item': this.updateChecklistItemText,
      'click .js-delete-checklist': this.removeChecklistItem,
    }];
  },
}).register('cardChecklists');

Template.addChecklistItemForm.onRendered(function() {
  autosize(this.$('.js-add-checklist-item'));
});

Template.addChecklistItemForm.events({
  'keydown .js-add-checklist-item'(evt) {
    // If enter key was pressed, submit the data
    if (evt.keyCode === 13) {
      $('.js-submit-add-checklist-item-form').click();
    }
  },
});

Template.editChecklistItemForm.onRendered(function() {
  autosize(this.$('.js-edit-checklist-item'));
});

Template.editChecklistItemForm.events({
  'keydown .js-edit-checklist-item'(evt) {
    // If enter key was pressed, submit the data
    if (evt.keyCode === 13) {
      $('.js-submit-edit-checklist-item-form').click();
    }
  },
});

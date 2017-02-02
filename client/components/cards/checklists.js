BlazeComponent.extendComponent({
  addChecklist(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const title = textarea.value.trim();
    const cardId = this.currentData().cardId;
    Checklists.insert({
      cardId,
      title,
    });
  },

  addChecklistItem(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const title = textarea.value.trim();
    const checklist = this.currentData().checklist;
    checklist.addItem(title);
  },

  editChecklist(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-edit-checklist-item');
    const title = textarea.value.trim();
    const checklist = this.currentData().checklist;
    checklist.setTitle(title);
  },

  editChecklistItem(event) {
    event.preventDefault();

    const textarea = this.find('textarea.js-edit-checklist-item');
    const title = textarea.value.trim();
    const itemId = this.currentData().item._id;
    const checklist = this.currentData().checklist;
    checklist.editItem(itemId, title);
  },

  deleteItem() {
    const checklist = this.currentData().checklist;
    const item = this.currentData().item;
    if (checklist && item && item._id) {
      checklist.removeItem(item._id);
    }
  },

  deleteChecklist() {
    const checklist = this.currentData().checklist;
    if (checklist && checklist._id) {
      Checklists.remove(checklist._id);
    }
  },

  pressKey(event) {
    //If user press enter key inside a form, submit it, so user doesn't have to leave keyboard to submit a form.
    if (event.keyCode === 13) {
      event.preventDefault();
      const $form = $(event.currentTarget).closest('form');
      $form.find('button[type=submit]').click();
    }
  },

  events() {
    return [{
      'submit .js-add-checklist': this.addChecklist,
      'submit .js-edit-checklist-title': this.editChecklist,
      'submit .js-add-checklist-item': this.addChecklistItem,
      'submit .js-edit-checklist-item': this.editChecklistItem,
      'click .js-delete-checklist-item': this.deleteItem,
      'click .js-delete-checklist': this.deleteChecklist,
      keydown: this.pressKey,
    }];
  },
}).register('checklists');

BlazeComponent.extendComponent({
  toggleItem() {
    const checklist = this.currentData().checklist;
    const item = this.currentData().item;
    if (checklist && item && item._id) {
      checklist.toggleItem(item._id);
    }
  },
  events() {
    return [{
      'click .item .check-box': this.toggleItem,
    }];
  },
}).register('itemDetail');

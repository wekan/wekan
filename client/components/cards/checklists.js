function initSorting(items) {
  items.sortable({
    tolerance: 'pointer',
    helper: 'clone',
    items: '.js-checklist-item:not(.placeholder)',
    axis: 'y',
    distance: 7,
    placeholder: 'placeholder',
    scroll: false,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      EscapeActions.executeUpTo('popup-close');
    },
    stop(evt, ui) {
      const parent = ui.item.parents('.js-checklist-items');
      const orderedItems = [];
      parent.find('.js-checklist-item').each(function(i, item) {
        const checklistItem = Blaze.getData(item).item;
        orderedItems.push(checklistItem._id);
      });
      items.sortable('cancel');
      const formerParent = ui.item.parents('.js-checklist-items');
      let checklist = Blaze.getData(parent.get(0)).checklist;
      const oldChecklist = Blaze.getData(formerParent.get(0)).checklist;
      if (oldChecklist._id !== checklist._id) {
        const currentItem = Blaze.getData(ui.item.get(0)).item;
        for (let i = 0; i < orderedItems.length; i++) {
          let itemId = orderedItems[i];
          if (itemId !== currentItem._id) continue;
          checklist.addItem(currentItem.title);
          checklist = Checklists.findOne({_id: checklist._id});
          itemId = checklist._id + (checklist.newItemIndex - 1);
          if (currentItem.finished) {
            checklist.finishItem(itemId);
          }
          orderedItems[i] = itemId;
          oldChecklist.removeItem(currentItem._id);
        }
      }
      checklist.sortItems(orderedItems);
    },
  });
}

Template.checklists.onRendered(function () {
  const self = BlazeComponent.getComponentForElement(this.firstNode);
  self.itemsDom = this.$('.card-checklist-items');
  initSorting(self.itemsDom);
  self.itemsDom.mousedown(function(evt) {
    evt.stopPropagation();
  });

  function userIsMember() {
    return Meteor.user() && Meteor.user().isBoardMember();
  }

  // Disable sorting if the current user is not a board member
  self.autorun(() => {
    const $itemsDom = $(self.itemsDom);
    if ($itemsDom.data('sortable')) {
      $(self.itemsDom).sortable('option', 'disabled', !userIsMember());
    }
  });
});

BlazeComponent.extendComponent({

  addChecklist(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const title = textarea.value.trim();
    const cardId = this.currentData().cardId;
    const card = Cards.findOne(cardId);

    if (title) {
      Checklists.insert({
        cardId,
        title,
        sort: card.checklists().count(),
      });
      setTimeout(() => {
        this.$('.add-checklist-item').last().click();
      }, 100);
    }
    textarea.value = '';
    textarea.focus();
  },

  addChecklistItem(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const title = textarea.value.trim();
    const checklist = this.currentData().checklist;

    if (title) {
      checklist.addItem(title);
    }
    // We keep the form opened, empty it.
    textarea.value = '';
    textarea.focus();
  },

  canModifyCard() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },

  deleteChecklist() {
    const checklist = this.currentData().checklist;
    if (checklist && checklist._id) {
      Checklists.remove(checklist._id);
      this.toggleDeleteDialog.set(false);
    }
  },

  deleteDialog() {
    return this.toggleDeleteDialog.get();
  },

  deleteItem() {
    const checklist = this.currentData().checklist;
    const item = this.currentData().item;
    if (checklist && item && item._id) {
      checklist.removeItem(item._id);
    }
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

  onCreated() {
    this.toggleDeleteDialog = new ReactiveVar(false);
    this.checklistToDelete = null; //Store data context to pass to checklistDeleteDialog template
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
    const events = {
      'click .toggle-delete-checklist-dialog'(event) {
        if($(event.target).hasClass('js-delete-checklist')){
          this.checklistToDelete = this.currentData().checklist; //Store data context
        }
        this.toggleDeleteDialog.set(!this.toggleDeleteDialog.get());
      },
    };

    return [{
      ...events,
      'submit .js-add-checklist': this.addChecklist,
      'submit .js-edit-checklist-title': this.editChecklist,
      'submit .js-add-checklist-item': this.addChecklistItem,
      'submit .js-edit-checklist-item': this.editChecklistItem,
      'click .js-delete-checklist-item': this.deleteItem,
      'click .confirm-checklist-delete': this.deleteChecklist,
      keydown: this.pressKey,
    }];
  },
}).register('checklists');

Template.checklistDeleteDialog.onCreated(() => {
  const $cardDetails = this.$('.card-details');
  this.scrollState = { position: $cardDetails.scrollTop(), //save current scroll position
                       top: false //required for smooth scroll animation
                     };
  //Callback's purpose is to only prevent scrolling after animation is complete
  $cardDetails.animate({ scrollTop: 0 }, 500, () => { this.scrollState.top = true; });

  //Prevent scrolling while dialog is open
  $cardDetails.on('scroll', () => {
    if(this.scrollState.top) { //If it's already in position, keep it there. Otherwise let animation scroll
      $cardDetails.scrollTop(0);
    }
  });
});

Template.checklistDeleteDialog.onDestroyed(() => {
  const $cardDetails = this.$('.card-details');
  $cardDetails.off('scroll'); //Reactivate scrolling
  $cardDetails.animate( { scrollTop: this.scrollState.position });
});

BlazeComponent.extendComponent({
  events() {
    const handlers = {
      'click .confirm-checklist-delete'() {
        console.log(this.scrollState)
      },
    }

    return [ handlers ];
  }
}).register('checklistDeleteDialog');
Template.itemDetail.helpers({
  canModifyCard() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },
});

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

import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import Boards from '/models/boards';
import { DialogWithBoardSwimlaneListCard } from '/client/lib/dialogWithBoardSwimlaneListCard';

const subManager = new SubsManager();
const { calculateIndexData, capitalize } = Utils;

function initSorting(items) {
  items.sortable({
    tolerance: 'pointer',
    helper: 'clone',
    items: '.js-checklist-item:not(.placeholder)',
    connectWith: '.js-checklist-items',
    appendTo: 'parent',
    distance: 7,
    placeholder: 'checklist-item placeholder',
    scroll: true,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      EscapeActions.clickExecute(evt.target, 'inlinedForm');
    },
    stop(evt, ui) {
      const parent = ui.item.parents('.js-checklist-items');
      const checklistId = Blaze.getData(parent.get(0)).checklist._id;
      let prevItem = ui.item.prev('.js-checklist-item').get(0);
      if (prevItem) {
        prevItem = Blaze.getData(prevItem).item;
      }
      let nextItem = ui.item.next('.js-checklist-item').get(0);
      if (nextItem) {
        nextItem = Blaze.getData(nextItem).item;
      }
      const nItems = 1;
      const sortIndex = calculateIndexData(prevItem, nextItem, nItems);
      const checklistDomElement = ui.item.get(0);
      const checklistData = Blaze.getData(checklistDomElement);
      const checklistItem = checklistData.item;

      items.sortable('cancel');

      checklistItem.move(checklistId, sortIndex.base);
    },
  });
}

BlazeComponent.extendComponent({
  onRendered() {
    const self = this;
    self.itemsDom = this.$('.js-checklist-items');
    initSorting(self.itemsDom);
    self.itemsDom.mousedown(function (evt) {
      evt.stopPropagation();
    });

    function userIsMember() {
      return ReactiveCache.getCurrentUser()?.isBoardMember();
    }

    // Disable sorting if the current user is not a board member
    self.autorun(() => {
      const $itemsDom = $(self.itemsDom);
      if ($itemsDom.data('uiSortable') || $itemsDom.data('sortable')) {
        $(self.itemsDom).sortable('option', 'disabled', !userIsMember());
        if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
          $(self.itemsDom).sortable({
            handle: 'span.fa.checklistitem-handle',
          });
        }
      }
    });
  },

  /** returns the finished percent of the checklist */
  finishedPercent() {
    const ret = this.data().checklist.finishedPercent();
    return ret;
  },
}).register('checklistDetail');

BlazeComponent.extendComponent({
  addChecklist(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const title = textarea.value.trim();
    let cardId = this.currentData().cardId;
    const card = ReactiveCache.getCard(cardId);
    //if (card.isLinked()) cardId = card.linkedId;
    if (card.isLinkedCard()) {
      cardId = card.linkedId;
    }

    let sortIndex;
    let checklistItemIndex;
    if (this.currentData().position === 'top') {
      sortIndex = Utils.calculateIndexData(null, card.firstChecklist()).base;
      checklistItemIndex = 0;
    } else {
      sortIndex = Utils.calculateIndexData(card.lastChecklist(), null).base;
      checklistItemIndex = -1;
    }

    if (title) {
      Checklists.insert({
        cardId,
        title,
        sort: sortIndex,
      });
      this.closeAllInlinedForms();
      setTimeout(() => {
        this.$('.add-checklist-item')
          .eq(checklistItemIndex)
          .click();
      }, 100);
    }
  },
  addChecklistItem(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const newlineBecomesNewChecklistItem = this.find('input#toggleNewlineBecomesNewChecklistItem');
    const newlineBecomesNewChecklistItemOriginOrder = this.find('input#toggleNewlineBecomesNewChecklistItemOriginOrder');
    const title = textarea.value.trim();
    const checklist = this.currentData().checklist;

    if (title) {
      let checklistItems = [title];
      if (newlineBecomesNewChecklistItem.checked) {
        checklistItems = title.split('\n').map(_value => _value.trim());
        if (this.currentData().position === 'top') {
          if (newlineBecomesNewChecklistItemOriginOrder.checked === false) {
            checklistItems = checklistItems.reverse();
          }
        }
      }
      let addIndex;
      let sortIndex;
      if (this.currentData().position === 'top') {
        sortIndex = Utils.calculateIndexData(null, checklist.firstItem()).base;
        addIndex = -1;
      } else {
        sortIndex = Utils.calculateIndexData(checklist.lastItem(), null).base;
        addIndex = 1;
      }
      for (let checklistItem of checklistItems) {
        ChecklistItems.insert({
          title: checklistItem,
          checklistId: checklist._id,
          cardId: checklist.cardId,
          sort: sortIndex,
        });
        sortIndex += addIndex;
      }
    }
    // We keep the form opened, empty it.
    textarea.value = '';
    textarea.focus();
  },

  deleteItem() {
    const checklist = this.currentData().checklist;
    const item = this.currentData().item;
    if (checklist && item && item._id) {
      ChecklistItems.remove(item._id);
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
    const item = this.currentData().item;
    item.setTitle(title);
  },

  pressKey(event) {
    //If user press enter key inside a form, submit it
    //Unless the user is also holding down the 'shift' key
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      const $form = $(event.currentTarget).closest('form');
      $form.find('button[type=submit]').click();
    }
  },

  focusChecklistItem(event) {
    // If a new checklist is created, pre-fill the title and select it.
    const checklist = this.currentData().checklist;
    if (!checklist) {
      const textarea = event.target;
      textarea.value = capitalize(TAPi18n.__('r-checklist'));
      textarea.select();
    }
  },

  /** closes all inlined forms (checklist and checklist-item input fields) */
  closeAllInlinedForms() {
    this.$('.js-close-inlined-form').click();
  },

  events() {
    return [
      {
        'click .js-open-checklist-details-menu': Popup.open('checklistActions'),
        'submit .js-add-checklist': this.addChecklist,
        'submit .js-edit-checklist-title': this.editChecklist,
        'submit .js-add-checklist-item': this.addChecklistItem,
        'submit .js-edit-checklist-item': this.editChecklistItem,
        'click .js-convert-checklist-item-to-card': Popup.open('convertChecklistItemToCard'),
        'click .js-delete-checklist-item': this.deleteItem,
        'focus .js-add-checklist-item': this.focusChecklistItem,
        // add and delete checklist / checklist-item
        'click .js-open-inlined-form': this.closeAllInlinedForms,
        'click #toggleHideFinishedChecklist'(event) {
          event.preventDefault();
          this.data().card.toggleHideFinishedChecklist();
        },
        keydown: this.pressKey,
      },
    ];
  },
}).register('checklists');

BlazeComponent.extendComponent({
  onCreated() {
    subManager.subscribe('board', Session.get('currentBoard'), false);
    this.selectedBoardId = new ReactiveVar(Session.get('currentBoard'));
  },

  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  swimlanes() {
    const board = ReactiveCache.getBoard(this.selectedBoardId.get());
    return board.swimlanes();
  },

  aBoardLists() {
    const board = ReactiveCache.getBoard(this.selectedBoardId.get());
    return board.lists();
  },

  events() {
    return [
      {
        'change .js-select-boards'(event) {
          this.selectedBoardId.set($(event.currentTarget).val());
          subManager.subscribe('board', this.selectedBoardId.get(), false);
        },
      },
    ];
  },
}).register('boardsSwimlanesAndLists');

Template.checklists.helpers({
  checklists() {
    const card = ReactiveCache.getCard(this.cardId);
    const ret = card.checklists();
    return ret;
  },
});

BlazeComponent.extendComponent({
  onRendered() {
    autosize(this.$('textarea.js-add-checklist-item'));
  },
  events() {
    return [
      {
        'click a.fa.fa-copy'(event) {
          const $editor = this.$('textarea');
          const promise = Utils.copyTextToClipboard($editor[0].value);

          const $tooltip = this.$('.copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
      }
    ];
  }
}).register('addChecklistItemForm');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-delete-checklist': Popup.afterConfirm('checklistDelete', function () {
          Popup.back(2);
          const checklist = this.checklist;
          if (checklist && checklist._id) {
            Checklists.remove(checklist._id);
          }
        }),
        'click .js-move-checklist': Popup.open('moveChecklist'),
        'click .js-copy-checklist': Popup.open('copyChecklist'),
        'click .js-hide-checked-checklist-items'(event) {
          event.preventDefault();
          this.data().checklist.toggleHideCheckedChecklistItems();
          Popup.back();
        },
        'click .js-hide-all-checklist-items'(event) {
          event.preventDefault();
          this.data().checklist.toggleHideAllChecklistItems();
          Popup.back();
        },
      }
    ]
  }
}).register('checklistActionsPopup');

BlazeComponent.extendComponent({
  onRendered() {
    autosize(this.$('textarea.js-edit-checklist-item'));
  },
  events() {
    return [
      {
        'click a.fa.fa-copy'(event) {
          const $editor = this.$('textarea');
          const promise = Utils.copyTextToClipboard($editor[0].value);

          const $tooltip = this.$('.copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
      }
    ];
  }
}).register('editChecklistItemForm');

Template.checklistItemDetail.helpers({
});

BlazeComponent.extendComponent({
  toggleItem() {
    const checklist = this.currentData().checklist;
    const item = this.currentData().item;
    if (checklist && item && item._id) {
      item.toggleItem();
    }
  },
  events() {
    return [
      {
        'click .js-checklist-item .check-box-container': this.toggleItem,
      },
    ];
  },
}).register('checklistItemDetail');

/** Move Checklist Dialog */
(class extends DialogWithBoardSwimlaneListCard {
  getDialogOptions() {
    const ret = ReactiveCache.getCurrentUser().getMoveChecklistDialogOptions();
    return ret;
  }
  setDone(cardId, options) {
    ReactiveCache.getCurrentUser().setMoveChecklistDialogOption(this.currentBoardId, options);
    this.data().checklist.move(cardId);
  }
}).register('moveChecklistPopup');

/** Copy Checklist Dialog */
(class extends DialogWithBoardSwimlaneListCard {
  getDialogOptions() {
    const ret = ReactiveCache.getCurrentUser().getCopyChecklistDialogOptions();
    return ret;
  }
  setDone(cardId, options) {
    ReactiveCache.getCurrentUser().setCopyChecklistDialogOption(this.currentBoardId, options);
    this.data().checklist.copy(cardId);
  }
}).register('copyChecklistPopup');

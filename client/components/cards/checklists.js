import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Cards from '/models/cards';
import Boards from '/models/boards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import { BoardSwimlaneListCardDialog } from '/client/lib/dialogWithBoardSwimlaneListCard';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import autosize from 'autosize';

// SubsManager removed for Meteor 3 migration
const { calculateIndexData } = Utils;

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

Template.checklistDetail.onRendered(function () {
  const tpl = this;
  tpl.itemsDom = this.$('.js-checklist-items');
  initSorting(tpl.itemsDom);
  tpl.itemsDom.mousedown(function (evt) {
    evt.stopPropagation();
  });

  function userIsMember() {
    return ReactiveCache.getCurrentUser()?.isBoardMember();
  }

  // Disable sorting if the current user is not a board member
  tpl.autorun(() => {
    const $itemsDom = $(tpl.itemsDom);
    if ($itemsDom.data('uiSortable') || $itemsDom.data('sortable')) {
      $(tpl.itemsDom).sortable('option', 'disabled', !userIsMember());
      if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
        $(tpl.itemsDom).sortable({
          handle: 'span.fa.checklistitem-handle',
        });
      }
    }
  });
});

Template.checklistDetail.helpers({
  /** returns the finished percent of the checklist */
  finishedPercent() {
    const ret = this.checklist.finishedPercent();
    return ret;
  },
});

Template.checklists.helpers({
  checklists() {
    const card = ReactiveCache.getCard(this.cardId);
    if (!card || typeof card.checklists !== 'function') {
      return [];
    }
    const ret = card.checklists();
    return ret;
  },
});

Template.checklists.events({
  'click .js-open-checklist-details-menu': Popup.open('checklistActions'),
  'submit .js-add-checklist'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-add-checklist-item');
    const title = textarea.value.trim();
    let cardId = Template.currentData().cardId;
    const card = ReactiveCache.getCard(cardId);
    if (card.isLinkedCard()) {
      cardId = card.linkedId;
    }

    let sortIndex;
    let checklistItemIndex;
    if (Template.currentData().position === 'top') {
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
      tpl.$('.js-close-inlined-form').click();
      setTimeout(() => {
        tpl.$('.add-checklist-item')
          .eq(checklistItemIndex)
          .click();
      }, 100);
    }
  },
  'submit .js-edit-checklist-title'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-edit-checklist-item');
    const title = textarea.value.trim();
    const checklist = Template.currentData().checklist;
    checklist.setTitle(title);
  },
  'submit .js-add-checklist-item'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-add-checklist-item');
    if (!textarea) {
      return;
    }
    const newlineBecomesNewChecklistItem = tpl.find('input#toggleNewlineBecomesNewChecklistItem');
    const newlineBecomesNewChecklistItemOriginOrder = tpl.find('input#toggleNewlineBecomesNewChecklistItemOriginOrder');
    const title = textarea.value.trim();
    const currentData = Template.currentData() || {};
    let resolvedData = currentData;
    let checklist = currentData.checklist;
    if (!checklist) {
      const form = event.currentTarget?.closest
        ? event.currentTarget.closest('form')
        : $(event.target).closest('form').get(0);
      const formData = form ? Blaze.getData(form) : null;
      if (formData) {
        resolvedData = formData;
      }
      checklist = formData?.checklist;
    }
    if (!checklist) {
      return;
    }

    if (title) {
      let checklistItems = [title];
      if (newlineBecomesNewChecklistItem?.checked) {
        checklistItems = title.split('\n').map(_value => _value.trim());
        if (resolvedData.position === 'top') {
          if (newlineBecomesNewChecklistItemOriginOrder?.checked === false) {
            checklistItems = checklistItems.reverse();
          }
        }
      }
      let addIndex;
      let sortIndex;
      if (resolvedData.position === 'top') {
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
  'submit .js-edit-checklist-item'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-edit-checklist-item');
    const title = textarea.value.trim();
    const formData = Blaze.getData(event.currentTarget) || Blaze.getData(event.target);
    const item = formData?.item;
    if (item) {
      item.setTitle(title);
    }
  },
  'click .js-convert-checklist-item-to-card': Popup.open('convertChecklistItemToCard'),
  'click .js-delete-checklist-item': Popup.afterConfirm('checklistItemDelete', function () {
    Popup.back();
    const item = this?.item || this;
    if (item && item._id) {
      ChecklistItems.remove(item._id);
    }
  }),
  // add and delete checklist / checklist-item
  'click .js-open-inlined-form'(event, tpl) {
    tpl.$('.js-close-inlined-form').click();
  },
  'click #toggleHideFinishedChecklist'(event) {
    event.preventDefault();
    Template.currentData().card.toggleHideFinishedChecklist();
  },
  'keydown textarea.js-add-checklist-item'(event) {
    //If user press enter key inside a form, submit it
    //Unless the user is also holding down the 'shift' key
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      const $form = $(event.currentTarget).closest('form');
      $form.find('button[type=submit]').click();
    }
  },
});

// NOTE: boardsSwimlanesAndLists template was removed from jade but JS was left behind.
// This is dead code — the template no longer exists in any jade file.

Template.addChecklistItemForm.onRendered(function () {
  autosize(this.$('textarea.js-add-checklist-item'));
});

Template.addChecklistItemForm.events({
  'click a.fa.fa-copy'(event, tpl) {
    const $editor = tpl.$('textarea');
    const promise = Utils.copyTextToClipboard($editor[0].value);

    const $tooltip = tpl.$('.copied-tooltip');
    Utils.showCopied(promise, $tooltip);
  },
});

Template.checklistActionsPopup.events({
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
    Template.currentData().checklist.toggleHideCheckedChecklistItems();
    Popup.back();
  },
  'click .js-hide-all-checklist-items'(event) {
    event.preventDefault();
    Template.currentData().checklist.toggleHideAllChecklistItems();
    Popup.back();
  },
});

Template.editChecklistItemForm.onRendered(function () {
  autosize(this.$('textarea.js-edit-checklist-item'));
});

Template.editChecklistItemForm.events({
  'click a.fa.fa-copy'(event, tpl) {
    const $editor = tpl.$('textarea');
    const promise = Utils.copyTextToClipboard($editor[0].value);

    const $tooltip = tpl.$('.copied-tooltip');
    Utils.showCopied(promise, $tooltip);
  },
});

Template.checklistItemDetail.helpers({
});

Template.checklistItemDetail.events({
  'click .js-checklist-item .check-box-container'() {
    const checklist = Template.currentData().checklist;
    const item = Template.currentData().item;
    if (checklist && item && item._id) {
      item.toggleItem();
    }
  },
});

/**
 * Helper to find the dialog instance from a parent popup template.
 * copyAndMoveChecklist is included inside moveChecklistPopup / copyChecklistPopup,
 * so we traverse up the view hierarchy to find the parent template's dialog.
 */
function getParentDialog(tpl) {
  let view = tpl.view.parentView;
  while (view) {
    if (view.templateInstance && view.templateInstance() && view.templateInstance().dialog) {
      return view.templateInstance().dialog;
    }
    view = view.parentView;
  }
  return null;
}

/** Shared helpers for copyAndMoveChecklist sub-template */
Template.copyAndMoveChecklist.helpers({
  boards() {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.boards() : [];
  },
  swimlanes() {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.swimlanes() : [];
  },
  lists() {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.lists() : [];
  },
  cards() {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.cards() : [];
  },
  isDialogOptionBoardId(boardId) {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.isDialogOptionBoardId(boardId) : false;
  },
  isDialogOptionSwimlaneId(swimlaneId) {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.isDialogOptionSwimlaneId(swimlaneId) : false;
  },
  isDialogOptionListId(listId) {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.isDialogOptionListId(listId) : false;
  },
  isDialogOptionCardId(cardId) {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.isDialogOptionCardId(cardId) : false;
  },
  isTitleDefault(title) {
    const dialog = getParentDialog(Template.instance());
    return dialog ? dialog.isTitleDefault(title) : title;
  },
});

/**
 * Helper: register standard card dialog events on a checklist popup template.
 * Events bubble up from the copyAndMoveChecklist sub-template to the parent popup.
 */
function registerChecklistDialogEvents(templateName) {
  Template[templateName].events({
    async 'click .js-done'(event, tpl) {
      const dialog = tpl.dialog;
      const boardSelect = tpl.$('.js-select-boards')[0];
      const boardId = boardSelect.options[boardSelect.selectedIndex].value;

      const listSelect = tpl.$('.js-select-lists')[0];
      const listId = listSelect.options[listSelect.selectedIndex].value;

      const swimlaneSelect = tpl.$('.js-select-swimlanes')[0];
      const swimlaneId = swimlaneSelect.options[swimlaneSelect.selectedIndex].value;

      const cardSelect = tpl.$('.js-select-cards')[0];
      const cardId = cardSelect.options.length > 0
        ? cardSelect.options[cardSelect.selectedIndex].value
        : null;

      const options = { boardId, swimlaneId, listId, cardId };
      try {
        await dialog.setDone(cardId, options);
      } catch (e) {
        console.error('Error in card dialog operation:', e);
      }
      Popup.back(2);
    },
    'change .js-select-boards'(event, tpl) {
      tpl.dialog.getBoardData($(event.currentTarget).val());
    },
    'change .js-select-swimlanes'(event, tpl) {
      tpl.dialog.selectedSwimlaneId.set($(event.currentTarget).val());
      tpl.dialog.setFirstListId();
    },
    'change .js-select-lists'(event, tpl) {
      tpl.dialog.selectedListId.set($(event.currentTarget).val());
      tpl.dialog.selectedCardId.set('');
    },
    'change .js-select-cards'(event, tpl) {
      tpl.dialog.selectedCardId.set($(event.currentTarget).val());
    },
  });
}

/** Move Checklist Dialog */
Template.moveChecklistPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListCardDialog(this, {
    getDialogOptions() {
      return ReactiveCache.getCurrentUser().getMoveChecklistDialogOptions();
    },
    async setDone(cardId, options) {
      ReactiveCache.getCurrentUser().setMoveChecklistDialogOption(this.currentBoardId, options);
      await Template.currentData().checklist.move(cardId);
    },
  });
});
registerChecklistDialogEvents('moveChecklistPopup');

/** Copy Checklist Dialog */
Template.copyChecklistPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListCardDialog(this, {
    getDialogOptions() {
      return ReactiveCache.getCurrentUser().getCopyChecklistDialogOptions();
    },
    async setDone(cardId, options) {
      ReactiveCache.getCurrentUser().setCopyChecklistDialogOption(this.currentBoardId, options);
      await Template.currentData().checklist.copy(cardId);
    },
  });
});
registerChecklistDialogEvents('copyChecklistPopup');

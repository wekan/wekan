import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { formatDateTime } from '/imports/lib/dateUtils';
import Cards from '/models/cards';
import Boards from '/models/boards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import { BoardSwimlaneListCardDialog } from '/client/lib/dialogWithBoardSwimlaneListCard';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import autosize from 'autosize';
import { isChecklistShownAtMinicard } from '/models/lib/minicardChecklistVisibility';

// SubsManager removed for Meteor 3 migration
const { calculateIndexData } = Utils;

function dateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function checklistWorkAssignees(item) {
  const card = item && ReactiveCache.getCard(item.cardId);
  const board = card && ReactiveCache.getBoard(card.boardId);
  if (!board) return [];
  return (board.members || [])
    .filter(member => member.isActive === true)
    .map(member => {
      const user = ReactiveCache.getUser(member.userId);
      const name = user && typeof user.getName === 'function'
        ? user.getName()
        : (user && (user.username || user.profile?.fullname)) || member.userId;
      return {
        _id: member.userId,
        name,
        selected: item.assigneeId === member.userId,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

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
  /** #1591: is this checklist folded for THIS user?
   *
   * Per-user, keyed by card and checklist, exactly like collapsed lists and
   * swimlanes - not the checklist's own hideAllChecklistItems, which is a field
   * on the checklist and so changes what everyone on the board sees. `null` from
   * the getter means "never set", which is what makes the default (expanded)
   * distinguishable from somebody having deliberately expanded it. */
  checklistCollapsed() {
    const checklist = this.checklist;
    if (!checklist || !checklist._id) return false;
    const user = ReactiveCache.getCurrentUser();
    if (!user) return false;
    const cardId = (this.card && this.card._id) || checklist.cardId;
    const stored = user.getCollapsedCardSection(
      cardId, user.checklistSectionKey(checklist._id));
    return stored === true;
  },
});

Template.checklistDetail.events({
  'click .js-collapse-checklist'(event) {
    // The caret sits inside the title, which opens the inline rename form when
    // clicked - so this must not reach it.
    event.preventDefault();
    event.stopPropagation();
    const checklist = this.checklist;
    const user = ReactiveCache.getCurrentUser();
    if (!checklist || !checklist._id || !user) return;
    const cardId = (this.card && this.card._id) || checklist.cardId;
    const key = user.checklistSectionKey(checklist._id);
    const collapsed = user.getCollapsedCardSection(cardId, key) === true;
    user.setCollapsedCardSection(cardId, key, !collapsed);
  },
  'keydown .js-collapse-checklist'(event) {
    // It is a link acting as a button, so it has to answer the keys a button
    // answers or it is unreachable without a mouse.
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).trigger('click');
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
    const formData = Blaze.getData(event.currentTarget) || Blaze.getData(event.target);
    const checklist = formData?.checklist;
    if (checklist) {
      checklist.setTitle(title);
    }
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
  async 'submit .js-edit-checklist-item'(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const textarea = form.querySelector('textarea.js-edit-checklist-item');
    const title = textarea.value.trim();
    const formData = Blaze.getData(form) || Blaze.getData(event.target);
    const item = formData?.item;
    if (item) {
      await item.setTitle(title);
      const assignee = form.querySelector('.js-checklist-work-assignee');
      const due = form.querySelector('.js-checklist-work-due');
      const reminder = form.querySelector('.js-checklist-work-reminder');
      await Meteor.callAsync('checklistItems.setWorkMetadata', item._id, {
        assigneeId: assignee && assignee.value ? assignee.value : null,
        dueAt: due && due.value ? new Date(due.value) : null,
        remindAt: reminder && reminder.value ? new Date(reminder.value) : null,
      });
    }
  },
  'click .js-convert-checklist-item-to-card': Popup.open('convertChecklistItemToCard'),
  'click .js-delete-checklist-item': Popup.afterConfirm('checklistItemDelete', function () {
    Popup.back();
    const item = this?.item || this;
    // #3252: guard against removing a doc already evicted from Minimongo (heavy
    // archive/delete churn), which throws "Removed nonexistent document".
    if (item && item._id && ChecklistItems.findOne(item._id)) {
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

// The board default this checklist's own setting overrides. Read here rather than
// in the model helper, because the model runs on the server too, where looking a
// board up is asynchronous - and a Blaze helper has to answer now.
function boardAllowsChecklistsOnMinicard(checklist) {
  if (!checklist) return false;
  const board = ReactiveCache.getBoard(checklist.boardId);
  return !!(board && board.allowsChecklistsOnMinicard);
}

Template.checklistActionsPopup.helpers({
  // What the "Show on minicard" switch draws: whether the checklist is on the
  // minicard right now, board default included.
  shownAtMinicard() {
    const checklist = this.checklist;
    return isChecklistShownAtMinicard(checklist, boardAllowsChecklistsOnMinicard(checklist));
  },
});

Template.checklistActionsPopup.events({
  'click .js-delete-checklist': Popup.afterConfirm('checklistDelete', function () {
    Popup.back(2);
    const checklist = this.checklist;
    // #3252: see js-delete-checklist-item — avoid "Removed nonexistent document".
    if (checklist && checklist._id && Checklists.findOne(checklist._id)) {
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
  'click .js-show-checklist-at-minicard'(event) {
    event.preventDefault();
    const checklist = Template.currentData().checklist;
    // The board's setting is the default this one overrides, so the toggle has to
    // flip what is ON SCREEN, not the raw field. Flipping the field is what made
    // the first click do nothing while the board default was on (false -> true,
    // still shown) - reported by email.
    checklist.toggleShowChecklistAtMinicard(boardAllowsChecklistsOnMinicard(checklist));
    Popup.back();
  },
});

Template.editChecklistItemForm.onRendered(function () {
  autosize(this.$('textarea.js-edit-checklist-item'));
});

Template.editChecklistItemForm.helpers({
  checklistWorkAssignees() {
    return checklistWorkAssignees(this.item);
  },
  checklistWorkDueValue() {
    return dateTimeLocalValue(this.item && this.item.dueAt);
  },
  checklistWorkReminderValue() {
    return dateTimeLocalValue(this.item && this.item.remindAt);
  },
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
  checklistWorkAssigneeName() {
    const item = this.item;
    if (!item || !item.assigneeId) return '';
    const user = ReactiveCache.getUser(item.assigneeId);
    if (!user) return item.assigneeId;
    return typeof user.getName === 'function'
      ? user.getName()
      : user.username || user.profile?.fullname || item.assigneeId;
  },
  checklistWorkDueLabel() {
    return this.item && this.item.dueAt ? formatDateTime(this.item.dueAt) : '';
  },
  checklistWorkReminderLabel() {
    return this.item && this.item.remindAt ? formatDateTime(this.item.remindAt) : '';
  },
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

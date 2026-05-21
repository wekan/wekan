import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { CustomFieldStringTemplate } from '/client/lib/customFields';
import { handleFileUpload } from './attachments';
import uploadProgressManager from '../../lib/uploadProgressManager';
import { Utils } from '/client/lib/utils';
import ChecklistItems from '/models/checklistItems';

function getMinicardFlag(board, onMinicardField, legacyField, defaultValue) {
  if (!board) return false;
  if (board[onMinicardField] !== null && board[onMinicardField] !== undefined) {
    return board[onMinicardField];
  }
  if (legacyField && board[legacyField] !== null && board[legacyField] !== undefined) {
    return board[legacyField];
  }
  return defaultValue;
}

// Template.cards.events({
//   'click .member': Popup.open('cardMember')
// });

Template.minicard.helpers({
  formattedCurrencyCustomFieldValue(definition) {
    const customField = this
      .customFieldsWD()
      .find(f => f._id === definition._id);
    const customFieldTrueValue =
      customField && customField.trueValue ? customField.trueValue : '';

    const locale = TAPi18n.getLanguage();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: definition.settings.currencyCode,
    }).format(customFieldTrueValue);
  },

  formattedStringtemplateCustomFieldValue(definition) {
    const customField = this
      .customFieldsWD()
      .find(f => f._id === definition._id);

    const customFieldTrueValue =
      customField && customField.trueValue ? customField.trueValue : [];

    const ret = new CustomFieldStringTemplate(definition).getFormattedValue(customFieldTrueValue);
    return ret;
  },

  showCreatorOnMinicard() {
    // cache "board" to reduce the mini-mongodb access
    const board = this.board();
    let ret = false;
    if (board) {
      ret = board.allowsCreatorOnMinicard ?? false;
    }
    return ret;
  },
  isWatching() {
    return this.findWatcher(Meteor.userId());
  },

  showMembers() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsMembersOnMinicard', 'allowsMembers', true);
  },

  showAssignee() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsAssigneeOnMinicard', 'allowsAssignee', true);
  },
  showReceived() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsReceivedDateOnMinicard', 'allowsReceivedDate', true);
  },
  showStart() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsStartDateOnMinicard', 'allowsStartDate', true);
  },
  showDue() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsDueDateOnMinicard', 'allowsDueDate', true);
  },
  showEnd() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsEndDateOnMinicard', 'allowsEndDate', true);
  },
  showLabels() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsLabelsOnMinicard', 'allowsLabels', true);
  },
  showCardNumber() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsCardNumberOnMinicard', 'allowsCardNumber', false);
  },
  showSubtasks() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsSubtasksOnMinicard', 'allowsSubtasks', true);
  },

  hiddenMinicardLabelText() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return (currentUser.profile || {}).hiddenMinicardLabelText;
    } else if (window.localStorage.getItem('hiddenMinicardLabelText')) {
      return true;
    } else {
      return false;
    }
  },
  cover() {
    if (!this.coverId) return null;
    const attachment = ReactiveCache.getAttachment(this.coverId);
    if (!attachment) return null;
    const coverId = this.coverId;
    return {
      link() {
        return `/cdn/storage/attachments/${coverId}`;
      },
    };
  },
  // XXX resolve this nasty hack for https://github.com/veliovgroup/Meteor-Files/issues/763
  sess() {
    return Meteor.connection && Meteor.connection._lastSessionId
      ? Meteor.connection._lastSessionId
      : null;
  },
  // Upload progress helpers
  hasActiveUploads() {
    return uploadProgressManager.hasActiveUploads(this._id);
  },
  uploads() {
    return uploadProgressManager.getUploadsForCard(this._id);
  },
  uploadCount() {
    return uploadProgressManager.getUploadCountForCard(this._id);
  },
  listName() {
    const list = this.list();
    return list ? list.title : '';
  },

  shouldShowListOnMinicard() {
    // Show list name if either:
    // 1. Board-wide setting is enabled, OR
    // 2. This specific card has the setting enabled
    const currentBoard = this.board();
    if (!currentBoard) return false;
    return currentBoard.allowsShowListsOnMinicard || this.showListOnMinicard;
  },

  shouldShowChecklistAtMinicard() {
    // Return checklists that should be shown on minicard
    const currentBoard = this.board();
    if (!currentBoard) return [];

    const checklists = this.checklists();
    const visibleChecklists = [];

    checklists.forEach(checklist => {
      // Show checklist if either:
      // 1. Board-wide setting is enabled, OR
      // 2. This specific checklist has the setting enabled
      if (currentBoard.allowsChecklistAtMinicard || checklist.showChecklistAtMinicard) {
        visibleChecklists.push(checklist);
      }
    });

    return visibleChecklists;
  }
});

Template.minicard.events({
  'click .js-linked-link'() {
    if (this.isLinkedCard()) Utils.goCardId(this.linkedId);
    else if (this.isLinkedBoard())
      Utils.goBoardId(this.linkedId);
  },
  'click .js-toggle-minicard-label-text'() {
    if (window.localStorage.getItem('hiddenMinicardLabelText')) {
      window.localStorage.removeItem('hiddenMinicardLabelText'); //true
    } else {
      window.localStorage.setItem('hiddenMinicardLabelText', 'true'); //true
    }
  },
  'click span.badge-icon.fa.fa-sort, click span.badge-text.check-list-sort' : Popup.open("editCardSortOrder"),
  'click .minicard-labels'(event, tpl) {
    if (tpl.find('.js-card-label:hover')) {
      Popup.open("cardLabels")(event, {dataContextIfCurrentDataIsUndefined: Template.currentData()});
    }
  },
  'click .js-open-minicard-details-menu'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    const card = Template.currentData();
    Popup.open('cardDetailsActions').call({currentData: () => card}, event);
  },
  // Drag and drop file upload handlers
  'dragover .minicard'(event) {
    // Only prevent default for file drags to avoid interfering with sortable
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
    }
  },
  'dragenter .minicard'(event) {
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      const card = this;
      const board = card.board();
      // Only allow drag-and-drop if user can modify card and board allows attachments
      if (Utils.canModifyCard() && board && board.allowsAttachments) {
        $(event.currentTarget).addClass('is-dragging-over');
      }
    }
  },
  'dragleave .minicard'(event) {
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('is-dragging-over');
    }
  },
  'drop .minicard'(event) {
    const dataTransfer = event.originalEvent.dataTransfer;
    if (dataTransfer && dataTransfer.types && dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      $(event.currentTarget).removeClass('is-dragging-over');

      const card = this;
      const board = card.board();

      // Check permissions
      if (!Utils.canModifyCard() || !board || !board.allowsAttachments) {
        return;
      }

      // Check if this is a file drop (not a card reorder)
      if (!dataTransfer.files || dataTransfer.files.length === 0) {
        return;
      }

      const files = dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload(card, files);
      }
    }
  },
});

Template.minicardChecklist.helpers({
  visibleItems() {
    const checklist = this.checklist || this;
    const items = checklist.items();

    return items.filter(item => {
      // Hide finished items if hideCheckedChecklistItems is true
      if (item.isFinished && checklist.hideCheckedChecklistItems) {
        return false;
      }
      // Hide all items if hideAllChecklistItems is true
      if (checklist.hideAllChecklistItems) {
        return false;
      }
      return true;
    });
  },
});

Template.minicardChecklist.events({
  'click .js-convert-checklist-item-to-card'(event) {
    event.stopPropagation();
    const formData = Blaze.getData(event.currentTarget);
    if (!formData) return;
    const context = { currentData: () => formData };
    Popup.open('convertChecklistItemToCard').call(context, event);
  },
  'click .js-open-checklist-menu'(event) {
    const data = Template.currentData();
    const checklist = data.checklist || data;
    const card = data.card || this;
    const context = { currentData: () => ({ checklist, card }) };
    Popup.open('checklistActions').call(context, event);
  },
  'click .js-checklist-item .check-box-container'(event) {
    event.stopPropagation();
    event.preventDefault();
    const data = Blaze.getData(event.target) || Blaze.getData(event.currentTarget);
    const item = data && data.item;
    if (item && item._id) {
      item.toggleItem();
    }
  },
  'click .js-submit-edit-checklist-item-form'(event) {
    event.preventDefault();
    event.stopPropagation();
    const $btn = $(event.currentTarget);
    const $form = $btn.closest('form');
    const textarea = $form.find('textarea.js-edit-checklist-item')[0];
    if (!textarea) return;
    const title = textarea.value.trim();
    if (!title) return;
    const formData = Blaze.getData($form[0]);
    if (formData && formData.item && formData.item._id) {
      formData.item.setTitle(title);
    } else if (formData && formData.checklist && formData.checklist._id) {
      formData.checklist.setTitle(title);
    }
    $form.find('.js-close-inlined-form').trigger('click');
  },
  'submit .js-add-checklist-item'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-add-checklist-item');
    if (!textarea) return;
    const title = textarea.value.trim();
    const data = Template.currentData() || {};
    const checklist = data.checklist;
    if (!checklist || !title) return;
    const items = checklist.items();
    const lastItem = items[items.length - 1] || null;
    const sortIndex = Utils.calculateIndexData(lastItem, null).base;
    ChecklistItems.insert({
      title,
      checklistId: checklist._id,
      cardId: checklist.cardId,
      sort: sortIndex,
    });
    textarea.value = '';
    textarea.focus();
  },
  'click .js-delete-checklist-item': Popup.afterConfirm('checklistItemDelete', function () {
    Popup.back();
    const item = this && this.item ? this.item : this;
    if (item && item._id) {
      ChecklistItems.remove(item._id);
    }
  }),
  'keydown textarea.js-add-checklist-item'(event) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      const $form = $(event.currentTarget).closest('form');
      $form.find('button[type=submit]').click();
    }
  },
});

Template.editCardSortOrderPopup.events({
  'keydown input.js-edit-card-sort-popup'(evt, tpl) {
    // enter = save
    if (evt.keyCode === 13) {
      tpl.find('button[type=submit]').click();
    }
  },
  'click button.js-submit-edit-card-sort-popup'(event, tpl) {
    // save button pressed
    event.preventDefault();
    const sort = tpl.$('.js-edit-card-sort-popup')[0]
      .value
      .trim();
    if (!Number.isNaN(sort)) {
      let card = this;
      card.move(card.boardId, card.swimlaneId, card.listId, sort);
      Popup.back();
    }
  },
});

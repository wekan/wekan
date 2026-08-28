import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { CustomFieldStringTemplate } from '/client/lib/customFields';
import { handleFileUpload } from './attachments';
import uploadProgressManager from '../../lib/uploadProgressManager';
import { Utils } from '/client/lib/utils';
import ChecklistItems from '/models/checklistItems';
import Cards from '/models/cards';
import { resolveCoverId } from '/models/lib/linkedCardCover';
import { isChecklistShownAtMinicard } from '/models/lib/minicardChecklistVisibility';
import {
  parseChecklistItemTitles,
  buildChecklistItemPayload,
} from '/models/lib/checklistItemTitles';
import { setCardMenuSource } from '/client/lib/cardMenuSource';
import {
  hiddenMinicardLabelText,
  toggleMinicardLabelText,
} from '/client/lib/minicardLabelText';

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
  showCustomFieldsOnMinicard() {
    const board = this.board();
    return board?.allowsCustomFieldsOnMinicard === true;
  },
  // True exactly when the drag handle is rendered (see minicard.jade): the user
  // may move the card AND drag handles are on. On a coarse pointer the handle is
  // a 48px strip down the leading edge, so the card's own content needs matching
  // padding - keyed off this so a card the user cannot move never gets a gutter
  // for a handle that is not there.
  showMinicardHandle() {
    return Utils.canMoveCard() && Utils.showDragHandles();
  },
  // #3392: show a drag-to-connect handle on the minicard when the board's
  // dependency overlay is on and the user can edit the board. Dragging it onto
  // another card creates a dependency (handled in dependencyOverlay.js).
  showDependencyConnectHandle() {
    const board = ReactiveCache.getBoard(this.boardId);
    return !!(board && board.showDependencies && Utils.canModifyBoard());
  },
  // #3392: PI Program Board "Red Strings". Show a small badge on the minicard
  // when a card has dependencies: the first dependency's icon and color plus the
  // total count.
  dependencyBadge() {
    const deps = this.getDependencies();
    if (deps.length === 0) return null;
    return {
      icon: deps[0].icon,
      color: deps[0].color,
      count: deps.length,
    };
  },
  // #3984: visual card aging — fade cards that have not been touched recently,
  // based on dateLastActivity, when the board has card aging enabled.
  agingClass() {
    const card = this.getRealCard();
    const board = ReactiveCache.getBoard(this.boardId);
    if (!board || !board.cardAging) return '';
    const last = card.dateLastActivity || card.modifiedAt || card.createdAt;
    if (!last) return '';
    const days = (Date.now() - new Date(last).getTime()) / 86400000;
    // #3984: thresholds are board-configurable (board settings / cardSettings API),
    // defaulting to 7 / 14 / 28 days.
    const d1 = board.cardAgingDays1 != null ? board.cardAgingDays1 : 7;
    const d2 = board.cardAgingDays2 != null ? board.cardAgingDays2 : 14;
    const d3 = board.cardAgingDays3 != null ? board.cardAgingDays3 : 28;
    if (days >= d3) return 'minicard-aging-3';
    if (days >= d2) return 'minicard-aging-2';
    if (days >= d1) return 'minicard-aging-1';
    return '';
  },
  formattedCurrencyCustomFieldValue(definition) {
    // This helper is called from `each customFieldsWD`, so `this` is already
    // the rendered custom-field row, not the Card. Calling this.customFieldsWD
    // threw and prevented minicards with Currency fields from rendering.
    const field = this || {};
    const fieldDefinition = definition || field.definition || {};
    const customFieldTrueValue = field.trueValue;
    if (customFieldTrueValue === '' || customFieldTrueValue == null) return '';
    const currencyCode = fieldDefinition.settings?.currencyCode || 'USD';
    const locale = TAPi18n.getLanguage();
    try {
      const number = typeof customFieldTrueValue === 'number'
        ? customFieldTrueValue
        : Number(customFieldTrueValue);
      if (!Number.isFinite(number)) return String(customFieldTrueValue);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
      }).format(number);
    } catch (error) {
      return `${currencyCode} ${customFieldTrueValue}`;
    }
  },

  formattedStringtemplateCustomFieldValue(definition) {
    // As above, the current row already carries the resolved linked/source
    // value and definition. Never reach back through a nonexistent Card API.
    const field = this || {};
    const fieldDefinition = definition || field.definition;
    const customFieldTrueValue = Array.isArray(field.trueValue)
      ? field.trueValue
      : [];
    if (!fieldDefinition) return customFieldTrueValue.join(' ');
    try {
      return new CustomFieldStringTemplate(fieldDefinition)
        .getFormattedValue(customFieldTrueValue);
    } catch (error) {
      return customFieldTrueValue.join(' ');
    }
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
    return this.getRealCard().findWatcher(Meteor.userId());
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
  // "Mark as complete" toggle on the minicard. No legacy fallback to the
  // card-details setting (allowsDueComplete): hidden by default so it only
  // appears when explicitly enabled in Card Settings > Show at Minicard.
  showDueComplete() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsDueCompleteOnMinicard', null, false);
  },
  showSubtasks() {
    const board = this.board();
    return getMinicardFlag(board, 'allowsSubtasksOnMinicard', 'allowsSubtasks', true);
  },
  // #6431: compact checklist item-count badge (finished/total) on the minicard.
  // Opt-in, OFF by default. Only a cheap boolean read here; the actual checklist
  // counting (checklistFinishedCount/checklistItemCount) is gated behind this in
  // the template, so a board with the badge off spends no resources counting.
  showChecklistCountBadge() {
    const board = this.board();
    return !!(board && board.allowsChecklistCountBadgeOnMinicard);
  },

  hiddenMinicardLabelText,
  stickers() {
    return this.getStickers();
  },
  cover() {
    // #5666: for a linked card the cover lives on the real card it points at, so
    // resolve the cover id through it (mirroring getTitle/getDue/...); a plain
    // card resolves to its own coverId.
    const coverId = resolveCoverId(this, id => ReactiveCache.getCard(id));
    if (!coverId) return null;
    const attachment = ReactiveCache.getAttachment(coverId);
    if (!attachment) return null;
    const coverLink = typeof attachment.link === 'function' ? attachment.link() : '';
    if (!coverLink) return null;
    return {
      link() {
        return coverLink;
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
    return uploadProgressManager.hasActiveUploads(this.getRealId());
  },
  uploads() {
    return uploadProgressManager.getUploadsForCard(this.getRealId());
  },
  uploadCount() {
    return uploadProgressManager.getUploadCountForCard(this.getRealId());
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
    return currentBoard.allowsShowListsOnMinicard || this.getRealCard().showListOnMinicard;
  },

  shouldShowChecklistAtMinicard() {
    // Return checklists that should be shown on minicard
    const currentBoard = this.board();
    if (!currentBoard) return [];

    const checklists = this.checklists();
    const visibleChecklists = [];

    checklists.forEach(checklist => {
      // The board setting is the DEFAULT and the checklist's own setting is an
      // OVERRIDE. This was an OR - board || checklist - and the board setting
      // (`allowsChecklistsOnMinicard`, #5565) defaults to TRUE, so unchecking
      // "Show on minicard" on a checklist could never hide it: reported by email
      // with a screenshot of a checklist still on the minicard after the toggle
      // was switched off. See models/lib/minicardChecklistVisibility.js.
      if (isChecklistShownAtMinicard(checklist, currentBoard.allowsChecklistsOnMinicard)) {
        visibleChecklists.push(checklist);
      }
    });

    return visibleChecklists;
  }
});

// #459: accessible reordering — keyboard/screen-reader users can move a card up
// or down within its list via sr-only buttons (no drag-and-drop required). The
// move swaps the card's sort value with its neighbour in the same list+swimlane.
function moveCardBy(card, delta) {
  const siblings = ReactiveCache.getCards(
    { listId: card.listId, swimlaneId: card.swimlaneId, archived: false },
    { sort: { sort: 1 } },
  );
  const idx = siblings.findIndex(c => c._id === card._id);
  const target = siblings[idx + delta];
  if (idx < 0 || !target) return;
  // Capture both sort values before either update; the docs are reactive and
  // card.sort would otherwise change after the first move.
  const cardSort = card.sort;
  const targetSort = target.sort;
  // Persist through the card model's move() mutation — the canonical client
  // path (e.g. editCardSortOrderPopup). A raw Cards.update of `sort` is the
  // wrong path here and would be reverted.
  card.move(card.boardId, card.swimlaneId, card.listId, targetSort);
  target.move(target.boardId, target.swimlaneId, target.listId, cardSort);
}

Template.minicard.events({
  'keydown .minicard-title-text.js-open-inlined-form'(event) {
    // The title container replaced an anchor overlay in #6639 so markdown
    // anchors can receive clicks. Retain the overlay's keyboard behavior on
    // the container itself without turning nested rendered links into editors.
    if (
      event.target === event.currentTarget &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      event.currentTarget.click();
    }
  },
  // #4990: the title is edited in place. The minicard sits inside the wrapper
  // LINK to the card, so every click inside the open form would otherwise
  // navigate away mid-edit. Cancelling the click's default stops that - except
  // on the save button, whose own default IS the submit (the innermost element
  // with an activation behaviour is the one that runs, so the link does not
  // follow when the button is clicked).
  'click .js-minicard-title-form'(event) {
    event.stopPropagation();
    if (!$(event.target).closest('button[type=submit]').length) {
      event.preventDefault();
    }
  },
  async 'submit .js-minicard-title-form'(event, templateInstance) {
    event.preventDefault();
    event.stopPropagation();
    // #6604: `this` is the nested inlinedForm's data context
    // ({ classNames: 'js-minicard-title-form' }), not the Card. The enclosing
    // minicard template instance keeps the Card it was created with.
    const card = templateInstance.data;
    const title = templateInstance
      .$('.js-edit-minicard-title')
      .val()
      ?.trim();
    // An empty title would leave a card with nothing to click, so an empty
    // save is a no-op rather than a way to lose the card - same as a list.
    if (card && title && title !== card.getTitle()) {
      await card.setTitle(title);
    }
  },
  'click .js-linked-link'() {
    if (this.isLinkedCard()) Utils.goCardId(this.linkedId);
    else if (this.isLinkedBoard())
      Utils.goBoardId(this.linkedId);
  },
  'click .js-card-move-up'(event) {
    // The move buttons sit inside the minicard anchor; don't let the click
    // bubble up and open the card detail view.
    event.preventDefault();
    event.stopPropagation();
    moveCardBy(this, -1);
  },
  'click .js-card-move-down'(event) {
    event.preventDefault();
    event.stopPropagation();
    moveCardBy(this, 1);
  },
  'click .js-toggle-card-complete'(event) {
    // Trello-style "mark complete" toggle (left of the title). Don't let the
    // click open the card.
    event.preventDefault();
    event.stopPropagation();
    if (!Utils.canModifyCard()) {
      return;
    }
    this.setDueComplete(!this.getDueComplete());
  },
  // The minicard's own copy of this only ever wrote localStorage, so a
  // logged-in user toggling it here set something nothing reads. One module
  // now, for reading and for writing. client/lib/minicardLabelText.js
  'click .js-toggle-minicard-label-text'() {
    toggleMinicardLabelText();
  },
  'click span.badge-icon.fa.fa-sort, click span.badge-text.check-list-sort' : Popup.open("editCardSortOrder"),
  // A label on a minicard opens the card's labels, and ONLY that. The click used
  // to reach the minicard as well, so the card details opened behind the popup:
  // two things for one click, and the one you asked for on top of the one you
  // did not.
  //
  // Which label was clicked is read from the EVENT rather than from `:hover`.
  // `:hover` answers about the pointer, and on a touch screen it can still be
  // true for whatever was tapped last - so a tap anywhere in the labels area
  // could open the labels of a label nobody touched.
  'click .minicard-labels'(event) {
    if (!$(event.target).closest('.js-card-label').length) {
      return; // not a label - let the click be the card's, as before
    }
    event.preventDefault();
    event.stopPropagation();
    Popup.open("cardLabels")(event, {dataContextIfCurrentDataIsUndefined: Template.currentData()});
  },
  'click .js-open-minicard-details-menu'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    const card = Template.currentData();
    setCardMenuSource('minicard');
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
  /** #1591: folded for THIS user, under the same key the opened card uses, so
   * the two agree. `this.checklist || this` because this template is called both
   * with an explicit checklist and with one as the data context. */
  checklistCollapsed() {
    const checklist = this.checklist || this;
    if (!checklist || !checklist._id) return false;
    const user = ReactiveCache.getCurrentUser();
    if (!user) return false;
    const cardId = (this.card && this.card._id) || checklist.cardId;
    return user.getCollapsedCardSection(
      cardId, user.checklistSectionKey(checklist._id)) === true;
  },
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

// #6440: create the checklist item(s) for the minicard add-item form. Shared by
// the Save-button click handler and the (rarely reached) form-submit handler.
// The Save button needs an explicit click handler because the minicard — and so
// the add-item <form> — is rendered inside the `a.minicard-wrapper` anchor, where
// the native form `submit` event never reaches the Blaze event map; without this
// the "+" add-item on the minicard did nothing. The blank-input guard and the
// title parsing live in the pure, unit-tested models/lib/checklistItemTitles.js.
function addMinicardChecklistItems(textarea, checklist) {
  if (!textarea || !checklist) return;
  const titles = parseChecklistItemTitles(textarea.value);
  if (titles.length === 0) return;
  const items = checklist.items();
  const lastItem = items[items.length - 1] || null;
  let sortIndex = Utils.calculateIndexData(lastItem, null).base;
  titles.forEach(title => {
    ChecklistItems.insert(buildChecklistItemPayload(title, checklist, sortIndex));
    sortIndex += 1;
  });
  textarea.value = '';
  textarea.focus();
}

Template.minicardChecklist.events({
  'click .js-collapse-checklist'(event) {
    // A minicard is a link to the card, and the title opens the rename form -
    // neither must happen because somebody folded a checklist.
    event.preventDefault();
    event.stopPropagation();
    const data = Template.currentData();
    const checklist = (data && data.checklist) || data || this;
    const user = ReactiveCache.getCurrentUser();
    if (!checklist || !checklist._id || !user) return;
    const cardId = (data && data.card && data.card._id) || checklist.cardId;
    const key = user.checklistSectionKey(checklist._id);
    const collapsed = user.getCollapsedCardSection(cardId, key) === true;
    user.setCollapsedCardSection(cardId, key, !collapsed);
  },
  'keydown .js-collapse-checklist'(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    $(event.currentTarget).trigger('click');
  },
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
  // #6440: explicit click handler for the minicard "+" add-item Save button.
  // The native form `submit` event does not fire on the minicard (the form is
  // inside the `a.minicard-wrapper` anchor), so — unlike card-detail — we cannot
  // rely on `submit .js-add-checklist-item`. This mirrors the already-working
  // `click .js-submit-edit-checklist-item-form` above.
  'click .js-submit-add-checklist-item-form'(event) {
    event.preventDefault();
    event.stopPropagation();
    const $form = $(event.currentTarget).closest('form');
    const textarea = $form.find('textarea.js-add-checklist-item')[0];
    const formData = Blaze.getData($form[0]) || Template.currentData() || {};
    addMinicardChecklistItems(textarea, formData.checklist);
  },
  // Kept for completeness (e.g. card-detail-style contexts); on the minicard this
  // rarely fires, so the click handler above is the real path. See #6440.
  'submit .js-add-checklist-item'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-add-checklist-item');
    const data = Template.currentData() || {};
    addMinicardChecklistItems(textarea, data.checklist);
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

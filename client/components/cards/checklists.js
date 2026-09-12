import { formatDateForDisplay } from '/client/lib/dateDisplay';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Filter } from '/client/lib/filter';
import Cards from '/models/cards';
import Boards from '/models/boards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import { BoardSwimlaneListCardDialog } from '/client/lib/dialogWithBoardSwimlaneListCard';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import autosize from 'autosize';
import { isChecklistShownAtMinicard } from '/models/lib/minicardChecklistVisibility';
import { CHECKLIST_RESET_INTERVALS } from '/models/lib/checklistResetSchedule';
import { playChecklistDingSound } from '/client/lib/checklistDingSound';
import {
  datePickerRendered,
  datePickerHelpers,
} from '/client/lib/datepicker';
import {
  isValidDate,
} from '/imports/lib/dateUtils';
import { dueDateClass } from '/client/lib/dueDateColor';
import { subscribeDateNowTicker } from '/client/lib/dateNowTicker';
import {
  checklistItemsToText,
  parseChecklistItemsText,
  planChecklistItemsTextUpdate,
} from '/models/lib/checklistItemsAsText';
import { buildCardFromChecklistItem } from '/models/lib/checklistItemToCard';
import { subtaskNavTarget } from '/client/components/cards/subtaskViewHelpers';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// SubsManager removed for Meteor 3 migration
const { calculateIndexData } = Utils;

// #3294: was the sortable `stop` released over a LIST's own card column
// (`.js-minicards`, see client/components/lists/listBody.jade) rather than
// back inside a checklist? Reads the element under the pointer rather than
// tracking drop targets some other way, because the checklist-item sortable
// is only ever connected to OTHER `.js-checklist-items` containers (see
// initSorting below) - a `.js-minicards` is never a valid sortable target for
// it, so jQuery UI always reverts the drag, and this is what turns that
// revert into "create a card here" instead of a no-op.
function resolveListDropTarget(evt) {
  const pageX = evt && (evt.pageX ?? (evt.originalEvent && evt.originalEvent.pageX));
  const pageY = evt && (evt.pageY ?? (evt.originalEvent && evt.originalEvent.pageY));
  if (typeof pageX !== 'number' || typeof pageY !== 'number') return null;
  const x = pageX - window.scrollX;
  const y = pageY - window.scrollY;
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const $minicards = $(el).closest('.js-minicards');
  if (!$minicards.length) return null;
  const list = Blaze.getData($minicards.get(0));
  if (!list || !list._id) return null;

  // Same swimlane-resolution shape as list.js's own card-drop handler: use
  // the swimlane row being dropped into when the board is in swimlanes view,
  // otherwise fall back to the list's own swimlaneId, then the board default.
  const swimlaneEl = $minicards.closest('.swimlane').get(0);
  const swimlaneData = swimlaneEl && Blaze.getData(swimlaneEl);
  let swimlaneId = swimlaneData && swimlaneData._id;
  if (!swimlaneId) swimlaneId = list.swimlaneId;
  if (!swimlaneId) {
    const board = ReactiveCache.getBoard(list.boardId);
    const defaultSwimlane = board && board.getDefaultSwimline && board.getDefaultSwimline();
    swimlaneId = defaultSwimlane && defaultSwimlane._id;
  }
  return { list, swimlaneId };
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
      const checklistDomElement = ui.item.get(0);
      const checklistData = Blaze.getData(checklistDomElement);
      const checklistItem = checklistData.item;

      items.sortable('cancel');

      // #3294: dropped onto a list rather than back into a checklist -
      // create a new card from the item's text instead of reordering. The
      // original checklist item is left exactly as it was (see
      // buildCardFromChecklistItem's scope note - this never marks it done).
      const dropTarget = resolveListDropTarget(evt);
      if (dropTarget) {
        const maxSort = ReactiveCache.getCards({
          listId: dropTarget.list._id,
        }).reduce((max, c) => Math.max(max, c.sort || 0), 0);
        const cardDoc = buildCardFromChecklistItem(
          checklistItem,
          dropTarget.list,
          dropTarget.swimlaneId,
          maxSort + 1,
        );
        if (cardDoc) {
          Cards.insert(cardDoc);
        }
        return;
      }

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
  // #4017: apply/append a template card's checklists onto this already
  // existing card, alongside whatever checklists it already has.
  'click .js-copy-checklist-from-template': Popup.open('copyChecklistFromTemplate'),
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
  // #2422: "Convert to subtask" - distinct from the plain, unlinked
  // "Convert to card" action above and from the #3294 drag-to-card gesture.
  // This creates a proper SUBTASK of the CURRENT card (reusing the same
  // server-side `addSubtaskCard` method 'submit .js-add-subtask' uses in
  // subtasks.js, so the default subtasks board/list/swimlane and automatic
  // custom fields are resolved exactly the same way), seeded with the
  // checklist item's own title, and then records the new subtask's _id on
  // the item's `linkedCardId` field so a "linked subtask" indicator can be
  // shown on the item (checklistItemDetail, below). The original checklist
  // item is left untouched - it is not deleted or replaced.
  async 'click .js-convert-checklist-item-to-subtask'(event, tpl) {
    event.preventDefault();
    const item = Template.currentData().item;
    if (!item || !item.title || !item.cardId) {
      return;
    }
    const parentCard = ReactiveCache.getCard(item.cardId);
    const parentCardId = parentCard && parentCard.getRealId
      ? parentCard.getRealId()
      : item.cardId;
    if (!parentCardId) {
      return;
    }
    try {
      const _id = await Meteor.callAsync(
        'addSubtaskCard',
        parentCardId,
        item.title,
        false,
      );
      if (!_id) {
        throw new Error('The server could not create the subtask.');
      }
      await item.setLinkedCardId(_id);
      // In case the filter is active, keep the new subtask visible instead
      // of it disappearing instantly. See https://github.com/wekan/wekan/issues/80
      Filter.addException(_id);
    } catch (error) {
      alert(error?.reason || error?.message || 'Could not create the subtask.');
    }
  },
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
  'click .js-export-checklist': Popup.open('exportChecklist'),
  'click .js-edit-checklist-items-as-text': Popup.open('editChecklistItemsAsText'),
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
  'click .js-set-checklist-reset-interval': Popup.open('checklistResetInterval'),
  // #2473: bulk check/uncheck every item of this checklist in one action,
  // reusing the same checkAllItems()/uncheckAllItems() model helpers the
  // Rules automation already uses per-item (server/rulesHelper.js).
  'click .js-check-all-checklist-items'(event) {
    event.preventDefault();
    const checklist = Template.currentData().checklist;
    if (checklist) {
      checklist.checkAllItems();
    }
    Popup.back();
  },
  'click .js-uncheck-all-checklist-items'(event) {
    event.preventDefault();
    const checklist = Template.currentData().checklist;
    if (checklist) {
      checklist.uncheckAllItems();
    }
    Popup.back();
  },
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

// #3818 / #4729: pick (or clear) the checklist's automatic-reset interval.
Template.checklistResetIntervalPopup.helpers({
  resetIntervals() {
    return CHECKLIST_RESET_INTERVALS;
  },
  isCurrentInterval() {
    const checklist = Template.instance().data && Template.instance().data.checklist;
    const current = (checklist && checklist.resetInterval) || 'none';
    return current === this.toString();
  },
});

Template.checklistResetIntervalPopup.events({
  'click .js-set-reset-interval'(event, tpl) {
    event.preventDefault();
    const interval = event.currentTarget.getAttribute('data-interval');
    const checklist = tpl.data && tpl.data.checklist;
    if (checklist) {
      checklist.setResetInterval(interval);
    }
    Popup.back();
  },
});

// #4218: bulk-edit a checklist's items as one multi-line text block.
Template.editChecklistItemsAsTextPopup.helpers({
  checklistItemsAsText() {
    const checklist = this.checklist;
    if (!checklist) return '';
    const items = checklist.items ? checklist.items() : [];
    return checklistItemsToText(items);
  },
});

Template.editChecklistItemsAsTextPopup.onRendered(function () {
  autosize(this.$('textarea.js-checklist-items-as-text'));
});

Template.editChecklistItemsAsTextPopup.events({
  'click .js-cancel-checklist-items-as-text'(event) {
    event.preventDefault();
    Popup.back();
  },
  'submit .js-edit-checklist-items-as-text-form'(event, tpl) {
    event.preventDefault();
    const checklist = Template.currentData().checklist;
    if (!checklist) return;
    const textarea = tpl.find('textarea.js-checklist-items-as-text');
    const parsedLines = parseChecklistItemsText(textarea.value);
    const existingItems = (checklist.items ? checklist.items() : []).map(item => ({
      _id: item._id,
      title: item.title,
    }));
    const plan = planChecklistItemsTextUpdate(existingItems, parsedLines);

    plan.keep.forEach(({ _id, sort, isFinished }) => {
      ChecklistItems.updateAsync(_id, { $set: { sort, isFinished } });
    });
    plan.insert.forEach(({ title, isFinished, sort }) => {
      ChecklistItems.insert({
        title,
        isFinished,
        checklistId: checklist._id,
        cardId: checklist.cardId,
        sort,
      });
    });
    plan.remove.forEach(_id => {
      // #3252: see js-delete-checklist-item - avoid "Removed nonexistent document".
      if (ChecklistItems.findOne(_id)) {
        ChecklistItems.remove(_id);
      }
    });

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
  // #2422: show the "linked subtask" indicator only while the linked card
  // still exists (it may have been archived/removed independently since).
  linkedSubtask() {
    const item = this.item;
    return item && item.getLinkedCard ? item.getLinkedCard() : undefined;
  },
});

Template.checklistItemDetail.events({
  // #2422: open the checklist item's linked subtask card. Reuses the same
  // navigation guard subtasks.js uses for its own "View it" button, so a
  // subtask on another (not-yet-loaded) board resolves the same way.
  'click .js-checklist-item-linked-subtask'(event) {
    event.preventDefault();
    event.stopPropagation();
    const item = Template.currentData().item;
    const subtask = item && item.getLinkedCard ? item.getLinkedCard() : undefined;
    if (!subtask) {
      return;
    }
    const target = subtaskNavTarget(subtask);
    if (target) {
      FlowRouter.go('card', target);
    } else {
      console.warn(
        'Cannot view linked subtask: missing board/card id on subtask',
        subtask && subtask._id,
      );
    }
  },
  'click .js-checklist-item .check-box-container'() {
    const checklist = Template.currentData().checklist;
    const item = Template.currentData().item;
    if (checklist && item && item._id) {
      // #5427: play a short "ding" only on the unchecked -> checked
      // transition (never on uncheck), and only when the user opted in.
      const wasFinished = !!item.isFinished;
      item.toggleItem();
      if (!wasFinished) {
        const currentUser = ReactiveCache.getCurrentUser();
        if (currentUser && currentUser.hasChecklistDingSound()) {
          playChecklistDingSound();
        }
      }
    }
  },
  // #4755: open the checklist item's own due-date popup. Bound to the ITEM
  // (not the {item, checklist, card} data this template's events normally see)
  // so it opens exactly like a card's own due-date popup does for a card.
  'click .js-checklist-item-due-date'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    const item = Template.currentData().item;
    if (item) {
      // Reuse the card's own "Change due date" title (#4755) rather than
      // adding a near-duplicate translation key to every locale file.
      Popup.open('editChecklistItemDueDate', {
        titleKey: 'editCardDueDatePopup-title',
      }).call(item, event, tpl);
    }
  },
});

// checklistItemDueDate - the compact due-date badge on a single checklist
// item (#4755). Reuses dateBadgeBody, the same markup the card's own
// received/start/due/end badges use, so the item's badge looks and colours
// itself identically (see client/components/cards/cardDate.jade / .js).
Template.checklistItemDueDate.onCreated(function () {
  this.date = new ReactiveVar();
  const dateNowTicker = subscribeDateNowTicker();
  this.now = dateNowTicker.now;
  this.view.onViewDestroyed(dateNowTicker.unsubscribe);
  const self = this;
  self.autorun(() => {
    const item = Template.currentData().item;
    self.date.set(new Date(item && item.getDue ? item.getDue() : undefined));
  });
});

Template.checklistItemDueDate.helpers({
  showWeek() {
    // Checklist items are dense UI (see CLAUDE.md) - no ISO-week badge here.
    return '';
  },
  showWeekOfYear() {
    return false;
  },
  showDate() {
    return formatDateForDisplay(Template.instance().date.get(), true);
  },
  showISODate() {
    return Template.instance().date.get().toISOString();
  },
  classes() {
    const tpl = Template.instance();
    return dueDateClass(tpl.date.get(), tpl.now.get());
  },
  showTitle() {
    const tpl = Template.instance();
    const formattedDate = formatDateForDisplay(tpl.date.get(), true);
    return `${TAPi18n.__('card-due-on')} ${formattedDate}`;
  },
});

Template.checklistItemDueDate.events({
  'click .js-edit-date'(event, tpl) {
    event.preventDefault();
    event.stopPropagation();
    const item = Template.currentData().item;
    if (item) {
      // Reuse the card's own "Change due date" title (#4755) rather than
      // adding a near-duplicate translation key to every locale file.
      Popup.open('editChecklistItemDueDate', {
        titleKey: 'editCardDueDatePopup-title',
      }).call(item, event, tpl);
    }
  },
});

// editChecklistItemDueDatePopup - the popup form editing that badge. Reuses
// editDateForm - the same date/time-picker markup and submit/delete events
// (datePickerEvents(), registered once on Template.editDateForm) the card's
// own editCardDueDatePopup uses. Deliberately does NOT use setupDatePicker
// from /client/lib/datepicker: that helper resolves its `card` via
// getCurrentCardFromContext(), which - opened from inside an already-open
// card detail dialog - would find the CARD, not the checklist item, and
// silently save the due date on the wrong document.
Template.editChecklistItemDueDatePopup.onCreated(function () {
  const item = Template.currentData();
  const initialDate = item && item.getDue ? item.getDue() : undefined;
  this.datePicker = {
    error: new ReactiveVar(''),
    card: item,
    date: new ReactiveVar(
      initialDate && isValidDate(new Date(initialDate))
        ? new Date(initialDate)
        : new Date('invalid'),
    ),
    defaultTime: '1970-01-01 17:00:00',
    storeDate(date, currentItem) {
      return currentItem.setDue(date);
    },
    deleteDate(currentItem) {
      return currentItem.unsetDue();
    },
  };
});

Template.editChecklistItemDueDatePopup.onRendered(function () {
  datePickerRendered(this);
});

Template.editChecklistItemDueDatePopup.helpers(datePickerHelpers());

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

/**
 * Copy Checklist(s) From Template Card Dialog (#4017).
 *
 * Unlike "Copy Checklist" above (which copies ONE existing checklist FROM
 * this card TO a chosen destination card), this picks a SOURCE card — a
 * template card, or any other card — and APPENDS every one of its checklists
 * onto THIS card, alongside whatever checklists this card already has. It
 * reuses the same `Checklists.copy()` helper (via `copyAllFromCardToCard`),
 * so the copy semantics (fresh ids, `.direct` inserts, board re-homing) are
 * the same as every other checklist copy in the app — the only difference is
 * that copied items always come in unchecked (`resetChecked`), since a
 * template being applied should never pre-check its target.
 */
Template.copyChecklistFromTemplatePopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListCardDialog(this, {
    getDialogOptions() {
      return ReactiveCache.getCurrentUser().getCopyChecklistFromTemplateDialogOptions();
    },
    async setDone(sourceCardId, options) {
      ReactiveCache.getCurrentUser().setCopyChecklistFromTemplateDialogOption(this.currentBoardId, options);
      const targetCardId = Template.currentData().cardId;
      if (sourceCardId && targetCardId) {
        await Checklists.copyAllFromCardToCard(sourceCardId, targetCardId);
      }
    },
  });
});
registerChecklistDialogEvents('copyChecklistFromTemplatePopup');

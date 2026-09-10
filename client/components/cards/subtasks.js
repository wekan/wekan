import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Cards from '/models/cards';
import { Filter } from '/client/lib/filter';
import { subtaskStatusLabel } from './subtaskStatusHelpers';
import {
  subtaskNavTarget,
  subtaskBoardNavTarget,
} from './subtaskViewHelpers';
import { Utils } from '/client/lib/utils';

Template.subtasks.events({
  'click .js-open-subtask-details-menu'(event) {
    // Close any existing popup first to avoid accumulating content
    if (Popup.isOpen()) {
      Popup.close();
    }
    // Now open the popup for this specific subtask
    Popup.open('subtaskActions').call(this, event);
  },
  async 'submit .js-add-subtask'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-add-subtask-item');
    const title = textarea.value.trim();
    const contextCard = ReactiveCache.getCard(this.cardId);
    const cardId = contextCard?.getRealId ? contextCard.getRealId() : this.cardId;

    if (title) {
      // Subtask creation is performed server-side by the `addSubtaskCard` Meteor
      // method, so the default subtasks board/list/swimlane are resolved (and
      // lazily created exactly once) on the server. This prevents the client
      // from creating duplicate subtasks boards / swimlanes / columns
      // (#3868 / #5788 / #2256) and lets multiple subtasks be created reliably
      // (#4782), and the method applies the destination board's automatic
      // custom fields to the new subtask (#4037 / #3562).
      try {
        const _id = await Meteor.callAsync('addSubtaskCard', cardId, title);

        if (!_id) {
          throw new Error('The server could not create the subtask.');
        }
        // In case the filter is active we need to add the newly inserted card in
        // the list of exceptions -- cards that are not filtered. Otherwise the
        // card will disappear instantly.
        // See https://github.com/wekan/wekan/issues/80
        Filter.addException(_id);

        setTimeout(() => {
          tpl.$('.add-subtask-item')
            .last()
            .click();
        }, 100);
        textarea.value = '';
        textarea.focus();
      } catch (error) {
        alert(error?.reason || error?.message || 'Could not create the subtask.');
        textarea.focus();
      }
    }
  },
  'submit .js-edit-subtask-title'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-edit-subtask-item');
    const title = textarea.value.trim();
    const subtask = Template.currentData().subtask;
    subtask.setTitle(title);
  },
  async 'click .js-delete-subtask-item'() {
    const subtask = Template.currentData().subtask;
    if (subtask && subtask._id) {
      await subtask.archive();
    }
  },
  keydown(event) {
    //If user press enter key inside a form, submit it
    //Unless the user is also holding down the 'shift' key
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      const $form = $(event.currentTarget).closest('form');
      $form.find('button[type=submit]').click();
    }
  },
});

Template.subtasks.onCreated(function () {
  this.toggleDeleteDialog = new ReactiveVar(false);
  // #3409: archived subtasks stay in the list, shown as completed, instead of
  // vanishing. This toggle hides them again for anyone who wants the shorter
  // list — a client-side ReactiveVar, not a persisted field, because it is a
  // per-viewing preference of this subtask list, not data about the card.
  this.hideCompletedSubtasks = new ReactiveVar(false);
});

Template.subtasks.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
  },
  toggleDeleteDialog() {
    return Template.instance().toggleDeleteDialog;
  },
  hideCompletedSubtasks() {
    return Template.instance().hideCompletedSubtasks.get();
  },
  // #3409: archived (= completed) subtasks are always fetched — currentCard.subtasks()
  // used to filter them out entirely — and only hidden here, on the client,
  // when the toggle above is on. The template's own data context is
  // {cardId}, not the card itself (see +subtasks(cardId = _id) below), so the
  // card is looked up the same way the add-subtask handler above does.
  visibleSubtasks() {
    const card = ReactiveCache.getCard(this.cardId);
    const allSubtasks = card && card.allSubtasks ? card.allSubtasks() : [];
    if (Template.instance().hideCompletedSubtasks.get()) {
      return allSubtasks.filter(subtask => !subtask.archived);
    }
    return allSubtasks;
  },
});

Template.subtasks.events({
  'click .js-toggle-hide-completed-subtasks'(event, tpl) {
    event.preventDefault();
    tpl.hideCompletedSubtasks.set(!tpl.hideCompletedSubtasks.get());
  },
});

Template.subtaskDetail.helpers({
  // #6091: show the subtask's current status, i.e. the list it resides in
  // (prefixed with the board title when the subtask lives on another board
  // than the parent card).
  subtaskStatus() {
    const subtask = this.subtask;
    if (!subtask) {
      return '';
    }
    const list = subtask.list && subtask.list();
    const listTitle = list ? list.title : '';
    const board = subtask.board && subtask.board();
    const boardTitle = board ? board.title : '';
    const parentCard = Utils.getCurrentCard();
    const sameBoard = !!parentCard && parentCard.boardId === subtask.boardId;
    return subtaskStatusLabel({ listTitle, boardTitle, sameBoard });
  },
});

Template.subtaskItemDetail.events({
  async 'click .js-subtasks-item .check-box-container'() {
    const item = Template.currentData().item;
    if (item && item._id) {
      await item.toggleItem();
    }
  },
});

Template.subtaskActionsPopup.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
  },
});

Template.subtaskActionsPopup.events({
  'click .js-view-subtask'(event) {
    if ($(event.target).hasClass('js-view-subtask')) {
      const subtask = Template.currentData().subtask;
      // #3743: open the SUBTASK card itself, not the parent/current card.
      // subtaskNavTarget derives boardId/slug/cardId from the subtask only.
      // #1853 / #4762: when the subtask's board (often a DIFFERENT deposit
      // board) is not in minimongo yet, it falls back to the subtask's own
      // boardId so the route loads the board — no TypeError, no dead button.
      // It only returns undefined for a truly broken subtask document.
      const target = subtaskNavTarget(subtask);
      if (target) {
        FlowRouter.go('card', target);
      } else {
        // Broken subtask (no card id / board id): warn instead of throwing.
        console.warn(
          'Cannot view subtask: missing board/card id on subtask',
          subtask && subtask._id,
        );
      }
    }
  },
  'click .js-go-to-subtask-board'() {
    const subtask = Template.currentData().subtask;
    // #1853: fall back to subtask.boardId when the board doc is not loaded.
    const target = subtaskBoardNavTarget(subtask);
    if (target) {
      Popup.close();
      FlowRouter.go('board', target);
    } else {
      console.warn(
        'Cannot go to subtask board: missing board id on subtask',
        subtask && subtask._id,
      );
    }
  },
  'click .js-delete-subtask' : Popup.afterConfirm('subtaskDelete', async function () {
    Popup.back(2);
    const subtask = this.subtask;
    if (subtask && subtask._id) {
      await subtask.archive();
    }
  }),
});

Template.editSubtaskItemForm.helpers({
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
  },
});

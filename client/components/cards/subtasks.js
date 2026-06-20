import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Cards from '/models/cards';
import { Filter } from '/client/lib/filter';
import { subtaskStatusLabel } from './subtaskStatusHelpers';
import { canNavigateToSubtaskBoard } from './subtaskViewHelpers';
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
    const cardId = Template.currentData().cardId;
    const card = ReactiveCache.getCard(cardId);
    const sortIndex = -1;
    const crtBoard = ReactiveCache.getBoard(card.boardId);
    const targetBoard = await crtBoard.getDefaultSubtasksBoardAsync();
    if (!targetBoard) {
      return;
    }

    const targetList = await targetBoard.getDefaultSubtasksListAsync();
    if (!targetList) {
      return;
    }
    const listId = targetList._id;

    //Get the full swimlane data for the parent task.
    const parentSwimlane = ReactiveCache.getSwimlane({
      boardId: crtBoard._id,
      _id: card.swimlaneId,
    });
    //find the swimlane of the same name in the target board.
    const targetSwimlane = parentSwimlane
      ? ReactiveCache.getSwimlane({
          boardId: targetBoard._id,
          title: parentSwimlane.title,
        })
      : undefined;
    //If no swimlane with a matching title exists in the target board, fall back to the default swimlane.
    const swimlaneId =
      targetSwimlane === undefined
        ? targetBoard.getDefaultSwimline()._id
        : targetSwimlane._id;

    const nextCardNumber = await targetBoard.getNextCardNumber();

    if (title) {
      const _id = await Cards.insertAsync({
        title,
        parentId: cardId,
        members: [],
        labelIds: [],
        customFields: [],
        listId,
        boardId: targetBoard._id,
        sort: sortIndex,
        swimlaneId,
        type: 'cardType-card',
        cardNumber: nextCardNumber,
      });

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
    }
    textarea.value = '';
    textarea.focus();
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
});

Template.subtasks.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  toggleDeleteDialog() {
    return Template.instance().toggleDeleteDialog;
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
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
});

Template.subtaskActionsPopup.events({
  'click .js-view-subtask'(event) {
    if ($(event.target).hasClass('js-view-subtask')) {
      const subtask = Template.currentData().subtask;
      const board = subtask.board();
      // #4762: the subtask's board may not be loaded yet (ReactiveCache miss);
      // guard before dereferencing it, mirroring js-go-to-subtask-board.
      if (canNavigateToSubtaskBoard(board)) {
        FlowRouter.go('card', {
          boardId: board._id,
          slug: board.slug,
          cardId: subtask._id,
          swimlaneId: subtask.swimlaneId,
          listId: subtask.listId,
        });
      }
    }
  },
  'click .js-go-to-subtask-board'() {
    const subtask = Template.currentData().subtask;
    const board = subtask.board();
    if (board) {
      Popup.close();
      FlowRouter.go('board', { id: board._id, slug: board.slug });
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
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
});

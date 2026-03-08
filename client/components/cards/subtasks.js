import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.subtasks.events({
  'click .js-open-subtask-details-menu': Popup.open('subtaskActions'),
  'submit .js-add-subtask'(event, tpl) {
    event.preventDefault();
    const textarea = tpl.find('textarea.js-add-subtask-item');
    const title = textarea.value.trim();
    const cardId = Template.currentData().cardId;
    const card = ReactiveCache.getCard(cardId);
    const sortIndex = -1;
    const crtBoard = ReactiveCache.getBoard(card.boardId);
    const targetBoard = crtBoard.getDefaultSubtasksBoard();
    const listId = targetBoard.getDefaultSubtasksListId();

    //Get the full swimlane data for the parent task.
    const parentSwimlane = ReactiveCache.getSwimlane({
      boardId: crtBoard._id,
      _id: card.swimlaneId,
    });
    //find the swimlane of the same name in the target board.
    const targetSwimlane = ReactiveCache.getSwimlane({
      boardId: targetBoard._id,
      title: parentSwimlane.title,
    });
    //If no swimlane with a matching title exists in the target board, fall back to the default swimlane.
    const swimlaneId =
      targetSwimlane === undefined
        ? targetBoard.getDefaultSwimline()._id
        : targetSwimlane._id;

    const nextCardNumber = targetBoard.getNextCardNumber();

    if (title) {
      const _id = Cards.insert({
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
        cardNumber: nextCardNumber
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

Template.subtaskItemDetail.events({
  async 'click .js-subtasks-item .check-box-unicode'() {
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
      FlowRouter.go('card', {
        boardId: board._id,
        slug: board.slug,
        cardId: subtask._id,
      });
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

BlazeComponent.extendComponent({
  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },
}).register('subtaskDetail');

BlazeComponent.extendComponent({
  addSubtask(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-subtask-item');
    const title = textarea.value.trim();
    const cardId = this.currentData().cardId;
    const card = Cards.findOne(cardId);
    const sortIndex = -1;
    const crtBoard = Boards.findOne(card.boardId);
    const targetBoard = crtBoard.getDefaultSubtasksBoard();
    const listId = targetBoard.getDefaultSubtasksListId();

    //Get the full swimlane data for the parent task.
    const parentSwimlane = Swimlanes.findOne({
      boardId: crtBoard._id,
      _id: card.swimlaneId,
    });
    //find the swimlane of the same name in the target board.
    const targetSwimlane = Swimlanes.findOne({
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
        this.$('.add-subtask-item')
          .last()
          .click();
      }, 100);
    }
    textarea.value = '';
    textarea.focus();
  },

  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },

  deleteSubtask() {
    const subtask = this.currentData().subtask;
    if (subtask && subtask._id) {
      subtask.archive();
    }
  },

  editSubtask(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-edit-subtask-item');
    const title = textarea.value.trim();
    const subtask = this.currentData().subtask;
    subtask.setTitle(title);
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

  events() {
    return [
      {
        'click .js-open-subtask-details-menu': Popup.open('subtaskActions'),
        'submit .js-add-subtask': this.addSubtask,
        'submit .js-edit-subtask-title': this.editSubtask,
        'click .js-delete-subtask-item': this.deleteSubtask,
        keydown: this.pressKey,
      },
    ];
  },
}).register('subtasks');

Template.subtaskItemDetail.helpers({
  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },
});

BlazeComponent.extendComponent({
  // ...
}).register('subtaskItemDetail');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-view-subtask'(event) {
          if ($(event.target).hasClass('js-view-subtask')) {
            const subtask = this.currentData().subtask;
            const board = subtask.board();
            FlowRouter.go('card', {
              boardId: board._id,
              slug: board.slug,
              cardId: subtask._id,
            });
          }
        },
        'click .js-delete-subtask' : Popup.afterConfirm('subtaskDelete', function () {
          Popup.back(2);
          const subtask = this.subtask;
          if (subtask && subtask._id) {
            subtask.archive();
          }
        }),
      }
    ]
  }
}).register('subtaskActionsPopup');

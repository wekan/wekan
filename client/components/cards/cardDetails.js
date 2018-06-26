const subManager = new SubsManager();
const { calculateIndexData } = Utils;

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  calculateNextPeak() {
    const cardElement = this.find('.js-card-details');
    if (cardElement) {
      const altitude = cardElement.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },

  reachNextPeak() {
    const activitiesComponent = this.childComponents('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
    this.isLoaded = new ReactiveVar(false);
    const boardBody =  this.parentComponent().parentComponent();
    //in Miniview parent is Board, not BoardBody.
    if (boardBody !== null) {
      boardBody.showOverlay.set(true);
      boardBody.mouseHasEnterCardDetails = false;
    }
    this.calculateNextPeak();

    Meteor.subscribe('unsaved-edits');
  },

  isWatching() {
    const card = this.currentData();
    return card.findWatcher(Meteor.userId());
  },

  hiddenSystemMessages() {
    return Meteor.user().hasHiddenSystemMessages();
  },

  canModifyCard() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },

  scrollParentContainer() {
    const cardPanelWidth = 510;
    const bodyBoardComponent = this.parentComponent().parentComponent();
    //On Mobile View Parent is Board, Not Board Body. I cant see how this funciton should work then.
    if (bodyBoardComponent === null) return;
    const $cardView = this.$(this.firstNode());
    const $cardContainer = bodyBoardComponent.$('.js-swimlanes');
    const cardContainerScroll = $cardContainer.scrollLeft();
    const cardContainerWidth = $cardContainer.width();

    const cardViewStart = $cardView.offset().left;
    const cardViewEnd = cardViewStart + cardPanelWidth;

    let offset = false;
    if (cardViewStart < 0) {
      offset = cardViewStart;
    } else if (cardViewEnd > cardContainerWidth) {
      offset = cardViewEnd - cardContainerWidth;
    }

    if (offset) {
      bodyBoardComponent.scrollLeft(cardContainerScroll + offset);
    }
  },

  presentParentTask() {
    let result = this.currentBoard.presentParentTask;
    if ((result === null) || (result === undefined)) {
      result = 'no-parent';
    }
    return result;
  },

  linkForCard() {
    const card = this.currentData();
    let result = '#';
    if (card) {
      const board = Boards.findOne(card.boardId);
      if (board) {
        result = FlowRouter.url('card', {
          boardId: card.boardId,
          slug: board.slug,
          cardId: card._id,
        });
      }
    }
    return result;
  },

  onRendered() {
    if (!Utils.isMiniScreen()) this.scrollParentContainer();
    const $checklistsDom = this.$('.card-checklist-items');

    $checklistsDom.sortable({
      tolerance: 'pointer',
      helper: 'clone',
      handle: '.checklist-title',
      items: '.js-checklist',
      placeholder: 'checklist placeholder',
      distance: 7,
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
      },
      stop(evt, ui) {
        let prevChecklist = ui.item.prev('.js-checklist').get(0);
        if (prevChecklist) {
          prevChecklist = Blaze.getData(prevChecklist).checklist;
        }
        let nextChecklist = ui.item.next('.js-checklist').get(0);
        if (nextChecklist) {
          nextChecklist = Blaze.getData(nextChecklist).checklist;
        }
        const sortIndex = calculateIndexData(prevChecklist, nextChecklist, 1);

        $checklistsDom.sortable('cancel');
        const checklist = Blaze.getData(ui.item.get(0)).checklist;

        Checklists.update(checklist._id, {
          $set: {
            sort: sortIndex.base,
          },
        });
      },
    });

    const $subtasksDom = this.$('.card-subtasks-items');

    $subtasksDom.sortable({
      tolerance: 'pointer',
      helper: 'clone',
      handle: '.subtask-title',
      items: '.js-subtasks',
      placeholder: 'subtasks placeholder',
      distance: 7,
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
      },
      stop(evt, ui) {
        let prevChecklist = ui.item.prev('.js-subtasks').get(0);
        if (prevChecklist) {
          prevChecklist = Blaze.getData(prevChecklist).subtask;
        }
        let nextChecklist = ui.item.next('.js-subtasks').get(0);
        if (nextChecklist) {
          nextChecklist = Blaze.getData(nextChecklist).subtask;
        }
        const sortIndex = calculateIndexData(prevChecklist, nextChecklist, 1);

        $subtasksDom.sortable('cancel');
        const subtask = Blaze.getData(ui.item.get(0)).subtask;

        Subtasks.update(subtask._id, {
          $set: {
            subtaskSort: sortIndex.base,
          },
        });
      },
    });

    function userIsMember() {
      return Meteor.user() && Meteor.user().isBoardMember();
    }

    // Disable sorting if the current user is not a board member
    this.autorun(() => {
      if ($checklistsDom.data('sortable')) {
        $checklistsDom.sortable('option', 'disabled', !userIsMember());
      }
      if ($subtasksDom.data('sortable')) {
        $subtasksDom.sortable('option', 'disabled', !userIsMember());
      }
    });
  },

  onDestroyed() {
    const parentComponent =  this.parentComponent().parentComponent();
    //on mobile view parent is Board, not board body.
    if (parentComponent === null) return;
    parentComponent.showOverlay.set(false);
  },

  events() {
    const events = {
      [`${CSSEvents.transitionend} .js-card-details`]() {
        this.isLoaded.set(true);
      },
      [`${CSSEvents.animationend} .js-card-details`]() {
        this.isLoaded.set(true);
      },
    };

    return [{
      ...events,
      'click .js-close-card-details' () {
        Utils.goBoardId(this.data().boardId);
      },
      'click .js-open-card-details-menu': Popup.open('cardDetailsActions'),
      'submit .js-card-description' (evt) {
        evt.preventDefault();
        const description = this.currentComponent().getValue();
        this.data().setDescription(description);
      },
      'submit .js-card-details-title' (evt) {
        evt.preventDefault();
        const title = this.currentComponent().getValue().trim();
        if (title) {
          this.data().setTitle(title);
        }
      },
      'submit .js-card-details-assigner'(evt) {
        evt.preventDefault();
        const assigner = this.currentComponent().getValue().trim();
        if (assigner) {
          this.data().setAssignedBy(assigner);
        }
      },
      'submit .js-card-details-requester'(evt) {
        evt.preventDefault();
        const requester = this.currentComponent().getValue().trim();
        if (requester) {
          this.data().setRequestedBy(requester);
        }
      },
      'click .js-member': Popup.open('cardMember'),
      'click .js-add-members': Popup.open('cardMembers'),
      'click .js-add-labels': Popup.open('cardLabels'),
      'click .js-received-date': Popup.open('editCardReceivedDate'),
      'click .js-start-date': Popup.open('editCardStartDate'),
      'click .js-due-date': Popup.open('editCardDueDate'),
      'click .js-end-date': Popup.open('editCardEndDate'),
      'mouseenter .js-card-details' () {
        const parentComponent =  this.parentComponent().parentComponent();
        //on mobile view parent is Board, not BoardBody.
        if (parentComponent === null) return;
        parentComponent.showOverlay.set(true);
        parentComponent.mouseHasEnterCardDetails = true;
      },
      'click #toggleButton'() {
        Meteor.call('toggleSystemMessages');
      },
    }];
  },
}).register('cardDetails');

// We extends the normal InlinedForm component to support UnsavedEdits draft
// feature.
(class extends InlinedForm {
  _getUnsavedEditKey() {
    return {
      fieldName: 'cardDescription',
      // XXX Recovering the currentCard identifier form a session variable is
      // fragile because this variable may change for instance if the route
      // change. We should use some component props instead.
      docId: Session.get('currentCard'),
    };
  }

  close(isReset = false) {
    if (this.isOpen.get() && !isReset) {
      const draft = this.getValue().trim();
      if (draft !== Cards.findOne(Session.get('currentCard')).description) {
        UnsavedEdits.set(this._getUnsavedEditKey(), this.getValue());
      }
    }
    super.close();
  }

  reset() {
    UnsavedEdits.reset(this._getUnsavedEditKey());
    this.close(true);
  }

  events() {
    const parentEvents = InlinedForm.prototype.events()[0];
    return [{
      ...parentEvents,
      'click .js-close-inlined-form': this.reset,
    }];
  }
}).register('inlinedCardDescription');

Template.cardDetailsActionsPopup.helpers({
  isWatching() {
    return this.findWatcher(Meteor.userId());
  },

  canModifyCard() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },
});

Template.cardDetailsActionsPopup.events({
  'click .js-members': Popup.open('cardMembers'),
  'click .js-labels': Popup.open('cardLabels'),
  'click .js-attachments': Popup.open('cardAttachments'),
  'click .js-custom-fields': Popup.open('cardCustomFields'),
  'click .js-received-date': Popup.open('editCardReceivedDate'),
  'click .js-start-date': Popup.open('editCardStartDate'),
  'click .js-due-date': Popup.open('editCardDueDate'),
  'click .js-end-date': Popup.open('editCardEndDate'),
  'click .js-spent-time': Popup.open('editCardSpentTime'),
  'click .js-move-card': Popup.open('moveCard'),
  'click .js-copy-card': Popup.open('copyCard'),
  'click .js-copy-checklist-cards': Popup.open('copyChecklistToManyCards'),
  'click .js-move-card-to-top' (evt) {
    evt.preventDefault();
    const minOrder = _.min(this.list().cards(this.swimlaneId).map((c) => c.sort));
    this.move(this.swimlaneId, this.listId, minOrder - 1);
  },
  'click .js-move-card-to-bottom' (evt) {
    evt.preventDefault();
    const maxOrder = _.max(this.list().cards(this.swimlaneId).map((c) => c.sort));
    this.move(this.swimlaneId, this.listId, maxOrder + 1);
  },
  'click .js-archive' (evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
  'click .js-more': Popup.open('cardMore'),
  'click .js-toggle-watch-card' () {
    const currentCard = this;
    const level = currentCard.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'card', currentCard._id, level, (err, ret) => {
      if (!err && ret) Popup.close();
    });
  },
});

Template.editCardTitleForm.onRendered(function () {
  autosize(this.$('.js-edit-card-title'));
});

Template.editCardTitleForm.events({
  'keydown .js-edit-card-title' (evt) {
    // If enter key was pressed, submit the data
    // Unless the shift key is also being pressed
    if (evt.keyCode === 13 && !evt.shiftKey) {
      $('.js-submit-edit-card-title-form').click();
    }
  },
});

Template.editCardRequesterForm.onRendered(function() {
  autosize(this.$('.js-edit-card-requester'));
});

Template.editCardRequesterForm.events({
  'keydown .js-edit-card-requester'(evt) {
    // If enter key was pressed, submit the data
    if (evt.keyCode === 13) {
      $('.js-submit-edit-card-requester-form').click();
    }
  },
});

Template.editCardAssignerForm.onRendered(function() {
  autosize(this.$('.js-edit-card-assigner'));
});

Template.editCardAssignerForm.events({
  'keydown .js-edit-card-assigner'(evt) {
    // If enter key was pressed, submit the data
    if (evt.keyCode === 13) {
      $('.js-submit-edit-card-assigner-form').click();
    }
  },
});

Template.moveCardPopup.events({
  'click .js-done' () {
    // XXX We should *not* get the currentCard from the global state, but
    // instead from a “component” state.
    const card = Cards.findOne(Session.get('currentCard'));
    const lSelect = $('.js-select-lists')[0];
    const newListId = lSelect.options[lSelect.selectedIndex].value;
    const slSelect = $('.js-select-swimlanes')[0];
    card.swimlaneId = slSelect.options[slSelect.selectedIndex].value;
    card.move(card.swimlaneId, newListId, 0);
    Popup.close();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    subManager.subscribe('board', Session.get('currentBoard'));
    this.selectedBoardId = new ReactiveVar(Session.get('currentBoard'));
  },

  boards() {
    const boards = Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
    }, {
      sort: ['title'],
    });
    return boards;
  },

  swimlanes() {
    const board = Boards.findOne(this.selectedBoardId.get());
    return board.swimlanes();
  },

  aBoardLists() {
    const board = Boards.findOne(this.selectedBoardId.get());
    return board.lists();
  },

  events() {
    return [{
      'change .js-select-boards'(evt) {
        this.selectedBoardId.set($(evt.currentTarget).val());
        subManager.subscribe('board', this.selectedBoardId.get());
      },
    }];
  },
}).register('boardsAndLists');

function cloneCheckList(_id, checklist) {
  'use strict';
  const checklistId = checklist._id;
  checklist.cardId = _id;
  checklist._id = null;
  const newChecklistId = Checklists.insert(checklist);
  ChecklistItems.find({checklistId}).forEach(function(item) {
    item._id = null;
    item.checklistId = newChecklistId;
    item.cardId = _id;
    ChecklistItems.insert(item);
  });
}

Template.copyCardPopup.events({
  'click .js-done'() {
    const card = Cards.findOne(Session.get('currentCard'));
    const oldId = card._id;
    card._id = null;
    const lSelect = $('.js-select-lists')[0];
    card.listId = lSelect.options[lSelect.selectedIndex].value;
    const slSelect = $('.js-select-swimlanes')[0];
    card.swimlaneId = slSelect.options[slSelect.selectedIndex].value;
    const bSelect = $('.js-select-boards')[0];
    card.boardId = bSelect.options[bSelect.selectedIndex].value;
    const textarea = $('#copy-card-title');
    const title = textarea.val().trim();
    // insert new card to the bottom of new list
    card.sort = Lists.findOne(card.listId).cards().count();

    if (title) {
      card.title = title;
      card.coverId = '';
      const _id = Cards.insert(card);
      // In case the filter is active we need to add the newly inserted card in
      // the list of exceptions -- cards that are not filtered. Otherwise the
      // card will disappear instantly.
      // See https://github.com/wekan/wekan/issues/80
      Filter.addException(_id);

      // copy checklists
      let cursor = Checklists.find({cardId: oldId});
      cursor.forEach(function() {
        cloneCheckList(_id, arguments[0]);
      });

      // copy subtasks
      cursor = Cards.find({parentId: oldId});
      cursor.forEach(function() {
        'use strict';
        const subtask = arguments[0];
        subtask.parentId = _id;
        subtask._id = null;
        /* const newSubtaskId = */ Cards.insert(subtask);
      });

      // copy card comments
      cursor = CardComments.find({cardId: oldId});
      cursor.forEach(function () {
        'use strict';
        const comment = arguments[0];
        comment.cardId = _id;
        comment._id = null;
        CardComments.insert(comment);
      });
      Popup.close();
    }
  },
});

Template.copyChecklistToManyCardsPopup.events({
  'click .js-done' () {
    const card = Cards.findOne(Session.get('currentCard'));
    const oldId = card._id;
    card._id = null;
    const lSelect = $('.js-select-lists')[0];
    card.listId = lSelect.options[lSelect.selectedIndex].value;
    const slSelect = $('.js-select-swimlanes')[0];
    card.swimlaneId = slSelect.options[slSelect.selectedIndex].value;
    const bSelect = $('.js-select-boards')[0];
    card.boardId = bSelect.options[bSelect.selectedIndex].value;
    const textarea = $('#copy-card-title');
    const titleEntry = textarea.val().trim();
    // insert new card to the bottom of new list
    card.sort = Lists.findOne(card.listId).cards().count();

    if (titleEntry) {
      const titleList = JSON.parse(titleEntry);
      for (let i = 0; i < titleList.length; i++){
        const obj = titleList[i];
        card.title = obj.title;
        card.description = obj.description;
        card.coverId = '';
        const _id = Cards.insert(card);
        // In case the filter is active we need to add the newly inserted card in
        // the list of exceptions -- cards that are not filtered. Otherwise the
        // card will disappear instantly.
        // See https://github.com/wekan/wekan/issues/80
        Filter.addException(_id);

        // copy checklists
        let cursor = Checklists.find({cardId: oldId});
        cursor.forEach(function() {
          cloneCheckList(_id, arguments[0]);
        });

        // copy subtasks
        cursor = Cards.find({parentId: oldId});
        cursor.forEach(function() {
          'use strict';
          const subtask = arguments[0];
          subtask.parentId = _id;
          subtask._id = null;
          /* const newSubtaskId = */ Cards.insert(subtask);
        });

        // copy card comments
        cursor = CardComments.find({cardId: oldId});
        cursor.forEach(function () {
          'use strict';
          const comment = arguments[0];
          comment.cardId = _id;
          comment._id = null;
          CardComments.insert(comment);
        });
      }
      Popup.close();
    }
  },
});


Template.cardMorePopup.events({
  'click .js-copy-card-link-to-clipboard' () {
    // Clipboard code from:
    // https://stackoverflow.com/questions/6300213/copy-selected-text-to-the-clipboard-without-using-flash-must-be-cross-browser
    const StringToCopyElement = document.getElementById('cardURL');
    StringToCopyElement.select();
    if (document.execCommand('copy')) {
      StringToCopyElement.blur();
    } else {
      document.getElementById('cardURL').selectionStart = 0;
      document.getElementById('cardURL').selectionEnd = 999;
      document.execCommand('copy');
      if (window.getSelection) {
        if (window.getSelection().empty) { // Chrome
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) { // Firefox
          window.getSelection().removeAllRanges();
        }
      } else if (document.selection) { // IE?
        document.selection.empty();
      }
    }
  },
  'click .js-delete': Popup.afterConfirm('cardDelete', function () {
    Popup.close();
    Cards.remove(this._id);
    Utils.goBoardId(this.boardId);
  }),
});

// Close the card details pane by pressing escape
EscapeActions.register('detailsPane',
  () => {
    Utils.goBoardId(Session.get('currentBoard'));
  },
  () => {
    return !Session.equals('currentCard', null);
  }, {
    noClickEscapeOn: '.js-card-details,.board-sidebar,#header',
  }
);

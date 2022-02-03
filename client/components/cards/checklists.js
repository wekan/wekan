import Cards from '/models/cards';
import Boards from '/models/boards';

const subManager = new SubsManager();
const { calculateIndexData, capitalize } = Utils;

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

BlazeComponent.extendComponent({
  onRendered() {
    const self = this;
    self.itemsDom = this.$('.js-checklist-items');
    initSorting(self.itemsDom);
    self.itemsDom.mousedown(function(evt) {
      evt.stopPropagation();
    });

    function userIsMember() {
      return Meteor.user() && Meteor.user().isBoardMember();
    }

    // Disable sorting if the current user is not a board member
    self.autorun(() => {
      const $itemsDom = $(self.itemsDom);
      if ($itemsDom.data('uiSortable') || $itemsDom.data('sortable')) {
        $(self.itemsDom).sortable('option', 'disabled', !userIsMember());
        if (Utils.isMiniScreenOrShowDesktopDragHandles()) {
          $(self.itemsDom).sortable({
            handle: 'span.fa.checklistitem-handle',
          });
        }
      }
    });
  },

  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },

  /** returns the finished percent of the checklist */
  finishedPercent() {
    const ret = this.data().checklist.finishedPercent();
    return ret;
  },
}).register('checklistDetail');

BlazeComponent.extendComponent({
  addChecklist(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const title = textarea.value.trim();
    let cardId = this.currentData().cardId;
    const card = Cards.findOne(cardId);
    //if (card.isLinked()) cardId = card.linkedId;
    if (card.isLinkedCard()) cardId = card.linkedId;

    if (title) {
      Checklists.insert({
        cardId,
        title,
        sort: card.checklists().count(),
      });
      this.closeAllInlinedForms();
      setTimeout(() => {
        this.$('.add-checklist-item')
          .last()
          .click();
      }, 100);
    }
  },
  addChecklistItem(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-add-checklist-item');
    const newlineBecomesNewChecklistItem = this.find('input#toggleNewlineBecomesNewChecklistItem');
    const title = textarea.value.trim();
    const checklist = this.currentData().checklist;

    if (title) {
      let checklistItems = [title];
      if (newlineBecomesNewChecklistItem.checked) {
        checklistItems = title.split('\n').map(_value => _value.trim());
      }
      for (let checklistItem of checklistItems) {
        ChecklistItems.insert({
          title: checklistItem,
          checklistId: checklist._id,
          cardId: checklist.cardId,
          sort: Utils.calculateIndexData(checklist.lastItem()).base,
        });
      }
    }
    // We keep the form opened, empty it.
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

  deleteItem() {
    const checklist = this.currentData().checklist;
    const item = this.currentData().item;
    if (checklist && item && item._id) {
      ChecklistItems.remove(item._id);
    }
  },

  editChecklist(event) {
    event.preventDefault();
    const textarea = this.find('textarea.js-edit-checklist-item');
    const title = textarea.value.trim();
    const checklist = this.currentData().checklist;
    checklist.setTitle(title);
  },

  editChecklistItem(event) {
    event.preventDefault();

    const textarea = this.find('textarea.js-edit-checklist-item');
    const title = textarea.value.trim();
    const item = this.currentData().item;
    item.setTitle(title);
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

  focusChecklistItem(event) {
    // If a new checklist is created, pre-fill the title and select it.
    const checklist = this.currentData().checklist;
    if (!checklist) {
      const textarea = event.target;
      textarea.value = capitalize(TAPi18n.__('r-checklist'));
      textarea.select();
    }
  },

  /** closes all inlined forms (checklist and checklist-item input fields) */
  closeAllInlinedForms() {
    this.$('.js-close-inlined-form').click();
  },

  events() {
    const events = {
      'click #toggleHideCheckedItemsButton'() {
        Meteor.call('toggleHideCheckedItems');
      },
    };

    return [
      {
        ...events,
        'click .js-open-checklist-details-menu': Popup.open('checklistActions'),
        'submit .js-add-checklist': this.addChecklist,
        'submit .js-edit-checklist-title': this.editChecklist,
        'submit .js-add-checklist-item': this.addChecklistItem,
        'submit .js-edit-checklist-item': this.editChecklistItem,
        'click .js-convert-checklist-item-to-card': Popup.open('convertChecklistItemToCard'),
        'click .js-delete-checklist-item': this.deleteItem,
        'focus .js-add-checklist-item': this.focusChecklistItem,
        // add and delete checklist / checklist-item
        'click .js-open-inlined-form': this.closeAllInlinedForms,
        keydown: this.pressKey,
      },
    ];
  },
}).register('checklists');

BlazeComponent.extendComponent({
  onCreated() {
    subManager.subscribe('board', Session.get('currentBoard'), false);
    this.selectedBoardId = new ReactiveVar(Session.get('currentBoard'));
  },

  boards() {
    return Boards.find(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: Meteor.user().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
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
    return [
      {
        'change .js-select-boards'(event) {
          this.selectedBoardId.set($(event.currentTarget).val());
          subManager.subscribe('board', this.selectedBoardId.get(), false);
        },
      },
    ];
  },
}).register('boardsSwimlanesAndLists');

Template.checklists.helpers({
  checklists() {
    const card = Cards.findOne(this.cardId);
    const ret = card.checklists();
    return ret;
  },
  hideCheckedItems() {
    const currentUser = Meteor.user();
    if (currentUser) return currentUser.hasHideCheckedItems();
    return false;
  },
});

BlazeComponent.extendComponent({
  onRendered() {
    autosize(this.$('textarea.js-add-checklist-item'));
  },
  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },
  events() {
    return [
      {
        'click a.fa.fa-copy'(event) {
          const $editor = this.$('textarea');
          const promise = Utils.copyTextToClipboard($editor[0].value);

          const $tooltip = this.$('.copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
      }
    ];
  }
}).register('addChecklistItemForm');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'click .js-delete-checklist' : Popup.afterConfirm('checklistDelete', function () {
          Popup.back(2);
          const checklist = this.checklist;
          if (checklist && checklist._id) {
            Checklists.remove(checklist._id);
          }
        }),
        'click .js-move-checklist' : Popup.open('moveChecklist'),
        'click .js-copy-checklist' : Popup.open('copyChecklist'),
      }
    ]
  }
}).register('checklistActionsPopup');

BlazeComponent.extendComponent({
  onRendered() {
    autosize(this.$('textarea.js-edit-checklist-item'));
  },
  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },
  events() {
    return [
      {
        'click a.fa.fa-copy'(event) {
          const $editor = this.$('textarea');
          const promise = Utils.copyTextToClipboard($editor[0].value);

          const $tooltip = this.$('.copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
      }
    ];
  }
}).register('editChecklistItemForm');

Template.checklistItemDetail.helpers({
  canModifyCard() {
    return (
      Meteor.user() &&
      Meteor.user().isBoardMember() &&
      !Meteor.user().isCommentOnly() &&
      !Meteor.user().isWorker()
    );
  },
  hideCheckedItems() {
    const user = Meteor.user();
    if (user) return user.hasHideCheckedItems();
    return false;
  },
});

BlazeComponent.extendComponent({
  toggleItem() {
    const checklist = this.currentData().checklist;
    const item = this.currentData().item;
    if (checklist && item && item._id) {
      item.toggleItem();
    }
  },
  events() {
    return [
      {
        'click .js-checklist-item .check-box-container': this.toggleItem,
      },
    ];
  },
}).register('checklistItemDetail');

class DialogWithBoardSwimlaneListAndCard extends BlazeComponent {
  /** returns the checklist dialog options
   * @return Object with properties { boardId, swimlaneId, listId, cardId }
   */
  getChecklistDialogOptions() {
  }

  /** checklist is done
   * @param cardId the selected card id
   * @param options the selected options (Object with properties { boardId, swimlaneId, listId, cardId })
   */
  setDone(cardId, options) {
  }

  onCreated() {
    this.currentBoardId = Utils.getCurrentBoardId();
    this.selectedBoardId = new ReactiveVar(this.currentBoardId);
    this.selectedSwimlaneId = new ReactiveVar('');
    this.selectedListId = new ReactiveVar('');
    this.setChecklistDialogOption(this.currentBoardId);
  }

  /** set the last confirmed dialog field values
   * @param boardId the current board id
   */
  setChecklistDialogOption(boardId) {
    this.checklistDialogOption = {
      'boardId' : "",
      'swimlaneId' : "",
      'listId' : "",
      'cardId': "",
    }

    let currentOptions = this.getChecklistDialogOptions();
    if (currentOptions && boardId && currentOptions[boardId]) {
      this.checklistDialogOption = currentOptions[boardId];
      if (this.checklistDialogOption.boardId &&
          this.checklistDialogOption.swimlaneId &&
          this.checklistDialogOption.listId
      )
      {
        this.selectedBoardId.set(this.checklistDialogOption.boardId)
        this.selectedSwimlaneId.set(this.checklistDialogOption.swimlaneId);
        this.selectedListId.set(this.checklistDialogOption.listId);
      }
    }
    this.getBoardData(this.selectedBoardId.get());
    if (!this.selectedSwimlaneId.get() || !Swimlanes.findOne({_id: this.selectedSwimlaneId.get(), boardId: this.selectedBoardId.get()})) {
      this.setFirstSwimlaneId();
    }
    if (!this.selectedListId.get() || !Lists.findOne({_id: this.selectedListId.get(), boardId: this.selectedBoardId.get()})) {
      this.setFirstListId();
    }
  }
  /** sets the first swimlane id */
  setFirstSwimlaneId() {
    try {
      const board = Boards.findOne(this.selectedBoardId.get());
      const swimlaneId = board.swimlanes().fetch()[0]._id;
      this.selectedSwimlaneId.set(swimlaneId);
    } catch (e) {}
  }
  /** sets the first list id */
  setFirstListId() {
    try {
      const board = Boards.findOne(this.selectedBoardId.get());
      const listId = board.lists().fetch()[0]._id;
      this.selectedListId.set(listId);
    } catch (e) {}
  }

  /** returns if the board id was the last confirmed one
   * @param boardId check this board id
   * @return if the board id was the last confirmed one
   */
  isChecklistDialogOptionBoardId(boardId) {
    let ret = this.checklistDialogOption.boardId == boardId;
    return ret;
  }

  /** returns if the swimlane id was the last confirmed one
   * @param swimlaneId check this swimlane id
   * @return if the swimlane id was the last confirmed one
   */
  isChecklistDialogOptionSwimlaneId(swimlaneId) {
    let ret = this.checklistDialogOption.swimlaneId == swimlaneId;
    return ret;
  }

  /** returns if the list id was the last confirmed one
   * @param listId check this list id
   * @return if the list id was the last confirmed one
   */
  isChecklistDialogOptionListId(listId) {
    let ret = this.checklistDialogOption.listId == listId;
    return ret;
  }

  /** returns if the card id was the last confirmed one
   * @param cardId check this card id
   * @return if the card id was the last confirmed one
   */
  isChecklistDialogOptionCardId(cardId) {
    let ret = this.checklistDialogOption.cardId == cardId;
    return ret;
  }

  /** returns all available board */
  boards() {
    const ret = Boards.find(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: Meteor.user().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 },
      },
    );
    return ret;
  }

  /** returns all available swimlanes of the current board */
  swimlanes() {
    const board = Boards.findOne(this.selectedBoardId.get());
    const ret = board.swimlanes();
    return ret;
  }

  /** returns all available lists of the current board */
  lists() {
    const board = Boards.findOne(this.selectedBoardId.get());
    const ret = board.lists();
    return ret;
  }

  /** returns all available cards of the current list */
  cards() {
    const list = Lists.findOne(this.selectedListId.get());
    const ret = list.cards(this.selectedSwimlaneId.get());
    return ret;
  }

  /** get the board data from the server
   * @param boardId get the board data of this board id
   */
  getBoardData(boardId) {
    const self = this;
    Meteor.subscribe('board', boardId, false, {
      onReady() {
        const sameBoardId = self.selectedBoardId.get() == boardId;
        self.selectedBoardId.set(boardId);

        if (!sameBoardId) {
          // reset swimlane id (for selection in cards())
          self.setFirstSwimlaneId();

          // reset list id (for selection in cards())
          self.setFirstListId();
        }
      },
    });
  }

  events() {
    return [
      {
        'click .js-done'() {
          const boardSelect = this.$('.js-select-boards')[0];
          const boardId = boardSelect.options[boardSelect.selectedIndex].value;

          const listSelect = this.$('.js-select-lists')[0];
          const listId = listSelect.options[listSelect.selectedIndex].value;

          const swimlaneSelect = this.$('.js-select-swimlanes')[0];
          const swimlaneId = swimlaneSelect.options[swimlaneSelect.selectedIndex].value;

          const cardSelect = this.$('.js-select-cards')[0];
          const cardId = cardSelect.options[cardSelect.selectedIndex].value;

          const options = {
            'boardId' : boardId,
            'swimlaneId' : swimlaneId,
            'listId' : listId,
            'cardId': cardId,
          }
          this.setDone(cardId, options);
          Popup.back(2);
        },
        'change .js-select-boards'(event) {
          const boardId = $(event.currentTarget).val();
          this.getBoardData(boardId);
        },
        'change .js-select-swimlanes'(event) {
          this.selectedSwimlaneId.set($(event.currentTarget).val());
        },
        'change .js-select-lists'(event) {
          this.selectedListId.set($(event.currentTarget).val());
        },
      },
    ];
  }
}

/** Move Checklist Dialog */
(class extends DialogWithBoardSwimlaneListAndCard {
  getChecklistDialogOptions() {
    const ret = Meteor.user().getMoveChecklistDialogOptions();
    return ret;
  }
  setDone(cardId, options) {
    Meteor.user().setMoveChecklistDialogOption(this.currentBoardId, options);
    this.data().checklist.move(cardId);
  }
}).register('moveChecklistPopup');

/** Copy Checklist Dialog */
(class extends DialogWithBoardSwimlaneListAndCard {
  getChecklistDialogOptions() {
    const ret = Meteor.user().getCopyChecklistDialogOptions();
    return ret;
  }
  setDone(cardId, options) {
    Meteor.user().setCopyChecklistDialogOption(this.currentBoardId, options);
    this.data().checklist.copy(cardId);
  }
}).register('copyChecklistPopup');

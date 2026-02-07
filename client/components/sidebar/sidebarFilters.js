import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

const subManager = new SubsManager();

BlazeComponent.extendComponent({
  events() {
    return [
      {
        'submit .js-list-filter'(evt) {
          evt.preventDefault();
          Filter.lists.set(this.find('.js-list-filter input').value.trim());
        },
        'change .js-field-card-filter'(evt) {
          evt.preventDefault();
          Filter.title.set(this.find('.js-field-card-filter').value.trim());
          Filter.resetExceptions();
        },
        'click .js-toggle-label-filter'(evt) {
          evt.preventDefault();
          Filter.labelIds.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-member-filter'(evt) {
          evt.preventDefault();
          Filter.members.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-assignee-filter'(evt) {
          evt.preventDefault();
          Filter.assignees.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-no-due-date-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.noDate();
          Filter.resetExceptions();
        },
        'click .js-toggle-overdue-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.past();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-today-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.today();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-tomorrow-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.tomorrow();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-this-week-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.thisWeek();
          Filter.resetExceptions();
        },
        'click .js-toggle-due-next-week-filter'(evt) {
          evt.preventDefault();
          Filter.dueAt.nextWeek();
          Filter.resetExceptions();
        },
        'click .js-toggle-archive-filter'(evt) {
          evt.preventDefault();
          Filter.archive.toggle(this.currentData()._id);
          Filter.resetExceptions();
          const currentBoardId = Session.get('currentBoard');
          if (!currentBoardId) return;
          subManager.subscribe(
            'board',
            currentBoardId,
            Filter.archive.isSelected(),
          );
        },
        'click .js-toggle-hideEmpty-filter'(evt) {
          evt.preventDefault();
          Filter.hideEmpty.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'click .js-toggle-custom-fields-filter'(evt) {
          evt.preventDefault();
          Filter.customFields.toggle(this.currentData()._id);
          Filter.resetExceptions();
        },
        'change .js-field-advanced-filter'(evt) {
          evt.preventDefault();
          Filter.advanced.set(
            this.find('.js-field-advanced-filter').value.trim(),
          );
          Filter.resetExceptions();
        },
        'click .js-clear-all'(evt) {
          evt.preventDefault();
          Filter.reset();
        },
        'click .js-filter-to-selection'(evt) {
          evt.preventDefault();
          const selectedCards = ReactiveCache.getCards(Filter.mongoSelector()).map(c => {
            return c._id;
          });
          MultiSelection.add(selectedCards);
        },
      },
    ];
  },
}).register('filterSidebar');

async function mutateSelectedCards(mutationNameOrCallback, ...args) {
  const cards = ReactiveCache.getCards(MultiSelection.getMongoSelector(), {sort: ['sort']});
  for (const card of cards) {
    if (typeof mutationNameOrCallback === 'function') {
      await mutationNameOrCallback(card);
    } else {
      await card[mutationNameOrCallback](...args);
    }
  }
}

BlazeComponent.extendComponent({
  mapSelection(kind, _id) {
    return ReactiveCache.getCards(MultiSelection.getMongoSelector(), {sort: ['sort']}).map(card => {
      const methodName = kind === 'label' ? 'hasLabel' : 'isAssigned';
      return card[methodName](_id);
    });
  },

  allSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty()) return false;
    else return _.every(this.mapSelection(kind, _id));
  },

  someSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty()) return false;
    else return _.some(this.mapSelection(kind, _id));
  },

  events() {
    return [
      {
        'click .js-toggle-label-multiselection'(evt) {
          const labelId = this.currentData()._id;
          const mappedSelection = this.mapSelection('label', labelId);

          if (_.every(mappedSelection)) {
            mutateSelectedCards('removeLabel', labelId);
          } else if (_.every(mappedSelection, bool => !bool)) {
            mutateSelectedCards('addLabel', labelId);
          } else {
            const popup = Popup.open('disambiguateMultiLabel');
            // XXX We need to have a better integration between the popup and the
            // UI components systems.
            popup.call(this.currentData(), evt);
          }
        },
        'click .js-toggle-member-multiselection'(evt) {
          const memberId = this.currentData()._id;
          const mappedSelection = this.mapSelection('member', memberId);
          if (_.every(mappedSelection)) {
            mutateSelectedCards('unassignMember', memberId);
          } else if (_.every(mappedSelection, bool => !bool)) {
            mutateSelectedCards('assignMember', memberId);
          } else {
            const popup = Popup.open('disambiguateMultiMember');
            // XXX We need to have a better integration between the popup and the
            // UI components systems.
            popup.call(this.currentData(), evt);
          }
        },
        'click .js-move-selection': Popup.open('moveSelection'),
        'click .js-copy-selection': Popup.open('copySelection'),
        'click .js-selection-color': Popup.open('setSelectionColor'),
        'click .js-archive-selection'() {
          mutateSelectedCards('archive');
          EscapeActions.executeUpTo('multiselection');
        },
      },
    ];
  },
}).register('multiselectionSidebar');

Template.multiselectionSidebar.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  isCommentOnly() {
    return ReactiveCache.getCurrentUser().isCommentOnly();
  },
});

Template.disambiguateMultiLabelPopup.events({
  'click .js-remove-label'() {
    mutateSelectedCards('removeLabel', this._id);
    Popup.back();
  },
  'click .js-add-label'() {
    mutateSelectedCards('addLabel', this._id);
    Popup.back();
  },
});

Template.disambiguateMultiMemberPopup.events({
  'click .js-unassign-member'() {
    mutateSelectedCards('assignMember', this._id);
    Popup.back();
  },
  'click .js-assign-member'() {
    mutateSelectedCards('unassignMember', this._id);
    Popup.back();
  },
});

Template.moveSelectionPopup.onCreated(function() {
  this.selectedBoardId = new ReactiveVar(Session.get('currentBoard'));
  this.selectedSwimlaneId = new ReactiveVar('');
  this.selectedListId = new ReactiveVar('');
  this.selectedCardId = new ReactiveVar('');
  this.position = new ReactiveVar('above');

  this.getBoardData = function(boardId) {
    const self = this;
    Meteor.subscribe('board', boardId, false, {
      onReady() {
        const sameBoardId = self.selectedBoardId.get() === boardId;
        self.selectedBoardId.set(boardId);

        if (!sameBoardId) {
          self.setFirstSwimlaneId();
          self.setFirstListId();
        }
      },
    });
  };

  this.setFirstSwimlaneId = function() {
    try {
      const board = ReactiveCache.getBoard(this.selectedBoardId.get());
      const swimlaneId = board.swimlanes()[0]._id;
      this.selectedSwimlaneId.set(swimlaneId);
    } catch (e) {}
  };

  this.setFirstListId = function() {
    try {
      const board = ReactiveCache.getBoard(this.selectedBoardId.get());
      const listId = board.lists()[0]._id;
      this.selectedListId.set(listId);
    } catch (e) {}
  };

  this.getBoardData(Session.get('currentBoard'));
  this.setFirstSwimlaneId();
  this.setFirstListId();
});

Template.moveSelectionPopup.helpers({
  boards() {
    return ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 },
      },
    );
  },
  swimlanes() {
    const board = ReactiveCache.getBoard(Template.instance().selectedBoardId.get());
    return board ? board.swimlanes() : [];
  },
  lists() {
    const board = ReactiveCache.getBoard(Template.instance().selectedBoardId.get());
    return board ? board.lists() : [];
  },
  cards() {
    const instance = Template.instance();
    const list = ReactiveCache.getList(instance.selectedListId.get());
    if (!list) return [];
    return list.cards(instance.selectedSwimlaneId.get()).sort((a, b) => a.sort - b.sort);
  },
  isDialogOptionBoardId(boardId) {
    return Template.instance().selectedBoardId.get() === boardId;
  },
  isDialogOptionSwimlaneId(swimlaneId) {
    return Template.instance().selectedSwimlaneId.get() === swimlaneId;
  },
  isDialogOptionListId(listId) {
    return Template.instance().selectedListId.get() === listId;
  },
  isTitleDefault(title) {
    if (
      title.startsWith("key 'default") &&
      title.endsWith('returned an object instead of string.')
    ) {
      const translated = `${TAPi18n.__('defaultdefault')}`;
      if (
        translated.startsWith("key 'default") &&
        translated.endsWith('returned an object instead of string.')
      ) {
        return 'Default';
      }
      return translated;
    }
    if (title === 'Default') {
      return `${TAPi18n.__('defaultdefault')}`;
    }
    return title;
  },
});

Template.moveSelectionPopup.events({
  'change .js-select-boards'(event) {
    const boardId = $(event.currentTarget).val();
    Template.instance().getBoardData(boardId);
  },
  'change .js-select-swimlanes'(event) {
    Template.instance().selectedSwimlaneId.set($(event.currentTarget).val());
  },
  'change .js-select-lists'(event) {
    Template.instance().selectedListId.set($(event.currentTarget).val());
  },
  'change .js-select-cards'(event) {
    Template.instance().selectedCardId.set($(event.currentTarget).val());
  },
  'change input[name="position"]'(event) {
    Template.instance().position.set($(event.currentTarget).val());
  },
  'click .js-done'() {
    const instance = Template.instance();
    const boardId = instance.selectedBoardId.get();
    const swimlaneId = instance.selectedSwimlaneId.get();
    const listId = instance.selectedListId.get();
    const cardId = instance.selectedCardId.get();
    const position = instance.position.get();

    // Calculate sortIndex
    let sortIndex = 0;
    if (cardId) {
      const targetCard = ReactiveCache.getCard(cardId);
      if (targetCard) {
        if (position === 'above') {
          sortIndex = targetCard.sort - 0.5;
        } else {
          sortIndex = targetCard.sort + 0.5;
        }
      }
    } else {
      // If no card selected, move to end
      const board = ReactiveCache.getBoard(boardId);
      const cards = board.cards({ swimlaneId, listId }).sort((a, b) => a.sort - b.sort);
      if (cards.length > 0) {
        sortIndex = cards[cards.length - 1].sort + 1;
      }
    }

    mutateSelectedCards('move', boardId, swimlaneId, listId, sortIndex);
    EscapeActions.executeUpTo('multiselection');
  },
});

Template.copySelectionPopup.onCreated(function() {
  this.selectedBoardId = new ReactiveVar(Session.get('currentBoard'));
  this.selectedSwimlaneId = new ReactiveVar('');
  this.selectedListId = new ReactiveVar('');
  this.selectedCardId = new ReactiveVar('');
  this.position = new ReactiveVar('above');

  this.getBoardData = function(boardId) {
    const self = this;
    Meteor.subscribe('board', boardId, false, {
      onReady() {
        const sameBoardId = self.selectedBoardId.get() === boardId;
        self.selectedBoardId.set(boardId);

        if (!sameBoardId) {
          self.setFirstSwimlaneId();
          self.setFirstListId();
        }
      },
    });
  };

  this.setFirstSwimlaneId = function() {
    try {
      const board = ReactiveCache.getBoard(this.selectedBoardId.get());
      const swimlaneId = board.swimlanes()[0]._id;
      this.selectedSwimlaneId.set(swimlaneId);
    } catch (e) {}
  };

  this.setFirstListId = function() {
    try {
      const board = ReactiveCache.getBoard(this.selectedBoardId.get());
      const listId = board.lists()[0]._id;
      this.selectedListId.set(listId);
    } catch (e) {}
  };

  this.getBoardData(Session.get('currentBoard'));
  this.setFirstSwimlaneId();
  this.setFirstListId();
});

Template.copySelectionPopup.helpers({
  boards() {
    return ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 },
      },
    );
  },
  swimlanes() {
    const board = ReactiveCache.getBoard(Template.instance().selectedBoardId.get());
    return board ? board.swimlanes() : [];
  },
  lists() {
    const board = ReactiveCache.getBoard(Template.instance().selectedBoardId.get());
    return board ? board.lists() : [];
  },
  cards() {
    const instance = Template.instance();
    const list = ReactiveCache.getList(instance.selectedListId.get());
    if (!list) return [];
    return list.cards(instance.selectedSwimlaneId.get()).sort((a, b) => a.sort - b.sort);
  },
  isDialogOptionBoardId(boardId) {
    return Template.instance().selectedBoardId.get() === boardId;
  },
  isDialogOptionSwimlaneId(swimlaneId) {
    return Template.instance().selectedSwimlaneId.get() === swimlaneId;
  },
  isDialogOptionListId(listId) {
    return Template.instance().selectedListId.get() === listId;
  },
  isTitleDefault(title) {
    if (
      title.startsWith("key 'default") &&
      title.endsWith('returned an object instead of string.')
    ) {
      const translated = `${TAPi18n.__('defaultdefault')}`;
      if (
        translated.startsWith("key 'default") &&
        translated.endsWith('returned an object instead of string.')
      ) {
        return 'Default';
      }
      return translated;
    }
    if (title === 'Default') {
      return `${TAPi18n.__('defaultdefault')}`;
    }
    return title;
  },
});

Template.copySelectionPopup.events({
  'change .js-select-boards'(event) {
    const boardId = $(event.currentTarget).val();
    Template.instance().getBoardData(boardId);
  },
  'change .js-select-swimlanes'(event) {
    Template.instance().selectedSwimlaneId.set($(event.currentTarget).val());
  },
  'change .js-select-lists'(event) {
    Template.instance().selectedListId.set($(event.currentTarget).val());
  },
  'change .js-select-cards'(event) {
    Template.instance().selectedCardId.set($(event.currentTarget).val());
  },
  'change input[name="position"]'(event) {
    Template.instance().position.set($(event.currentTarget).val());
  },
  'click .js-done'() {
    const instance = Template.instance();
    const boardId = instance.selectedBoardId.get();
    const swimlaneId = instance.selectedSwimlaneId.get();
    const listId = instance.selectedListId.get();
    const cardId = instance.selectedCardId.get();
    const position = instance.position.get();

    mutateSelectedCards(async (card) => {
      const newCardId = await Meteor.callAsync(
        'copyCard',
        card._id,
        boardId,
        swimlaneId,
        listId,
        true,
        { title: card.title },
      );
      if (!newCardId) return;

      const newCard = ReactiveCache.getCard(newCardId);
      if (!newCard) return;

      let sortIndex = 0;
      if (cardId) {
        const targetCard = ReactiveCache.getCard(cardId);
        if (targetCard) {
          if (position === 'above') {
            sortIndex = targetCard.sort - 0.5;
          } else {
            sortIndex = targetCard.sort + 0.5;
          }
        }
      } else {
        // To end
        const board = ReactiveCache.getBoard(boardId);
        const cards = board.cards({ swimlaneId, listId }).sort((a, b) => a.sort - b.sort);
        if (cards.length > 0) {
          sortIndex = cards[cards.length - 1].sort + 1;
        }
      }

      await newCard.move(boardId, swimlaneId, listId, sortIndex);
    });
    EscapeActions.executeUpTo('multiselection');
  },
});

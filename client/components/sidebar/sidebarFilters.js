import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Filter } from '/client/lib/filter';
import { EscapeActions } from '/client/lib/escapeActions';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';

// SubsManager removed for Meteor 3 migration

Template.filterSidebar.events({
  'submit .js-list-filter'(evt, tpl) {
    evt.preventDefault();
    Filter.lists.set(tpl.find('.js-list-filter input').value.trim());
  },
  'change .js-field-card-filter'(evt, tpl) {
    evt.preventDefault();
    Filter.title.set(tpl.find('.js-field-card-filter').value.trim());
    Filter.resetExceptions();
  },
  'click .js-toggle-label-filter'(evt) {
    evt.preventDefault();
    Filter.labelIds.toggle(Template.currentData()._id);
    Filter.resetExceptions();
  },
  'click .js-toggle-member-filter'(evt) {
    evt.preventDefault();
    Filter.members.toggle(Template.currentData()._id);
    Filter.resetExceptions();
  },
  'click .js-toggle-assignee-filter'(evt) {
    evt.preventDefault();
    Filter.assignees.toggle(Template.currentData()._id);
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
    Filter.archive.toggle(Template.currentData()._id);
    Filter.resetExceptions();
    const currentBoardId = Session.get('currentBoard');
    if (!currentBoardId) return;
    Meteor.subscribe(
      'board',
      currentBoardId,
      Filter.archive.isSelected(),
    );
  },
  'click .js-toggle-hideEmpty-filter'(evt) {
    evt.preventDefault();
    Filter.hideEmpty.toggle(Template.currentData()._id);
    Filter.resetExceptions();
  },
  'click .js-toggle-custom-fields-filter'(evt) {
    evt.preventDefault();
    Filter.customFields.toggle(Template.currentData()._id);
    Filter.resetExceptions();
  },
  'change .js-field-advanced-filter'(evt, tpl) {
    evt.preventDefault();
    Filter.advanced.set(
      tpl.find('.js-field-advanced-filter').value.trim(),
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
});

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

function getSelectedCardsSorted() {
  return ReactiveCache.getCards(MultiSelection.getMongoSelector(), { sort: ['sort'] });
}

function getListsForBoardSwimlane(boardId, swimlaneId) {
  if (!boardId) return [];
  const board = ReactiveCache.getBoard(boardId);
  if (!board) return [];

  const selector = {
    boardId,
    archived: false,
  };

  if (swimlaneId) {
    const defaultSwimlane = board.getDefaultSwimline && board.getDefaultSwimline();
    if (defaultSwimlane && defaultSwimlane._id === swimlaneId) {
      selector.swimlaneId = { $in: [swimlaneId, null, ''] };
    } else {
      selector.swimlaneId = swimlaneId;
    }
  }

  return ReactiveCache.getLists(selector, { sort: { sort: 1 } });
}

function getMaxSortForList(listId, swimlaneId) {
  if (!listId || !swimlaneId) return null;
  const card = ReactiveCache.getCard(
    { listId, swimlaneId, archived: false },
    { sort: { sort: -1 } },
    true,
  );
  return card ? card.sort : null;
}

function buildInsertionSortIndexes(cardsCount, targetCard, position, listId, swimlaneId) {
  const indexes = [];
  if (cardsCount <= 0) return indexes;

  if (targetCard) {
    const step = 0.5;
    if (position === 'above') {
      const start = targetCard.sort - step * cardsCount;
      for (let i = 0; i < cardsCount; i += 1) {
        indexes.push(start + step * i);
      }
    } else {
      const start = targetCard.sort + step;
      for (let i = 0; i < cardsCount; i += 1) {
        indexes.push(start + step * i);
      }
    }
    return indexes;
  }

  const maxSort = getMaxSortForList(listId, swimlaneId);
  const start = maxSort === null ? 0 : maxSort + 1;
  for (let i = 0; i < cardsCount; i += 1) {
    indexes.push(start + i);
  }
  return indexes;
}

function mapSelection(kind, _id) {
  return ReactiveCache.getCards(MultiSelection.getMongoSelector(), {sort: ['sort']}).map(card => {
    const methodName = kind === 'label' ? 'hasLabel' : 'isAssigned';
    return card[methodName](_id);
  });
}

Template.multiselectionSidebar.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  isCommentOnly() {
    return ReactiveCache.getCurrentUser().isCommentOnly();
  },
  allSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty()) return false;
    else return mapSelection(kind, _id).every(Boolean);
  },
  someSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty()) return false;
    else return mapSelection(kind, _id).some(Boolean);
  },
});

Template.multiselectionSidebar.events({
  'click .js-toggle-label-multiselection'(evt) {
    const labelId = Template.currentData()._id;
    const mappedSelection = mapSelection('label', labelId);

    if (mappedSelection.every(Boolean)) {
      mutateSelectedCards('removeLabel', labelId);
    } else if (mappedSelection.every(bool => !bool)) {
      mutateSelectedCards('addLabel', labelId);
    } else {
      const popup = Popup.open('disambiguateMultiLabel');
      // XXX We need to have a better integration between the popup and the
      // UI components systems.
      popup.call(Template.currentData(), evt);
    }
  },
  'click .js-toggle-member-multiselection'(evt) {
    const memberId = Template.currentData()._id;
    const mappedSelection = mapSelection('member', memberId);
    if (mappedSelection.every(Boolean)) {
      mutateSelectedCards('unassignMember', memberId);
    } else if (mappedSelection.every(bool => !bool)) {
      mutateSelectedCards('assignMember', memberId);
    } else {
      const popup = Popup.open('disambiguateMultiMember');
      // XXX We need to have a better integration between the popup and the
      // UI components systems.
      popup.call(Template.currentData(), evt);
    }
  },
  'click .js-move-selection': Popup.open('moveSelection'),
  'click .js-copy-selection': Popup.open('copySelection'),
  'click .js-selection-color': Popup.open('setSelectionColor'),
  'click .js-archive-selection'() {
    mutateSelectedCards('archive');
    EscapeActions.executeUpTo('multiselection');
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
      const boardId = this.selectedBoardId.get();
      const swimlaneId = this.selectedSwimlaneId.get();
      const lists = getListsForBoardSwimlane(boardId, swimlaneId);
      const listId = lists[0] ? lists[0]._id : '';
      this.selectedListId.set(listId);
      this.selectedCardId.set('');
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
    const instance = Template.instance();
    return getListsForBoardSwimlane(
      instance.selectedBoardId.get(),
      instance.selectedSwimlaneId.get(),
    );
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
    const instance = Template.instance();
    instance.selectedSwimlaneId.set($(event.currentTarget).val());
    instance.setFirstListId();
  },
  'change .js-select-lists'(event) {
    const instance = Template.instance();
    instance.selectedListId.set($(event.currentTarget).val());
    instance.selectedCardId.set('');
  },
  'change .js-select-cards'(event) {
    Template.instance().selectedCardId.set($(event.currentTarget).val());
  },
  'change input[name="position"]'(event) {
    Template.instance().position.set($(event.currentTarget).val());
  },
  async 'click .js-done'() {
    const instance = Template.instance();
    const boardId = instance.selectedBoardId.get();
    const swimlaneId = instance.selectedSwimlaneId.get();
    const listId = instance.selectedListId.get();
    const cardId = instance.selectedCardId.get();
    const position = instance.position.get();

    const selectedCards = getSelectedCardsSorted();
    const targetCard = cardId ? ReactiveCache.getCard(cardId) : null;
    const sortIndexes = buildInsertionSortIndexes(
      selectedCards.length,
      targetCard,
      position,
      listId,
      swimlaneId,
    );

    for (let i = 0; i < selectedCards.length; i += 1) {
      await selectedCards[i].move(boardId, swimlaneId, listId, sortIndexes[i]);
    }
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
      const boardId = this.selectedBoardId.get();
      const swimlaneId = this.selectedSwimlaneId.get();
      const lists = getListsForBoardSwimlane(boardId, swimlaneId);
      const listId = lists[0] ? lists[0]._id : '';
      this.selectedListId.set(listId);
      this.selectedCardId.set('');
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
    const instance = Template.instance();
    return getListsForBoardSwimlane(
      instance.selectedBoardId.get(),
      instance.selectedSwimlaneId.get(),
    );
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
    const instance = Template.instance();
    instance.selectedSwimlaneId.set($(event.currentTarget).val());
    instance.setFirstListId();
  },
  'change .js-select-lists'(event) {
    const instance = Template.instance();
    instance.selectedListId.set($(event.currentTarget).val());
    instance.selectedCardId.set('');
  },
  'change .js-select-cards'(event) {
    Template.instance().selectedCardId.set($(event.currentTarget).val());
  },
  'change input[name="position"]'(event) {
    Template.instance().position.set($(event.currentTarget).val());
  },
  async 'click .js-done'() {
    const instance = Template.instance();
    const boardId = instance.selectedBoardId.get();
    const swimlaneId = instance.selectedSwimlaneId.get();
    const listId = instance.selectedListId.get();
    const cardId = instance.selectedCardId.get();
    const position = instance.position.get();

    const selectedCards = getSelectedCardsSorted();
    const targetCard = cardId ? ReactiveCache.getCard(cardId) : null;
    const sortIndexes = buildInsertionSortIndexes(
      selectedCards.length,
      targetCard,
      position,
      listId,
      swimlaneId,
    );

    for (let i = 0; i < selectedCards.length; i += 1) {
      const card = selectedCards[i];
      const newCardId = await Meteor.callAsync(
        'copyCard',
        card._id,
        boardId,
        swimlaneId,
        listId,
        true,
        { title: card.title },
      );
      if (!newCardId) continue;

      const newCard = ReactiveCache.getCard(newCardId);
      if (!newCard) continue;

      await newCard.move(boardId, swimlaneId, listId, sortIndexes[i]);
    }
    EscapeActions.executeUpTo('multiselection');
  },
});

import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Filter } from '/client/lib/filter';
import { EscapeActions } from '/client/lib/escapeActions';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
import { getSidebarInstance } from '/client/features/sidebar/service';
import { DEPENDENCY_TYPES } from '/models/metadata/dependencies';

Template.filterSidebar.helpers({
  // #3392: relation types offered in the dependency ("Red Strings") filter.
  dependencyTypes() {
    return DEPENDENCY_TYPES.map(t => ({
      id: t.id,
      label: `dependency-type-${t.id}`,
    }));
  },
});

// ────────────────────────────────────────────────────────────────────────────
// Clicking outside the filter panel closes it.
//
// Reported as "the modal that appears when I use a filter sometimes doesn't
// disappear — it should close the moment I click anything outside it". It is the
// board sidebar showing its filter view, and nothing dismissed it but the
// sidebar's own toggle or Escape: the document click handler in
// client/lib/escapeActions.js runs `clickExecute(target, 'multiselection')`, and
// `sidebarView` sits BELOW `multiselection` in the hierarchy, so a click never
// reaches it by design.
//
// Done here rather than by raising that limit, because raising it would make
// every sidebar view close on any outside click — Archive, Settings, Card
// Settings are panels people work beside on purpose, and only the filter reads as
// a thing you open, use and are done with. Escape is untouched: it still returns
// the sidebar to its default view through the existing action.
//
// Not closed by a click on: the panel itself, a pop-over it opened (the label /
// member / due-date pickers render outside the sidebar), or the header button
// that opens the filter — which would otherwise toggle it shut in the same
// gesture that opened it.
const OUTSIDE_CLICK_KEEPS_OPEN = [
  '.board-sidebar',
  '.pop-over',
  '.js-open-filter-view',
].join(',');

Template.filterSidebar.onRendered(function () {
  const instance = this;

  instance._closeOnOutsideClick = evt => {
    if (evt.button !== 0) return;
    const sidebar = getSidebarInstance();
    if (!sidebar || !sidebar.isOpen || !sidebar.isOpen()) return;
    if ($(evt.target).closest(OUTSIDE_CLICK_KEEPS_OPEN).length > 0) return;
    sidebar.hide();
  };

  // Bound after the current event has finished propagating, so the very click
  // that opened the filter view cannot reach the handler it just created and
  // close it again.
  instance._bindOutsideClick = setTimeout(() => {
    $(document).on('click.wekanFilterSidebar', instance._closeOnOutsideClick);
  }, 0);
});

Template.filterSidebar.onDestroyed(function () {
  clearTimeout(this._bindOutsideClick);
  $(document).off('click.wekanFilterSidebar', this._closeOnOutsideClick);
});

// SubsManager removed for Meteor 3 migration

function getFilterIdFromEvent(evt, fallbackId) {
  const filterId = evt.currentTarget?.getAttribute('data-filter-id');
  if (filterId === '__none__') {
    return undefined;
  }
  if (filterId !== null) {
    return filterId;
  }
  return fallbackId;
}

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
    Filter.labelIds.toggle(getFilterIdFromEvent(evt, this?._id));
    Filter.resetExceptions();
  },
  'click .js-toggle-member-filter'(evt) {
    evt.preventDefault();
    Filter.members.toggle(getFilterIdFromEvent(evt, this?._id));
    Filter.resetExceptions();
  },
  'click .js-toggle-assignee-filter'(evt) {
    evt.preventDefault();
    Filter.assignees.toggle(getFilterIdFromEvent(evt, this?._id));
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
    Filter.customFields.toggle(getFilterIdFromEvent(evt, this?._id));
    Filter.resetExceptions();
  },
  'click .js-toggle-dependency-filter'(evt) {
    evt.preventDefault();
    Filter.cardDependencies.toggle(getFilterIdFromEvent(evt, this?._id));
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
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
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
  async 'click .js-archive-selection'() {
    const cards = getSelectedCardsSorted();
    const cardIds = cards.map(card => card._id);
    if (!cardIds.length) return;
    try {
      await Meteor.callAsync(
        'archiveSelectedCards',
        Session.get('currentBoard'),
        cardIds,
      );
      EscapeActions.executeUpTo('multiselection');
    } catch (error) {
      alert(error.reason || error.message || TAPi18n.__('server-error'));
    }
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


// The four selects of the move/copy selection dialogs, in one template. The
// dialog - the popup's own template instance - is kept on THIS instance,
// because inside `each boards` the data context is a board and a helper
// reaching into the context for it would find nothing there.
Template.selectionDestinationPicker.onCreated(function() {
  this.autorun(() => {
    const data = Template.currentData();
    this.dialog = data && data.dialog;
  });
});

Template.selectionDestinationPicker.helpers({
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
    const board = ReactiveCache.getBoard(Template.instance().dialog.selectedBoardId.get());
    return board ? board.swimlanes() : [];
  },
  lists() {
    const instance = Template.instance().dialog;
    return getListsForBoardSwimlane(
      instance.selectedBoardId.get(),
      instance.selectedSwimlaneId.get(),
    );
  },
  cards() {
    const instance = Template.instance().dialog;
    const list = ReactiveCache.getList(instance.selectedListId.get());
    if (!list) return [];
    return list.cards(instance.selectedSwimlaneId.get()).sort((a, b) => a.sort - b.sort);
  },
  isDialogOptionBoardId(boardId) {
    return Template.instance().dialog.selectedBoardId.get() === boardId;
  },
  isDialogOptionSwimlaneId(swimlaneId) {
    return Template.instance().dialog.selectedSwimlaneId.get() === swimlaneId;
  },
  isDialogOptionListId(listId) {
    return Template.instance().dialog.selectedListId.get() === listId;
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

/**
 * Move selection and Copy selection: the same dialog, twice.
 *
 * Both ask where the selected cards should go - board, swimlane, list, above or
 * below which card - keep the same four reactive selections while you answer,
 * and end by walking the selection in order. 145 of the 152 lines were the same
 * in both; what differs is the seven in the middle, which is what each does to
 * a card once the destination is known. That is `applyToCard`.
 *
 * The MARKUP is one template too - `selectionDestinationPicker` in
 * sidebarFilters.jade - and its events bubble up to whichever popup includes
 * it, which is the one holding these selections.
 */
function registerSelectionDialogTemplate(templateName, applyToCard) {
  Template[templateName].onCreated(function() {
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

  // The picker is a template of its own, and a helper is looked up on the
  // template it is written in - so what it needs is this instance, handed to it
  // as `dialog`. Everything it draws is read from there.
  Template[templateName].helpers({
    dialog() {
      return Template.instance();
    },
  });

  Template[templateName].events({
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
        await applyToCard(selectedCards[i], {
          boardId, swimlaneId, listId, sortIndex: sortIndexes[i],
        });
      }
      EscapeActions.executeUpTo('multiselection');
    },
  });
}

// Move: the card itself goes to the destination.
registerSelectionDialogTemplate('moveSelectionPopup', async (card, to) => {
  await card.move(to.boardId, to.swimlaneId, to.listId, to.sortIndex);
});

// Copy: a new card is made there, and then put in its place. A copy that could
// not be made is skipped rather than stopping the rest of the selection.
registerSelectionDialogTemplate('copySelectionPopup', async (card, to) => {
  const newCardId = await Meteor.callAsync(
    'copyCard',
    card._id,
    to.boardId,
    to.swimlaneId,
    to.listId,
    true,
    { title: card.title },
  );
  if (!newCardId) return;
  const newCard = ReactiveCache.getCard(newCardId);
  if (!newCard) return;
  await newCard.move(to.boardId, to.swimlaneId, to.listId, to.sortIndex);
});

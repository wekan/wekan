import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { isLazyCards } from '/client/lib/lazyCards';
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
import { Filter } from '/client/lib/filter';
import { tableViewCardsSelector, tableCardWithDates } from '/models/lib/tableViewFilter';
import {
  readTableViewTitleWrap,
  writeTableViewTitleWrap,
} from '/models/lib/tableViewTitleMode';
import {
  compareTableViewRows,
  nextTableViewSort,
} from '/models/lib/tableViewSort';
import {
  readTableViewGrouping,
  writeTableViewGrouping,
  addSwimlaneGroupHeaders,
} from '/models/lib/tableViewGrouping';

// Board "Table" view: lists every card of the current board in a table that
// reuses the My Cards table styling (the .my-cards-board-table CSS classes in
// client/components/main/myCards.css). It is the per-board counterpart of the
// My Cards table view, which spans all boards.
//
// Eager boards use local rows. Lazy boards request one authorized, sorted
// server page; local caches from other publications cannot expand that page.

const rowsPerPage = 25;
const tablePages = new Mongo.Collection('boardTablePages');
function resultPage(tpl) {
  return tablePages.findOne({ boardId: Utils.getCurrentBoardId(), key: tpl.pageKey.get() });
}
function totalPages(tpl) {
  const count = isLazyCards() ? resultPage(tpl)?.total || 0 : tpl.filteredRows.get().length;
  return Math.max(1, Math.ceil(count / rowsPerPage));
}
function currentPage(tpl) {
  return Math.min(tpl.page.get(), totalPages(tpl));
}

Template.tableView.onCreated(function () {
  this.searchQuery = new ReactiveVar('');
  this.page = new ReactiveVar(1);
  this.pageKey = new ReactiveVar('');
  this.filteredRows = new ReactiveVar([]);
  this.wrapCardTitles = new ReactiveVar(
    readTableViewTitleWrap(window.localStorage, Meteor.userId()),
  );
  this.sortField = new ReactiveVar('title');
  this.sortDirection = new ReactiveVar('asc');
  this.groupBySwimlane = new ReactiveVar(
    readTableViewGrouping(window.localStorage, Meteor.userId()),
  );

  this.autorun(() => {
    const boardId = Utils.getCurrentBoardId();
    if (!boardId || !isLazyCards(boardId)) return;
    const selector = Filter.isActive() ? Filter._getMongoSelector() : {};
    const options = { query: this.searchQuery.get(), sortField: this.sortField.get(),
      direction: this.sortDirection.get(), group: this.groupBySwimlane.get(), page: this.page.get() };
    const key = Random.id();
    this.pageKey.set(key);
    this.subscribe('boardTablePage', boardId, key, selector, options);
  });

  // Recompute the flat, filtered and sorted row list whenever the board cards,
  // board Filter or search query changes. Pagination is applied separately in
  // the rows() helper so paging does not rebuild the whole list.
  this.autorun(() => {
    const board = Utils.getCurrentBoard();
    if (!board) {
      this.filteredRows.set([]);
      return;
    }

    const query = this.searchQuery.get().trim().toLowerCase();
    const filterSelector = Filter.isActive()
      ? Filter._getMongoSelector()
      : undefined;
    const lazy = isLazyCards(board._id);
    const remote = lazy ? resultPage(this) : null;
    const dateValues = new Map((remote?.dateValues || []).map(value => [value._id, value]));
    const cards = ReactiveCache.getCards(
      lazy ? { boardId: board._id, _id: { $in: remote?.ids || [] } } : tableViewCardsSelector(board._id, filterSelector),
      { sort: { title: 1 } },
    );

    const rows = [];
    cards.forEach(storedCard => {
      const card = tableCardWithDates(storedCard, lazy ? dateValues.get(storedCard._id) : undefined);
      const swimlane = card.getSwimlane();
      const list = card.getList();
      if (!swimlane || swimlane.archived || !list || list.archived) return;

      const labels = (card.labelIds || [])
        .map(labelId => {
          const label = board.getLabelById(labelId);
          return label ? { name: label.name || '', color: label.color } : null;
        })
        .filter(Boolean);

      rows.push({
        card,
        title: card.title || '',
        listTitle: list.title || '',
        swimlaneTitle: swimlane.title || '',
        swimlaneId: swimlane._id,
        swimlaneSort: swimlane.sort || 0,
        colorClass: board.colorClass(),
        receivedAt: card.getReceived() || null,
        startAt: card.getStart() || null,
        dueAt: card.getDue() || null,
        endAt: card.getEnd() || null,
        labels,
        assigneesKey: (card.assignees || []).join(' '),
        membersKey: (card.members || []).join(' '),
        labelsKey: labels.map(label => label.name).join(' '),
      });
    });

    let filtered = rows;
    if (query) {
      filtered = rows.filter(row => {
        const haystack = [
          row.title,
          row.listTitle,
          row.swimlaneTitle,
          ...row.labels.map(label => label.name),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.indexOf(query) !== -1;
      });
    }

    const sortField = this.sortField.get();
    const sortDirection = this.sortDirection.get();
    const groupBySwimlane = this.groupBySwimlane.get();
    filtered = filtered.slice().sort((a, b) => {
      if (groupBySwimlane) {
        const laneOrder = a.swimlaneSort - b.swimlaneSort;
        if (laneOrder !== 0) return laneOrder;
        const laneTitle = a.swimlaneTitle.localeCompare(b.swimlaneTitle);
        if (laneTitle !== 0) return laneTitle;
        const laneId = a.swimlaneId.localeCompare(b.swimlaneId);
        if (laneId !== 0) return laneId;
      }
      return compareTableViewRows(a, b, sortField, sortDirection);
    });

    if (lazy) {
      const byId = new Map(rows.map(row => [row.card._id, row]));
      filtered = (remote?.ids || []).map(id => byId.get(id)).filter(Boolean);
    }
    this.filteredRows.set(filtered);
  });
});

Template.tableView.helpers({
  currentBoard() {
    return Utils.getCurrentBoard();
  },

  rows() {
    const tpl = Template.instance();
    const all = tpl.filteredRows.get();
    const start = (currentPage(tpl) - 1) * rowsPerPage;
    const pageRows = isLazyCards() ? all : all.slice(start, start + rowsPerPage);
    return tpl.groupBySwimlane.get()
      ? addSwimlaneGroupHeaders(pageRows)
      : pageRows;
  },

  currentPage() {
    return currentPage(Template.instance());
  },

  totalPages() {
    return totalPages(Template.instance());
  },

  hasPrevPage() {
    return currentPage(Template.instance()) > 1;
  },

  hasNextPage() {
    const tpl = Template.instance();
    return currentPage(tpl) < totalPages(tpl);
  },

  wrapCardTitles() {
    return Template.instance().wrapCardTitles.get();
  },

  sortIcon(field) {
    const tpl = Template.instance();
    if (tpl.sortField.get() !== field) return 'fa-sort';
    return tpl.sortDirection.get() === 'asc' ? 'fa-sort-asc' : 'fa-sort-desc';
  },

  groupBySwimlane() {
    return Template.instance().groupBySwimlane.get();
  },

  // A date column is shown unless BOTH its "Show at Card" (allowsXxxDate) and
  // "Show at Minicard" (allowsXxxDateOnMinicard) board settings are unchecked.
  showReceivedColumn() {
    const board = Utils.getCurrentBoard();
    return !!board && (board.allowsReceivedDate || board.allowsReceivedDateOnMinicard);
  },

  showStartColumn() {
    const board = Utils.getCurrentBoard();
    return !!board && (board.allowsStartDate || board.allowsStartDateOnMinicard);
  },

  showDueColumn() {
    const board = Utils.getCurrentBoard();
    return !!board && (board.allowsDueDate || board.allowsDueDateOnMinicard);
  },

  showEndColumn() {
    const board = Utils.getCurrentBoard();
    return !!board && (board.allowsEndDate || board.allowsEndDateOnMinicard);
  },
});

Template.tableView.events({
  'click .js-table-view-search-button'(event, tpl) {
    event.preventDefault();
    tpl.searchQuery.set(tpl.$('.js-table-view-search').val() || '');
    tpl.page.set(1);
  },

  'keydown .js-table-view-search'(event, tpl) {
    if (event.keyCode === 13) {
      event.preventDefault();
      tpl.searchQuery.set(tpl.$('.js-table-view-search').val() || '');
      tpl.page.set(1);
    }
  },

  'click .js-table-view-prev-page'(event, tpl) {
    event.preventDefault();
    const current = currentPage(tpl);
    if (current > 1) tpl.page.set(current - 1);
  },

  'click .js-table-view-next-page'(event, tpl) {
    event.preventDefault();
    const current = currentPage(tpl);
    if (current < totalPages(tpl)) tpl.page.set(current + 1);
  },

  'click .js-table-view-toggle-card-title-wrap'(event, tpl) {
    event.preventDefault();
    const wrap = !tpl.wrapCardTitles.get();
    tpl.wrapCardTitles.set(wrap);
    writeTableViewTitleWrap(window.localStorage, Meteor.userId(), wrap);
  },

  'click .js-table-view-sort'(event, tpl) {
    event.preventDefault();
    const selectedField = event.currentTarget.dataset.field;
    if (!selectedField) return;
    const next = nextTableViewSort(
      tpl.sortField.get(),
      tpl.sortDirection.get(),
      selectedField,
    );
    tpl.sortField.set(next.field);
    tpl.sortDirection.set(next.direction);
    tpl.page.set(1);
  },

  'click .js-table-view-toggle-swimlane-groups'(event, tpl) {
    event.preventDefault();
    const enabled = !tpl.groupBySwimlane.get();
    tpl.groupBySwimlane.set(enabled);
    writeTableViewGrouping(window.localStorage, Meteor.userId(), enabled);
    tpl.page.set(1);
  },

  // Clicking the leftmost "Edit" link opens the Card Details popup on top of the
  // Board Table view (same mechanism as opening a card from search results).
  'click .js-table-view-edit-card'(event) {
    event.preventDefault();
    const cardId = event.currentTarget.dataset.cardId;
    if (!cardId) return;
    const board = Utils.getCurrentBoard();
    Meteor.subscribe('popupCardData', cardId, {
      onReady() {
        Session.set('popupCardId', cardId);
        if (board) Session.set('popupCardBoardId', board._id);
        if (!Popup.isOpen()) {
          Popup.open('cardDetails')(event);
        }
      },
    });
  },

  // Adding a date to a card that has none. The data context of each add button
  // is the card (set with `with row.card` in the template), so the popup edits
  // the right card. Editing an existing date is handled by the cardXxxDate
  // badge templates themselves (their own .js-edit-date click handlers).
  'click .js-received-date': Popup.open('editCardReceivedDate'),
  'click .js-start-date': Popup.open('editCardStartDate'),
  'click .js-due-date': Popup.open('editCardDueDate'),
  'click .js-end-date': Popup.open('editCardEndDate'),
});

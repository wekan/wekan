import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';

// Board "Table" view: lists every card of the current board in a table that
// reuses the My Cards table styling (the .my-cards-board-table CSS classes in
// client/components/main/myCards.css). It is the per-board counterpart of the
// My Cards table view, which spans all boards.
//
// Search, column sorting (Excel-like) and pagination all run client-side: the
// board's cards are already loaded reactively via board.cards(), so there is no
// need for the server-side limit/skip publication the Admin People page uses.

const rowsPerPage = 25;

Template.tableView.onCreated(function () {
  this.searchQuery = new ReactiveVar('');
  this.page = new ReactiveVar(1);
  this.filteredRows = new ReactiveVar([]);

  // Recompute the flat, filtered and sorted row list whenever the board cards,
  // search query or sort order change. Pagination is applied separately in the
  // rows() helper so paging does not rebuild the whole list.
  this.autorun(() => {
    const board = Utils.getCurrentBoard();
    if (!board) {
      this.filteredRows.set([]);
      return;
    }

    const query = this.searchQuery.get().trim().toLowerCase();

    const rows = [];
    board.cards().forEach(card => {
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
        colorClass: board.colorClass(),
        receivedAt: card.getReceived() || null,
        startAt: card.getStart() || null,
        dueAt: card.getDue() || null,
        endAt: card.getEnd() || null,
        labels,
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

    // Fixed order: by card title, ascending. (Column-header click-to-sort was
    // removed; the Table view now always shows this stable order.)
    filtered = filtered.slice().sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }),
    );

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
    const totalPages = Math.max(1, Math.ceil(all.length / rowsPerPage));
    // Clamp on read so a shrinking list (deleted cards) never shows an empty
    // page; no write here, to avoid a reactive loop.
    const page = Math.min(tpl.page.get(), totalPages);
    const start = (page - 1) * rowsPerPage;
    return all.slice(start, start + rowsPerPage);
  },

  currentPage() {
    return Template.instance().page.get();
  },

  totalPages() {
    const count = Template.instance().filteredRows.get().length;
    return Math.max(1, Math.ceil(count / rowsPerPage));
  },

  hasPrevPage() {
    return Template.instance().page.get() > 1;
  },

  hasNextPage() {
    const tpl = Template.instance();
    const totalPages = Math.max(
      1,
      Math.ceil(tpl.filteredRows.get().length / rowsPerPage),
    );
    return tpl.page.get() < totalPages;
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
    const current = tpl.page.get();
    if (current > 1) tpl.page.set(current - 1);
  },

  'click .js-table-view-next-page'(event, tpl) {
    event.preventDefault();
    const totalPages = Math.max(
      1,
      Math.ceil(tpl.filteredRows.get().length / rowsPerPage),
    );
    const current = tpl.page.get();
    if (current < totalPages) tpl.page.set(current + 1);
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

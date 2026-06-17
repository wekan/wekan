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
  this.sortField = new ReactiveVar('card'); // card | list | swimlane | due
  this.sortDirection = new ReactiveVar(1); // 1 ascending, -1 descending
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
    const field = this.sortField.get();
    const direction = this.sortDirection.get();

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
        dueAt: card.dueAt || null,
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

    filtered = filtered.slice().sort((a, b) => {
      if (field === 'due') {
        const av = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bv = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return (av - bv) * direction;
      }
      let av;
      let bv;
      if (field === 'list') {
        av = a.listTitle;
        bv = b.listTitle;
      } else if (field === 'swimlane') {
        av = a.swimlaneTitle;
        bv = b.swimlaneTitle;
      } else {
        av = a.title;
        bv = b.title;
      }
      return (
        av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' }) *
        direction
      );
    });

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

  // Excel-like sort arrow shown on the active sort column header.
  sortIndicator(field) {
    const tpl = Template.instance();
    if (tpl.sortField.get() !== field) return '';
    return tpl.sortDirection.get() === 1 ? '▲' : '▼';
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

  'click .js-table-view-sort'(event, tpl) {
    event.preventDefault();
    const field = event.currentTarget.dataset.sort;
    if (!field) return;
    if (tpl.sortField.get() === field) {
      tpl.sortDirection.set(tpl.sortDirection.get() * -1);
    } else {
      tpl.sortField.set(field);
      tpl.sortDirection.set(1);
    }
    tpl.page.set(1);
  },
});

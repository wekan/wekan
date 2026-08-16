import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Boards from '/models/boards';
import { ReportPages } from '/client/lib/reportPages';
import {
  buildHeader,
  docsByIds,
  pageInfo,
  TABLE_PAGE_ROWS_PER_PAGE,
} from '/models/lib/tablePage';

// /public — the boards anybody may open, as a table page.
// Design: docs/Features/Page/Public.md (which is docs/Features/Page/Table.md).
//
// The page is ONLY the table. It used to render `boardList`, the All Boards page,
// with its query swapped for `{ permission: 'public' }` — which brought the
// Starred/Templates/Remaining menu, the workspaces tree, the org and team
// filters, Multi-Selection with its archive and duplicate actions, board dragging
// and an "Add board" tile with it. None of that means anything for a list of
// somebody else's public boards, and some of it offered actions the visitor has
// no rights to.

// The server names its page under this id (publishReportPage in the publication).
const PAGE_ID = 'public-boards';

// The columns, in the order a board tile shows them. Header labels only: the rows
// are a template, because a row is a LINK and carries its board's colours, and a
// text cell can express neither.
// Two columns, deliberately. The All Boards tile also shows member avatars, each
// list with its card count and a spent-time clock; what a visitor needs of a board
// they do not belong to is what it is called and what it is for. Each of the rest
// also costs a query this page would otherwise not make - see the design doc.
const COLUMNS = [
  { labelKey: 'board' },
  { labelKey: 'description' },
];

Template.publicBoards.onCreated(function () {
  this.page = new ReactiveVar(1);
  this.searchTerm = new ReactiveVar('');
  this.total = new ReactiveVar(0);

  this.autorun(() => {
    const page = this.page.get();
    const term = this.searchTerm.get();
    this.subscribe('publicBoards', term, TABLE_PAGE_ROWS_PER_PAGE,
      (page - 1) * TABLE_PAGE_ROWS_PER_PAGE);
    // The total is a method, not a published count: the page needs one number and
    // a live count cursor over every public board on the instance is not worth it.
    Meteor.call('getPublicBoardsCount', term, (err, res) => {
      if (!err && typeof res === 'number') this.total.set(res);
    });
  });
});

Template.publicBoards.helpers({
  tablePageData() {
    const tpl = Template.instance();
    const info = pageInfo(tpl.total.get(), tpl.page.get());

    // The boards of the page the SERVER named, in the order it sorted them. Not
    // a plain find(): every board this user has opened is also in minimongo, and
    // reading the collection would draw those too — the pager would say "1 / 3"
    // beside rows from all three pages.
    const index = ReportPages.findOne(PAGE_ID);
    const ids = (index && index.ids) || [];
    const boards = ids.length
      ? docsByIds(ids, Boards.find({ _id: { $in: ids } }).fetch())
      : [];

    const docs = boards.map(board => {
      return {
        _id: board._id,
        slug: board.slug,
        title: board.title,
        description: board.description,
        colorClass: board.colorClass ? board.colorClass() : '',
        // #5157: the board's own background image, the same one the All Boards
        // tile uses, so a board is recognised here the way it is there.
        backgroundStyle: board.backgroundImageURL
          ? `background-image:url('${board.backgroundImageURL}');`
          : '',
      };
    });

    return {
      // NO titleKey. The page already has a heading: the route renders
      // `boardListHeaderBar`, whose `h1` says "Public". The shared table page
      // prints a title only when one is supplied, precisely so a page that
      // already has a heading does not show two - the same reason the Admin
      // Panel panes supply none (docs/Features/Page/Table.md).
      header: buildHeader(COLUMNS),
      // A row template, not `rows`: see COLUMNS above.
      rowTemplate: 'publicBoardRow',
      docs,
      rowCount: docs.length,
      total: tpl.total.get(),
      searchTerm: tpl.searchTerm.get(),
      page: info.page,
      totalPages: info.totalPages,
      hasPrev: info.hasPrev,
      hasNext: info.hasNext,
      emptyKey: 'no-results',
    };
  },
});

Template.publicBoards.events({
  // The shared controls row: search on Enter, and the pager. There is nothing
  // else — no filter, no action button — because nothing on this page changes
  // anything.
  'keydown .js-table-page-search'(event, tpl) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    tpl.searchTerm.set(event.currentTarget.value || '');
    tpl.page.set(1);
  },
  'click .js-table-page-prev'(event, tpl) {
    event.preventDefault();
    tpl.page.set(Math.max(1, tpl.page.get() - 1));
  },
  'click .js-table-page-next'(event, tpl) {
    event.preventDefault();
    tpl.page.set(tpl.page.get() + 1);
  },

  // The whole row opens its board. The title is already an anchor, so a click on
  // it is left alone — following it twice would push the same route twice.
  'click .js-open-public-board'(event) {
    if ($(event.target).closest('a').length > 0) return;
    const boardId = event.currentTarget.getAttribute('data-board-id');
    if (!boardId) return;
    const board = Boards.findOne(boardId);
    if (!board) return;
    FlowRouter.go('board', { id: boardId, slug: board.slug });
  },
});

// Pure helpers behind the shared table page (docs/Features/Page/Table.md).
//
// Every paginated admin table — Security, Speed, Tests, CPU usage, Files, Rules,
// Boards, Cards, Impersonation, Recovery — renders through ONE template driven by
// a column specification. These helpers turn (documents, columns) into the rows
// that template iterates, and compute the paging window. They are pure so the
// layout rules the design doc promises (equal column widths, one page of data at
// a time, a stable cell shape) are unit-testable without a browser or a database.
//
// A column is:
//   { label | labelKey, value(doc), align: 'end', nowrap: true, cls: 'x',
//     userId(doc) }
// `value` returns display text; `userId`, when given, makes the cell a link to
// that user (the admin "edit user" popup) instead of plain text.

// One page of rows, for EVERY paginated page in WeKan - the ones built from the
// shared table page and the ones with a pager of their own. Kept in one place so
// they all page alike, and so a publication's limit and the "page X / N" counter
// beside it can never drift apart. Ten rows: a page that fits on a screen without
// scrolling is what a pager is for.
export const TABLE_PAGE_ROWS_PER_PAGE = 10;

// Equal share of the table width for `count` columns, as a CSS percentage
// string. `table-layout: fixed` already divides the width evenly, so this exists
// for callers that need the number (and for the test that pins "same percentage
// width" from the design doc).
export function columnWidthPercent(count) {
  const n = Number(count);
  if (!Number.isFinite(n) || n <= 0) return '100%';
  // Round to 4 decimals: enough that 7 columns still sum to 100% visually,
  // without emitting a 17-digit float into the DOM.
  return `${Math.round((100 / n) * 10000) / 10000}%`;
}

// Paging window for `total` rows at `page` (1-based). Returns everything both the
// publication (skip/limit) and the controls row (page X / N, prev/next enabled)
// need, so the two cannot disagree.
export function pageInfo(total, page, perPage = TABLE_PAGE_ROWS_PER_PAGE) {
  const size = Number(perPage) > 0 ? Math.floor(Number(perPage)) : TABLE_PAGE_ROWS_PER_PAGE;
  const count = Number(total) > 0 ? Math.floor(Number(total)) : 0;
  const totalPages = Math.max(1, Math.ceil(count / size));
  // Clamp: a page that no longer exists (rows deleted while you were on it, or a
  // hand-edited value) must resolve to a real page, never to an empty view.
  let current = Math.floor(Number(page));
  if (!Number.isFinite(current) || current < 1) current = 1;
  if (current > totalPages) current = totalPages;
  return {
    total: count,
    page: current,
    totalPages,
    hasPrev: current > 1,
    hasNext: current < totalPages,
    skip: (current - 1) * size,
    limit: size,
  };
}

// One bounded step for pagers that do not use pageInfo directly.
export function adjacentPage(total, page, direction, perPage = TABLE_PAGE_ROWS_PER_PAGE) {
  const info = pageInfo(total, page, perPage);
  const step = Math.sign(Number(direction));
  if (!Number.isFinite(step) || step === 0) return info.page;
  return Math.min(info.totalPages, Math.max(1, info.page + step));
}

// Text for one cell. Never returns undefined/null: an absent field shows as an
// empty cell, not as the string "undefined" (which is what several of the
// hand-written report tables used to print).
function cellText(column, doc) {
  if (typeof column.value !== 'function') return '';
  const out = column.value(doc);
  if (out === undefined || out === null) return '';
  return typeof out === 'string' ? out : String(out);
}

// The documents of ONE page, given the ids the server put on that page.
//
// A paginated pane subscribes to a publication that sends one page, then reads the
// page back out of minimongo - where the browser also holds documents that have
// nothing to do with this page (the logged-in user's own record above all, which
// accounts always publishes). A plain `find(query)` cannot tell them apart, which
// is how Admin Panel / People showed the admin on every one of its 578 pages.
//
// So the server names the page and this puts it back in that order: `$in` returns
// documents in no particular order, and an id whose document has not arrived yet is
// left out rather than rendered as an empty row.
export function docsByIds(ids, docs) {
  const list = Array.isArray(ids) ? ids : [];
  const byId = new Map(
    (Array.isArray(docs) ? docs : [])
      .filter(Boolean)
      .map(doc => [doc._id || doc.id, doc]),
  );
  return list.map(id => byId.get(id)).filter(Boolean);
}

// Build the rows the shared template iterates. One cell per column, in column
// order, so a row can never be shorter than the header (which is how a
// hand-written table ends up with its columns shifted by one).
// The avatar of an account, or '' when it has none or is not loaded here. Looked
// up through ReactiveCache like every other user lookup on the client; on the
// server, where this module is also loaded, there is no cache and no avatar to
// draw, and the initials fall back cleanly.
function avatarUrlFor(userId) {
  try {
    // eslint-disable-next-line global-require
    const { ReactiveCache } = require('/imports/reactiveCache');
    const user = ReactiveCache.getUser(userId);
    return (user && user.profile && user.profile.avatarUrl) || '';
  } catch (e) {
    return '';
  }
}

export function buildRows(docs, columns, options = {}) {
  const cols = Array.isArray(columns) ? columns : [];
  const list = Array.isArray(docs) ? docs : [];
  const rowClass = typeof options.rowClass === 'function' ? options.rowClass : null;
  return list.map((doc, index) => ({
    id: (doc && (doc._id || doc.id)) || `row-${index}`,
    cls: (rowClass && rowClass(doc)) || '',
    cells: cols.map(column => {
      const userId = typeof column.userId === 'function' ? column.userId(doc) : null;
      return {
        text: cellText(column, doc),
        // Column classes are fixed strings from the column spec, never data.
        cls: [column.cls || '', column.align === 'end' ? 'table-page-end' : '',
              column.nowrap ? 'table-page-nowrap' : ''].filter(Boolean).join(' '),
        userId: userId || '',
        // The account's avatar, when it has one. A user cell shows INITIALS or
        // the avatar rather than the name - the same way the board sidebar and
        // a card show a member, and for the same reason: it takes a fraction of
        // the width, and these tables are wide. The name is the cell's title,
        // so hovering still identifies the account.
        userAvatarUrl: userId ? avatarUrlFor(userId) : '',
        // SEVERAL people in one cell - the accounts that log in from an office.
        // Same rendering as a single user cell, repeated: initials or avatar,
        // the name as the title, and clicking one opens the Edit user popup.
        // Each entry is { userId, text, avatarUrl }.
        users: typeof column.users === 'function'
          ? (column.users(doc) || []).map(u => ({
            userId: u.userId || '',
            text: u.text || u.value || '',
            initials: u.initials || '',
            avatarUrl: u.avatarUrl || (u.userId ? avatarUrlFor(u.userId) : ''),
            // How many times this person logged in from here. Shown beside the
            // avatar, because "who" without "how much" does not tell an office
            // from somebody who visited once.
            count: typeof u.count === 'number' ? u.count : null,
          }))
          : [],
        // A leading emoji for the cell - the country flag on an office row. Kept
        // apart from `text` so the flag is not searched or sorted as text.
        flag: typeof column.flag === 'function' ? (column.flag(doc) || '') : '',
        // Small status icons rendered before cell text. Class names come from a
        // fixed column function, not database content.
        icons: typeof column.icons === 'function'
          ? (column.icons(doc) || []).map(icon => ({
            cls: icon.cls || '',
            title: icon.title || '',
          }))
          : [],
        // A PLACE this cell stands for, when something in front of WeKan
        // resolved one: { latitude, longitude, label }. It makes the cell open
        // the map-provider popup, so an office row's "London" leads to London
        // on whichever map the admin uses - the same chooser, and the same
        // eleven providers, as a card's location.
        //
        // Only with COORDINATES. A city name is not a position, and putting one
        // into a map URL would either search for the word or invent a place; a
        // CDN that sends a country and no lat/lon gives a label to read, not a
        // pin to open.
        location: (() => {
          const loc = typeof column.location === 'function' ? column.location(doc) : null;
          if (!loc) return null;
          const { latitude, longitude } = loc;
          if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
          return { latitude, longitude, label: loc.label || cellText(column, doc) || '' };
        })(),
        // Only used by the severity cell; a plain string, rendered as an
        // attribute value by Blaze (which escapes it).
        data: typeof column.data === 'function' ? (column.data(doc) || '') : '',
      };
    }),
  }));
}

// ── controls-row features (from People, generalised) ───────────────────────
//
// A filter dropdown, extra action buttons and a total were features only Admin
// Panel / People had, hand-written into its own markup. They are general — a
// Boards or Cards report wants them just as much — so they live here, in the
// shared controls row, and are ON by default: a page that supplies a filter or
// an action gets it rendered, and the total is shown whenever the page knows one.

// One <select> in the controls row. `current` is the selected option's value.
export function buildFilters(filters, current) {
  const list = Array.isArray(filters) ? filters : [];
  return list.filter(Boolean).map(filter => ({
    id: filter.id || '',
    labelKey: filter.labelKey || '',
    options: (Array.isArray(filter.options) ? filter.options : [])
      .filter(Boolean)
      .map(option => ({
        value: option.value === undefined ? '' : String(option.value),
        labelKey: option.labelKey || '',
        label: option.label || '',
        // Compared as strings so a numeric value still selects.
        selected: String(option.value) === String(
          // A filter may carry its own current value; otherwise the row's.
          filter.current === undefined ? current : filter.current),
      })),
  }));
}

// Extra buttons in the controls row (People's "Unlock all users",
// "Add / Remove Teams"). The page identifies which was pressed by data-action.
export function buildActions(actions) {
  const list = Array.isArray(actions) ? actions : [];
  return list.filter(Boolean).map(action => ({
    id: action.id || '',
    labelKey: action.labelKey || '',
    icon: action.icon || '',
    cls: action.cls || '',
  }));
}

// Header cells, with the equal width the design doc requires.
export function buildHeader(columns) {
  const cols = Array.isArray(columns) ? columns : [];
  const width = columnWidthPercent(cols.length);
  return cols.map(column => ({
    label: column.label || '',
    labelKey: column.labelKey || '',
    // A column may render its own header instead of a label - a select-all pair,
    // an "add row" form. The template name and its data context come from the
    // column spec, so the shared template still owns the <th> itself.
    template: column.headerTemplate || '',
    data: column.headerData || {},
    width,
    cls: [column.align === 'end' ? 'table-page-end' : ''].filter(Boolean).join(' '),
  }));
}

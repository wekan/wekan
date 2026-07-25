// Pure helpers behind the shared table page (docs/Design/Table-Page.md).
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

// One page of rows. Kept in one place so every table pages alike and so the
// publication limit and the "page X / N" counter can never drift apart.
export const TABLE_PAGE_ROWS_PER_PAGE = 25;

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

// Text for one cell. Never returns undefined/null: an absent field shows as an
// empty cell, not as the string "undefined" (which is what several of the
// hand-written report tables used to print).
function cellText(column, doc) {
  if (typeof column.value !== 'function') return '';
  const out = column.value(doc);
  if (out === undefined || out === null) return '';
  return typeof out === 'string' ? out : String(out);
}

// Build the rows the shared template iterates. One cell per column, in column
// order, so a row can never be shorter than the header (which is how a
// hand-written table ends up with its columns shifted by one).
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
        // Only used by the severity cell; a plain string, rendered as an
        // attribute value by Blaze (which escapes it).
        data: typeof column.data === 'function' ? (column.data(doc) || '') : '',
      };
    }),
  }));
}

// Header cells, with the equal width the design doc requires.
export function buildHeader(columns) {
  const cols = Array.isArray(columns) ? columns : [];
  const width = columnWidthPercent(cols.length);
  return cols.map(column => ({
    label: column.label || '',
    labelKey: column.labelKey || '',
    width,
    cls: [column.align === 'end' ? 'table-page-end' : ''].filter(Boolean).join(' '),
  }));
}

'use strict';

// Pure filter + sort + paginate for the Admin Panel > People > Domains table.
// Extracted so the page logic is unit-testable without Meteor and shared by the
// server method that feeds the table.
//
// The Domains table used to load EVERY domain (aggregated from all users) into
// the browser at once, with a fixed order and no search. To behave like the
// Board Table view — send only one small page to the browser, let the user
// order by a column and search — the server aggregates all users into
// { domain, count } rows and then hands them to this helper, which applies the
// search filter, the requested column sort and the requested page, returning
// only that page plus the total so the client can render pagination controls.

const PER_PAGE_DEFAULT = 25;
const PER_PAGE_MAX = 200;

function paginateDomains(rows, opts = {}) {
  const all = Array.isArray(rows) ? rows : [];

  const search =
    typeof opts.search === 'string' ? opts.search.trim().toLowerCase() : '';
  // Only two real columns; anything else falls back to the domain name.
  const sortField = opts.sortField === 'count' ? 'count' : 'domain';
  const sortDirection = opts.sortDirection === -1 ? -1 : 1;
  const rawPerPage = Number(opts.perPage);
  const perPage = Math.min(
    PER_PAGE_MAX,
    Number.isFinite(rawPerPage) && rawPerPage >= 1 ? rawPerPage : PER_PAGE_DEFAULT,
  );

  let filtered = all;
  if (search) {
    filtered = all.filter(
      row => (row.domain || '').toLowerCase().indexOf(search) !== -1,
    );
  }

  const byDomain = (a, b) =>
    (a.domain || '').localeCompare(b.domain || '', undefined, {
      sensitivity: 'base',
      numeric: true,
    });

  filtered = filtered.slice().sort((a, b) => {
    if (sortField === 'count') {
      const cmp = ((a.count || 0) - (b.count || 0)) * sortDirection;
      if (cmp !== 0) return cmp;
      // Ties always break alphabetically (ascending), independent of direction.
      return byDomain(a, b);
    }
    return byDomain(a, b) * sortDirection;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  // Clamp the requested page into range so a stale/too-large page never yields
  // an empty table.
  const page = Math.min(Math.max(1, Number(opts.page) || 1), totalPages);
  const start = (page - 1) * perPage;

  return {
    rows: filtered.slice(start, start + perPage),
    total,
    page,
    totalPages,
    perPage,
  };
}

module.exports = { paginateDomains, PER_PAGE_DEFAULT, PER_PAGE_MAX };

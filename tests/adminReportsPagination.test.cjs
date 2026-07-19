'use strict';

// Guards for the Admin Panel → Problems pagination tables: server-side
// pagination with INDEX-BACKED sorts (so only one page loads, fast), theme-
// colored controls, pagination beside the search field, no redundant Search
// button, and clickable column-header sorting. (User reports: the Cards report
// spun while loading 11761 cards; controls ignored the theme.)
//
// Run: node tests/adminReportsPagination.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

console.log('adminReportsPagination:');

// ── performance: paginated + index-backed sorts ─────────────────────────────
check('Cards report sorts by an INDEXED field (boardId,createdAt), not the unindexed {boardId,sort}', () => {
  const pub = read('server/publications/cards.js');
  const block = pub.slice(pub.indexOf("publish('cardsReport'"), pub.indexOf("getCardsReportCount"));
  assert.ok(/sort:\s*\{\s*boardId:\s*1,\s*createdAt:\s*-1\s*\}/.test(block),
    'cardsReport must sort by the { boardId:1, createdAt:-1 } index');
  assert.ok(!/sort:\s*\{\s*boardId:\s*1,\s*sort:\s*1\s*\}/.test(block),
    'the unindexed { boardId:1, sort:1 } sort must be gone');
  // publication is bounded (limit/skip)
  assert.ok(/limit,\s*skip/.test(block), 'publication must page with limit/skip');
  const client = read('client/components/settings/adminReports.js');
  assert.ok(/collectionResults\(Cards, \{ boardId: 1, createdAt: -1 \}\)/.test(client),
    'client sort must match the publication');
});

check('eventlog has a {stream,at} index so Security/Speed/Tests pages stay fast', () => {
  const src = read('models/eventLog.js');
  assert.ok(/ensureIndex\(EventLog, \{ stream: 1, at: -1 \}\)/.test(src),
    'the stream+at index must be created for the streamSelector sort');
  assert.ok(/ensureIndex\(EventLogAcks, \{ stream: 1 \}\)/.test(src));
});

// ── no redundant Search button; pagination on the right of the search field ──
check('report tables have no Search button (Enter searches) and a single controls row', () => {
  const jade = read('client/components/settings/adminReports.jade');
  assert.ok(!/-search-button/.test(jade), 'the Search button must be gone (typing + Enter searches)');
  // each of the 5 reports uses one .admin-report-controls row (search + pagination)
  assert.strictEqual((jade.match(/\.admin-report-controls/g) || []).length, 5);
  assert.ok(!/\.admin-report-search\b/.test(jade), 'the old two-block layout must be gone');
  const js = read('client/components/settings/adminReports.js');
  assert.ok(!/-search-button'\(event, tmpl\)/.test(js), 'dead search-button handlers removed');
  assert.ok(/keydown \.js-cards-search-input/.test(js), 'Enter-to-search kept');
});
check('pagination controls sit at the end of the row (right; RTL-mirrored)', () => {
  const css = read('client/components/settings/adminReports.css');
  assert.ok(/\.admin-report-pagination\s*\{[^}]*margin-inline-start:\s*auto/.test(css),
    'pagination must be pushed to the end of the controls row');
});

// ── theme colors: controls follow --theme-accent (Member change-color override) ──
check('report + event pagination controls use var(--theme-accent)', () => {
  const css = read('client/components/settings/adminReports.css');
  assert.ok(/\.admin-report-pagination button\s*\{[^}]*var\(--theme-accent/.test(css),
    'report pagination buttons must use the theme accent');
  assert.ok(/\.admin-event-pagination a\s*\{[^}]*var\(--theme-accent/.test(css),
    'event-stream pagination links must use the theme accent');
  assert.ok(!/#bbb|background:\s*#fff/.test(css), 'no hardcoded grey/white in the report controls');
});
check('People/Org/Team/Domain pagination buttons use var(--theme-accent)', () => {
  const css = read('client/components/settings/peopleBody.css');
  for (const sel of ['people', 'org', 'team', 'domain']) {
    const m = new RegExp('\\.' + sel + '-pagination button\\s*\\{[^}]*var\\(--theme-accent');
    assert.ok(m.test(css), `${sel}-pagination button must use the theme accent`);
  }
});

// ── column-header sorting removed everywhere ────────────────────────────────
check('clickable column-header sorting is removed from the board Table view', () => {
  const jade = read('client/components/boards/tableView.jade');
  const js = read('client/components/boards/tableView.js');
  assert.ok(!/js-table-view-sort/.test(jade) && !/js-table-view-sort/.test(js), 'no sortable headers/handler');
  assert.ok(!/sortField|sortDirection|sortIndicator/.test(js), 'sort state/helper removed');
});
check('clickable column-header sorting is removed from the Admin Domains table', () => {
  const jade = read('client/components/settings/peopleBody.jade');
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(!/js-domain-sort/.test(jade) && !/js-domain-sort/.test(js), 'no sortable headers/handler');
  assert.ok(!/domainSortIndicator/.test(js), 'sort indicator removed');
  // the server method no longer takes sort params
  const srv = read('server/models/users.js');
  const m = srv.slice(srv.indexOf('getDomainsWithUserCountsPage'), srv.indexOf('getDomainsWithUserCountsPage') + 900);
  assert.ok(!/sortField|sortDirection/.test(m), 'server method drops sort params (fixed order)');
});

// ── over-fetch: Translation page must not load the whole collection ─────────
check('Translation page subscribes with a bounded window, not limit 0 (whole collection)', () => {
  const js = read('client/components/settings/translationBody.js');
  assert.ok(/subscribe\('translation',[^,]+,\s*limitTranslations/.test(js),
    'must pass the infinite-scroll window limit');
  assert.ok(!/subscribe\('translation',[^,]+,\s*0\b/.test(js),
    'the limit-0 (= no limit = whole collection) load must be gone');
});

// ── over-fetch: Board Archive → Boards is now server-side paginated ─────────
check('archivedBoards is server-side paginated with BOTH search and pagination controls', () => {
  const pub = read('server/publications/boards.js');
  assert.ok(/publish\('archivedBoards', async function\(searchTerm = '', limit = \d+, skip = 0\)/.test(pub),
    'archivedBoards must take searchTerm + limit/skip');
  assert.ok(/getArchivedBoardsCount\(searchTerm/.test(pub), 'count method takes searchTerm');
  const js = read('client/components/boards/boardArchive.js');
  assert.ok(/subscribe\('archivedBoards', searchTerm, ARCHIVED_BOARDS_PER_PAGE, skip\)/.test(js), 'client subscribes one page with search');
  const jade = read('client/components/boards/boardArchive.jade');
  assert.ok(/js-archived-boards-search/.test(jade), 'search box present');
  assert.ok(/js-archived-boards-prev-page/.test(jade) && /js-archived-boards-next-page/.test(jade), 'prev/next controls');
});

console.log(`\n${passed} passed`);

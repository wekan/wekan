'use strict';

// The shared table page — docs/Design/Page/Table.md.
//
// Files, Rules, Boards, Cards, Impersonation, Recovery and the four event streams
// (Security, Speed, Tests, CPU usage) used to be ten copies of the same page: the
// same title + search + prev/next markup, the same currentPage/totalPages helpers
// and the same handlers, retyped with a different js- prefix each time. They had
// drifted apart, and a layout fix had to be made ten times. They now share ONE
// template, ONE stylesheet and ONE set of pure helpers, and differ only in their
// column list.
//
// This guards both halves: the pure helpers behave, and the design rules the doc
// promises (equal column widths, wrapping cells, no second paginator, the fixed
// row order) are actually in the template and the CSS.
//
// This is the COMBINED suite for the table page design: the shared helpers, the
// shared template and stylesheet, the shared themed pager, the server-side paging
// behind it, and the design doc that describes all of it. The former
// tests/adminReportsPagination.test.cjs was merged in here - it asserted against
// the same pages from a second file, which is exactly the split this change
// removed from the app code.
//
// Files under test are the ones listed in the Related files table of
// docs/Design/Page/Table.md.
//
// Run: node tests/tablePage.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const libSrc = read('models/lib/tablePage.js');
const jade = read('client/components/settings/tablePage.jade');
const css = read('client/components/settings/tablePage.css');
const reportsJade = read('client/components/settings/adminReports.jade');
const reportsJs = read('client/components/settings/adminReports.js');
const doc = read('docs/Design/Page/Table.md');

// Load the ES module helpers without a bundler: strip the export keywords.
const lib = {};
new Function('exports', libSrc.replace(/export (const|function)/g, '$1') +
  '\nexports.TABLE_PAGE_ROWS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;' +
  '\nexports.columnWidthPercent = columnWidthPercent;' +
  '\nexports.pageInfo = pageInfo;' +
  '\nexports.buildRows = buildRows;' +
  '\nexports.buildHeader = buildHeader;' +
  '\nexports.buildFilters = buildFilters;' +
  '\nexports.buildActions = buildActions;')(lib);

console.log('tablePage:');

// ── pure helpers ────────────────────────────────────────────────────────────

test('pageInfo gives one page window that matches the counter', () => {
  const i = lib.pageInfo(120, 3, 25);
  assert.strictEqual(i.totalPages, 5);
  assert.strictEqual(i.page, 3);
  assert.strictEqual(i.skip, 50);
  assert.strictEqual(i.limit, 25);
  assert.ok(i.hasPrev && i.hasNext);
  // Only one page of rows is ever requested - the whole point of the design.
  assert.strictEqual(i.limit, 25, 'limit must be the page size, never the total');
});

test('pageInfo clamps a page that no longer exists', () => {
  // Rows deleted while you were on the last page must land on a real page, not
  // on an empty view with a working "next" button.
  assert.strictEqual(lib.pageInfo(10, 99, 25).page, 1);
  assert.strictEqual(lib.pageInfo(120, 99, 25).page, 5);
  assert.strictEqual(lib.pageInfo(120, 0, 25).page, 1);
  assert.strictEqual(lib.pageInfo(120, -3, 25).page, 1);
  assert.strictEqual(lib.pageInfo(120, NaN, 25).page, 1);
});

test('pageInfo on an empty table still offers page 1 of 1 (negative)', () => {
  const i = lib.pageInfo(0, 1, 25);
  assert.deepStrictEqual(
    { totalPages: i.totalPages, page: i.page, hasPrev: i.hasPrev, hasNext: i.hasNext, skip: i.skip },
    { totalPages: 1, page: 1, hasPrev: false, hasNext: false, skip: 0 });
});

test('columns get the same percentage width', () => {
  assert.strictEqual(lib.columnWidthPercent(4), '25%');
  assert.strictEqual(lib.columnWidthPercent(8), '12.5%');
  // 7 columns: equal shares that still add up to 100% when rounded.
  const each = parseFloat(lib.columnWidthPercent(7));
  assert.ok(Math.abs(each * 7 - 100) < 0.01, `7 x ${each}% should be ~100%`);
  // Never divides by zero or emits NaN%.
  assert.strictEqual(lib.columnWidthPercent(0), '100%');
  assert.strictEqual(lib.columnWidthPercent(undefined), '100%');
});

test('buildRows gives every row exactly one cell per column', () => {
  const columns = [
    { label: 'A', value: d => d.a },
    { label: 'B', value: d => d.b },
    { label: 'C', value: d => d.c },
  ];
  // The middle doc is missing two fields on purpose.
  const rows = lib.buildRows([{ a: 1, b: 2, c: 3 }, { a: 9 }], columns);
  assert.strictEqual(rows.length, 2);
  for (const row of rows) {
    assert.strictEqual(row.cells.length, columns.length,
      'a short row would shift every following column by one');
  }
  // A missing field is an empty cell, never the string "undefined".
  assert.deepStrictEqual(rows[1].cells.map(c => c.text), ['9', '', '']);
});

test('buildRows renders a user cell as a link and marks alignment', () => {
  const columns = [
    { labelKey: 'date', nowrap: true, value: () => '2026-07-25' },
    { labelKey: 'user', value: d => d.name, userId: d => d.uid },
    { label: 'Size', align: 'end', value: d => d.size },
    { labelKey: 'sev', value: d => d.sev, data: d => d.sev },
  ];
  const [row] = lib.buildRows([{ name: 'xet7', uid: 'u1', size: 12, sev: 'high' }], columns);
  assert.ok(row.cells[0].cls.includes('table-page-nowrap'));
  assert.strictEqual(row.cells[1].userId, 'u1');
  assert.ok(row.cells[2].cls.includes('table-page-end'));
  assert.strictEqual(row.cells[3].data, 'high');
  // A column with no userId function must not produce a link.
  assert.strictEqual(row.cells[0].userId, '');
});

test('buildRows survives junk input (negative)', () => {
  assert.deepStrictEqual(lib.buildRows(null, null), []);
  assert.deepStrictEqual(lib.buildRows(undefined, [{ label: 'A' }]), []);
  // A column with no value function yields an empty cell rather than throwing.
  const [row] = lib.buildRows([{}], [{ label: 'A' }]);
  assert.strictEqual(row.cells[0].text, '');
});

test('buildHeader carries the equal width and the i18n key', () => {
  const header = lib.buildHeader([
    { labelKey: 'date' }, { label: 'Size', align: 'end' },
  ]);
  assert.strictEqual(header.length, 2);
  assert.strictEqual(header[0].width, '50%');
  assert.strictEqual(header[0].labelKey, 'date');
  assert.ok(header[1].cls.includes('table-page-end'));
});

// ── the template ────────────────────────────────────────────────────────────

test('the template puts the rows in the designed order', () => {
  const order = ['table-page-title', 'table-page-status', 'table-page-controls',
    'table-page-table-wrap'];
  let at = -1;
  for (const cls of order) {
    const next = jade.indexOf(cls);
    assert.ok(next > at, `${cls} must come after the previous row (title, status, controls, table)`);
    at = next;
  }
});

test('the shared controls exist exactly once', () => {
  for (const cls of ['js-table-page-search', 'js-table-page-prev', 'js-table-page-next']) {
    const count = (jade.match(new RegExp(cls, 'g')) || []).length;
    assert.strictEqual(count, 1, `${cls} must appear once in the one template`);
  }
});

// ── the layout rules the doc promises ───────────────────────────────────────

test('the table is full width with equal, wrapping columns', () => {
  const rule = /\.table-page-table \{([^}]*)\}/.exec(css);
  assert.ok(rule, '.table-page-table must be styled');
  assert.ok(/width:\s*100%/.test(rule[1]), 'the table must fill the panel');
  assert.ok(/table-layout:\s*fixed/.test(rule[1]),
    'table-layout:fixed is what makes the columns equal AND width:100% binding; ' +
    'with auto layout a long id widens the table past the panel');
  const cells = /\.table-page-table th,\s*\n\.table-page-table td \{([^}]*)\}/.exec(css);
  assert.ok(cells, 'cells must be styled');
  assert.ok(/overflow-wrap:\s*anywhere/.test(cells[1]),
    'long unbroken text must wrap inside its cell');
  assert.ok(/vertical-align:\s*top/.test(cells[1]));
});

test('nothing can push the panel off the right edge', () => {
  assert.ok(/\.table-page \{[^}]*min-width:\s*0/.test(css),
    'min-width:0 lets the page shrink inside the flex .main-body');
  assert.ok(/\.table-page \{[^}]*max-width:\s*100%/.test(css));
  assert.ok(/\.table-page-table-wrap \{[^}]*overflow-x:\s*auto/.test(css),
    'only the table wrapper may scroll sideways, as a last resort');
});

test('narrow windows stack the table below the left menu', () => {
  const at = css.indexOf('@media screen and (max-width: 800px)');
  assert.ok(at > 0, 'there must be a narrow-window rule at the 800px phone breakpoint');
  const block = css.slice(at);
  assert.ok(/\.content-body \{\s*flex-wrap:\s*wrap/.test(block),
    'the row must be allowed to wrap so the menu and table stack');
  assert.ok(/\.side-menu \{[^}]*width:\s*100%/.test(block),
    'the menu goes full width on top');
  assert.ok(/\.main-body \{[^}]*flex:\s*1 1 100%/.test(block),
    'the table takes the full width below it');
});

// ── one implementation, not ten ─────────────────────────────────────────────

test('no report re-implements the controls or the table', () => {
  for (const gone of ['admin-report-controls', 'admin-report-pagination',
    'admin-event-controls', 'admin-event-table', 'js-files-prev-page',
    'js-rules-search-input', 'js-event-prev']) {
    assert.ok(!reportsJade.includes(gone),
      `${gone} is the old per-report copy; the shared table page replaces it`);
    assert.ok(!reportsJs.includes(gone),
      `${gone} still referenced in adminReports.js`);
  }
  // Every table renders through the one template.
  assert.ok(/\+tablePage\(tablePageData\)/.test(reportsJade));
});

test('the controls have one handler each, not one per report', () => {
  for (const cls of ['js-table-page-prev', 'js-table-page-next']) {
    const count = (reportsJs.match(new RegExp(`'click \\.${cls}'`, 'g')) || []).length;
    // One on the reports parent + one on the event-stream template.
    assert.ok(count <= 2, `${cls} should have at most 2 handlers, found ${count}`);
  }
  // The six per-report page/total helper pairs are gone.
  for (const helper of ['filesCurrentPage', 'rulesTotalPages', 'boardsCurrentPage',
    'cardsTotalPages', 'impersonationCurrentPage', 'recoveryTotalPages']) {
    assert.ok(!reportsJs.includes(helper), `${helper} is replaced by the shared pageInfo()`);
  }
});

test('the subscribed window comes from the same helper as the counter', () => {
  assert.ok(/const \{ limit, skip \} = pageInfo\(/.test(reportsJs),
    'loadReport must derive limit/skip from pageInfo, so what is fetched and what ' +
    'is displayed cannot drift apart');
  assert.ok(!/const skip = \(cfg\.page\.get\(\) - 1\) \* REPORTS_PER_PAGE/.test(reportsJs),
    'the hand-rolled second paginator must be gone');
});

// ── the doc ─────────────────────────────────────────────────────────────────

test('the design doc lists the pages and they exist in code', () => {
  for (const name of ['Security', 'Speed', 'Tests', 'CPU usage', 'Files Report',
    'Rules Report', 'Boards Report', 'Cards Report', 'Impersonation Report', 'Recovery']) {
    assert.ok(doc.includes(name), `${name} must be listed in Table.md`);
  }
  assert.ok(/\| Table name \| Menu path \| Description \|/.test(doc),
    'the listing must be a table with those three columns');
  // Each listed Admin Panel table must have a side-menu entry in the code.
  for (const id of ['report-security', 'report-speed', 'report-tests', 'report-cpu',
    'report-files', 'report-rules', 'report-boards', 'report-cards',
    'report-impersonation', 'report-recovery']) {
    // The menu is DATA now (PROBLEMS_MENU, docs/Design/Page/Left-Menu.md),
    // not markup, so it lives in the .js.
    assert.ok(reportsJs.includes(`'${id}'`), `${id} must exist in the Problems side menu`);
  }
});

test('pages that use the design link back to it', () => {
  for (const p of ['docs/Features/Reports/History/History.md',
    'docs/Features/Admin-Panel/Problems/CPU-usage.md',
    'docs/Features/Admin-Panel/Problems/Recovery.md']) {
    const src = read(p);
    assert.ok(/\[Table Page\]\((\.\.\/)+Design\/Page\/Table\.md\)/.test(src),
      `${p} must link to the shared design with a relative path`);
    const rel = /\[Table Page\]\(((?:\.\.\/)+Design\/Page\/Table\.md)\)/.exec(src)[1];
    const target = path.resolve(path.dirname(path.join(root, p)), rel);
    assert.ok(fs.existsSync(target), `${p}: link target ${rel} must exist`);
  }
});

test('the related-files table lists files that exist', () => {
  // The doc opens with a File Path / File Type / Description table. A path that
  // has moved or been renamed makes the page lie about where the code is, which
  // is the one thing a reference table must not do.
  assert.ok(doc.includes('| File Path | File Type | Description |'),
    'the related-files table must have those three columns');
  const paths = [...doc.matchAll(/\| `([a-z][\w./-]+\.(?:jade|css|js|cjs))` \|/g)].map(m => m[1]);
  assert.ok(paths.length >= 15, `expected the full file list, found ${paths.length}`);
  for (const rel of paths) {
    assert.ok(fs.existsSync(path.join(root, rel)), `related file missing: ${rel}`);
  }
  // The shared implementation must be among them.
  for (const must of ['client/components/settings/tablePage.jade',
    'client/components/settings/tablePage.css', 'models/lib/tablePage.js']) {
    assert.ok(paths.includes(must), `${must} must be listed`);
  }
  // Listed once each - the old duplicate 'Where the code is' table is gone.
  assert.strictEqual(new Set(paths).size, paths.length, 'no file listed twice');
});

test('the pager is themed by the ONE shared pager stylesheet', () => {
  // Buttons follow the per-user theme accent (Member Settings -> Change color
  // sets --theme-accent) and fall back to the WeKan default blue. That is owned
  // by paginationControls.css for every pager in the app.
  const pager = read('client/components/main/paginationControls.css');
  assert.ok(pager.includes('.table-page-pagination button,'),
    'the table page pager must be covered by the shared themed selectors');
  assert.ok(pager.includes('.table-page-page-info,'),
    'the page counter must be covered too');
  // Every state, or a clicked button falls through to the black/grey fallback in
  // forms.css, which has equal or higher specificity.
  for (const state of [':hover:not(.disabled)', ':focus:not(.disabled)',
    ':active:not(.disabled)', ':active:hover', '.disabled']) {
    assert.ok(pager.includes(`.table-page-pagination button${state}`),
      `the shared pager must style ${state}`);
  }
  assert.ok(/var\(--theme-accent, #01628c\)/.test(pager),
    'colours come from the theme accent with the WeKan blue as fallback');
  assert.ok(!/#bbb/.test(pager), 'no hardcoded grey in the shared controls');
  assert.ok(/input\.js-table-page-search/.test(jade),
    'the search field is part of the shared controls row');
});

test('the table page stylesheet does not restate button colours', () => {
  // A partial copy looks right until the button is clicked and then loses to
  // forms.css. Layout here, colour in the shared pager stylesheet. Matched by
  // SELECTOR, not by position: other rules live around these.
  const rules = css.match(/[^{}]+\{[^}]*\}/g) || [];
  for (const rule of rules) {
    const [selector, body] = rule.split('{');
    if (!/\.table-page-pagination/.test(selector)) continue;
    for (const prop of ['background', 'color:', 'border:']) {
      assert.ok(!body.includes(prop),
        `${selector.trim()} sets ${prop} - that belongs to paginationControls.css`);
    }
  }
});

test('the design doc explains the theming', () => {
  assert.ok(/## Theme/.test(doc), 'Table.md must have a Theme section');
  assert.ok(/--theme-accent/.test(doc) && /Change color/.test(doc),
    'it must name the per-user override and where it is set');
  assert.ok(/#01628c/.test(doc), 'and the WeKan default fallback');
  assert.ok(/paginationControls\.css/.test(doc),
    'and point at the one stylesheet that owns the pager colours');
});

// ═══════════════════════════════════════════════════════════════════════════
// Merged in from the former tests/adminReportsPagination.test.cjs.
//
// Those guards were written when each report had its own markup, its own
// controls row and its own stylesheet. Every one of them is about a paginated
// table, so they belong with the design they now share - and keeping them in a
// separate file meant the same page was asserted against from two places, which
// is the split this whole change removed. The last three cover the OTHER pagers
// (People/Org/Team/Domain, the board Table view, Translation): those are not
// table pages, but they share the themed pager stylesheet listed in
// docs/Design/Page/Table.md, so a change there reaches them too.
// ═══════════════════════════════════════════════════════════════════════════

// ── performance: paginated + index-backed sorts ─────────────────────────────
test('Cards report sorts by an INDEXED field (boardId,createdAt), not the unindexed {boardId,sort}', () => {
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

test('eventlog has a {stream,at} index so Security/Speed/Tests pages stay fast', () => {
  const src = read('models/eventLog.js');
  assert.ok(/ensureIndex\(EventLog, \{ stream: 1, at: -1 \}\)/.test(src),
    'the stream+at index must be created for the streamSelector sort');
  assert.ok(/ensureIndex\(EventLogAcks, \{ stream: 1 \}\)/.test(src));
});

// ── one controls row, defined once for every report ──
test('report tables have no Search button (Enter searches) and ONE shared controls row', () => {
  // The six reports used to carry six copies of this row. They now render
  // through the shared table page (docs/Design/Page/Table.md), so the row exists
  // once, in one template, with one set of handlers.
  const jade = read('client/components/settings/tablePage.jade');
  assert.ok(!/-search-button/.test(jade), 'the Search button must be gone (typing + Enter searches)');
  assert.strictEqual((jade.match(/table-page-controls/g) || []).length, 1,
    'exactly one controls row, in the one shared template');
  const reports = read('client/components/settings/adminReports.jade');
  assert.ok(!/admin-report-controls/.test(reports), 'no per-report copy may come back');
  const js = read('client/components/settings/adminReports.js');
  assert.ok(!/-search-button'\(event, tmpl\)/.test(js), 'dead search-button handlers removed');
  assert.ok(/keydown \.js-table-page-search/.test(js), 'Enter-to-search kept');
});
test('pagination controls sit at the end of the row (right; RTL-mirrored)', () => {
  const css = read('client/components/settings/tablePage.css');
  assert.ok(/\.table-page-pagination\s*\{[^}]*margin-inline-start:\s*auto/.test(css),
    'pagination must be pushed to the end of the controls row');
});

// ── theme colors: controls follow --theme-accent (Member change-color override) ──
test('no People pane keeps a pager of its own', () => {
  // All four of its table panes render through the shared table page now, so
  // their pagers are the shared one - themed by paginationControls.css like every
  // other pager in the app.
  const css = read('client/components/settings/peopleBody.css');
  for (const sel of ['people', 'org', 'team', 'domain']) {
    assert.ok(!css.includes(`.${sel}-pagination`),
      `.${sel}-pagination must be gone - that pane uses the shared pager`);
  }
  const pager = read('client/components/main/paginationControls.css');
  assert.ok(/\.table-page-pagination button,/.test(pager),
    'and the shared pager is still themed');
});

// ── column-header sorting removed everywhere ────────────────────────────────
test('clickable column-header sorting is removed from the board Table view', () => {
  const jade = read('client/components/boards/tableView.jade');
  const js = read('client/components/boards/tableView.js');
  assert.ok(!/js-table-view-sort/.test(jade) && !/js-table-view-sort/.test(js), 'no sortable headers/handler');
  assert.ok(!/sortField|sortDirection|sortIndicator/.test(js), 'sort state/helper removed');
});
test('clickable column-header sorting is removed from the Admin Domains table', () => {
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
test('Translation page subscribes with a bounded window, not limit 0 (whole collection)', () => {
  const js = read('client/components/settings/translationBody.js');
  assert.ok(/subscribe\('translation',[^,]+,\s*limitTranslations/.test(js),
    'must pass the infinite-scroll window limit');
  assert.ok(!/subscribe\('translation',[^,]+,\s*0\b/.test(js),
    'the limit-0 (= no limit = whole collection) load must be gone');
});

// ── over-fetch: Board Archive → Boards is now server-side paginated ─────────
test('archivedBoards is server-side paginated with BOTH search and pagination controls', () => {
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

test('the doc records which pages do NOT use this design, and why', () => {
  // A page with a paginated table that is not built from this design is a gap.
  // Writing it down keeps it visible instead of being re-derived from the code.
  const at = doc.indexOf('## Pages that do not use this design');
  assert.ok(at > 0, 'the section must exist');
  assert.ok(at < doc.indexOf('## Pages that use this design'),
    'it comes before the pages that DO use the design');
  const section = doc.slice(at, doc.indexOf('## Pages that use this design'));
  assert.ok(/\| People[^|]*\| Admin Panel \/ People \|/.test(section),
    'People must be listed with its menu path and a reason');
  // The reason has to say something; a row with an empty why is worse than none.
  const why = /\| People[^|]*\| Admin Panel \/ People \| ([^|]+) \|/.exec(section);
  assert.ok(why && why[1].trim().length > 80, 'the reason must actually explain');
  // Domains IS converted, so the entry must say so and the pane must render
  // through the shared template - not carry markup of its own.
  assert.ok(/are converted and listed below/.test(section),
    'the entry must record that the table panes are converted');
  const people = read('client/components/settings/peopleBody.jade');
  const domains = people.slice(people.indexOf('template(name="domainGeneral")'),
    people.indexOf('template(name="newOrgRow")'));
  assert.ok(/\+tablePage\(tablePageData\)/.test(domains), 'Domains renders the shared table page');
  assert.ok(!/table-page-controls|thead/.test(domains), 'and keeps no markup of its own');
});

// ── controls-row features taken from People ─────────────────────────────────

test('buildFilters selects the current option, as strings', () => {
  const [filter] = lib.buildFilters([{ id: 'user', labelKey: 'show', options: [
    { value: 'all', labelKey: 'all' },
    { value: 'locked', labelKey: 'locked' },
  ] }], 'locked');
  assert.strictEqual(filter.id, 'user');
  assert.deepStrictEqual(filter.options.map(o => o.selected), [false, true]);
  // A numeric value still selects.
  const [num] = lib.buildFilters([{ id: 'n', options: [{ value: 1 }, { value: 2 }] }], '2');
  assert.deepStrictEqual(num.options.map(o => o.selected), [false, true]);
});

test('buildFilters and buildActions survive junk (negative)', () => {
  assert.deepStrictEqual(lib.buildFilters(null, 'x'), []);
  assert.deepStrictEqual(lib.buildActions(undefined), []);
  // A filter with no options renders an empty select, not a crash.
  const [f] = lib.buildFilters([{ id: 'a' }], '');
  assert.deepStrictEqual(f.options, []);
  const [a] = lib.buildActions([{ id: 'unlock', labelKey: 'x' }, null]);
  assert.strictEqual(a.id, 'unlock');
  assert.strictEqual(lib.buildActions([{ id: 'unlock', labelKey: 'x' }, null]).length, 1);
});

test('the three features are ON by default in the template', () => {
  // No enabling flag: supply them and they render, in reading order between the
  // search field and the pagination.
  const at = i => jade.indexOf(i);
  assert.ok(at('js-table-page-search') < at('each filters'), 'filters follow the search field');
  assert.ok(at('each filters') < at('each actions'), 'then the actions');
  assert.ok(at('each actions') < at('table-page-total'), 'then the total');
  assert.ok(at('table-page-total') < at('table-page-pagination'), 'pagination last');
  assert.ok(!/if (filtersEnabled|showFilters|hasActions)/.test(jade),
    'no opt-in flag - the features are on by default');
  assert.ok(/data-filter=/.test(jade) && /data-action=/.test(jade),
    'a page identifies which filter/action was used by its data attribute');
});

test('the doc documents the three features as on by default', () => {
  const at = doc.indexOf('## Controls');
  const section = doc.slice(at, doc.indexOf('##', at + 5));
  assert.ok(/on by default/i.test(section), 'the doc must say they are on by default');
  for (const name of ['buildFilters', 'buildActions', 'total']) {
    assert.ok(section.includes(name), `${name} must be documented`);
  }
});

test('interactive panes get row and header slots, cells stay the default', () => {
  // Option A: a pane whose rows are interactive supplies a rowTemplate; a column
  // whose header carries controls supplies a headerTemplate. The <tr> guarantee
  // (a row can never be shorter than the header) applies to the CELLS form only,
  // and the doc has to say so.
  assert.ok(/if rowTemplate/.test(jade), 'the template supports a row slot');
  assert.ok(/each docs/.test(jade) && /\.\.\/rowTemplate/.test(jade),
    'rows come from the page own template, one per doc');
  assert.ok(/if template\n\s+\+Template\.dynamic/.test(jade),
    'a column may render its own header');
  const [h] = lib.buildHeader([{ headerTemplate: 'orgFeatureHeader', headerData: { feature: 'x' } }]);
  assert.strictEqual(h.template, 'orgFeatureHeader');
  assert.deepStrictEqual(h.data, { feature: 'x' });
  // A plain column still has no template, so the default path is unchanged.
  const [plain] = lib.buildHeader([{ labelKey: 'date' }]);
  assert.strictEqual(plain.template, '');
});

test('Organizations renders through the shared table page', () => {
  const people = read('client/components/settings/peopleBody.jade');
  const org = people.slice(people.indexOf('template(name="orgGeneral")'),
    people.indexOf('template(name="orgFeatureHeader")'));
  assert.ok(/\+tablePage\(orgTablePageData\)/.test(org), 'renders the shared page');
  assert.ok(!/thead|org-pagination/.test(org), 'and keeps no table markup of its own');
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/rowTemplate: 'orgRow'/.test(js), 'its interactive rows use the row slot');
  assert.ok(/headerTemplate: 'orgFeatureHeader'/.test(js), 'its control headers use the header slot');
  // All of People's panes render inside ONE template, so a shared-class handler
  // must act only for the pane that is open - otherwise one click pages them all.
  assert.ok(/pane === 'org-setting'/.test(js),
    'the org pager must be scoped to the open pane');
});

test('Teams renders through the shared table page, and gains a working prev', () => {
  const people = read('client/components/settings/peopleBody.jade');
  const team = people.slice(people.indexOf('template(name="teamGeneral")'),
    people.indexOf('template(name="teamFeatureHeader")'));
  assert.ok(/\+tablePage\(teamTablePageData\)/.test(team), 'renders the shared page');
  assert.ok(!/thead|team-pagination/.test(team), 'and keeps no table markup of its own');
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/rowTemplate: 'teamRow'/.test(js) && /headerTemplate: 'teamFeatureHeader'/.test(js));
  // Teams had a prev BUTTON and no handler behind it - paging back was dead.
  // Folding both panes into one scoped handler pair fixed that.
  assert.ok(/pane === 'team-setting' && tpl\.teamPage\.get\(\) > 1/.test(js),
    'Teams must now page backwards');
  assert.strictEqual((js.match(/'click \.js-table-page-prev'/g) || []).length, 1,
    'one handler for every pane - duplicate keys in one event map would overwrite');
});

test('the People pane renders through the shared table page', () => {
  const people = read('client/components/settings/peopleBody.jade');
  const pane = people.slice(people.indexOf('template(name="peopleGeneral")'),
    people.indexOf('template(name="selectAllUser")'));
  assert.ok(/\+tablePage\(peopleTablePageData\)/.test(pane));
  assert.ok(!/thead|people-pagination/.test(pane), 'no table markup of its own');
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/rowTemplate: 'peopleRow'/.test(js));
  // The page of users is ONE query now, shared by the table context and the old
  // helper - and it must not re-slice what the publication already paginated.
  assert.strictEqual((js.match(/function peopleDocs/g) || []).length, 1);
  assert.ok(!/peopleDocs\(tpl\)[\s\S]{0,200}slice\(/.test(js), 'never re-slice a published page');
  // All four table panes share one scoped pager pair.
  for (const pane of ['org-setting', 'team-setting', 'people-setting']) {
    assert.ok(js.includes(`pane === '${pane}'`), `${pane} must be handled by the shared pager`);
  }
});

test('the three non-table People panes are recorded as such, not forced in', () => {
  // Locked users is a form, Roles and Shared templates are checkbox lists. There
  // is no paginated set of rows, so the design does not apply - and the doc has to
  // say WHY, or someone will try to convert them.
  const at = doc.indexOf('## Pages that do not use this design');
  const section = doc.slice(at, doc.indexOf('## Pages that use this design'));
  for (const pane of ['Locked users', 'Roles', 'Shared templates']) {
    assert.ok(section.includes(pane), `${pane} must be listed with its reason`);
  }
  assert.ok(/not tables/i.test(section), 'and the reason must be that they are not tables');
  // Still true in the code: none of them renders the shared table page.
  const people = read('client/components/settings/peopleBody.jade');
  for (const [name, next] of [['lockedUsersGeneral', 'rolesGeneral'],
    ['rolesGeneral', 'templatesGeneral']]) {
    const pane = people.slice(people.indexOf(`template(name="${name}")`),
      people.indexOf(`template(name="${next}")`));
    assert.ok(!/\+tablePage/.test(pane), `${name} must not render a table page`);
  }
});

test('People uses the shared controls row - search, filter, actions, total', () => {
  const jadeSrc = read('client/components/settings/peopleBody.jade');
  const js = read('client/components/settings/peopleBody.js');
  // The page header no longer carries this pane's controls.
  for (const gone of ['input#searchInput', 'button#searchButton', '#userFilterSelect',
    'button#unlockAllUsers', 'button#addOrRemoveTeam']) {
    assert.ok(!jadeSrc.includes(gone), `${gone} must be gone from the page header`);
  }
  // They are declared to the shared row instead.
  assert.ok(/filters: buildFilters\(/.test(js) && /actions: buildActions\(/.test(js));
  for (const action of ['unlock-all', 'add-remove-teams']) {
    assert.ok(js.includes(`id: '${action}'`), `${action} must be a shared action`);
  }
  // Search is state now, not a DOM id read from another template.
  assert.ok(/peopleSearchTerm = new ReactiveVar/.test(js));
  assert.ok(!/\$\('#searchInput'\)/.test(js), 'filterPeople must not read a removed input');
  // And the filter reset sets state rather than poking a select that is gone.
  assert.ok(/userFilterType\.set\('all'\)/.test(js));
  // Scoped like the pager: one template hosts every pane.
  for (const cls of ['js-table-page-search', 'js-table-page-filter', 'js-table-page-action']) {
    const at = js.indexOf(`'${cls === 'js-table-page-search' ? 'keydown' : cls === 'js-table-page-filter' ? 'change' : 'click'} .${cls}'`);
    assert.ok(at > 0, `${cls} must have a handler`);
    assert.ok(js.slice(at, at + 220).includes('people-setting'),
      `${cls} must be scoped to the open pane`);
  }
});

console.log(`\ntablePage: ${passed} tests passed`);

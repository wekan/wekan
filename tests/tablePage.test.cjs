'use strict';

// The shared table page — docs/Features/Page/Table.md.
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
// tests/adminProblemsPagination.test.cjs was merged in here - it asserted against
// the same pages from a second file, which is exactly the split this change
// removed from the app code.
//
// Files under test are the ones listed in the Related files table of
// docs/Features/Page/Table.md.
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
const reportsJade = read('client/components/settings/adminProblems.jade');
const reportsJs = read('client/components/settings/adminProblems.js');
const doc = read('docs/Features/Page/Table.md');

// Load the ES module helpers without a bundler: strip the export keywords.
const lib = {};
new Function('exports', libSrc.replace(/export (const|function)/g, '$1') +
  '\nexports.TABLE_PAGE_ROWS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;' +
  '\nexports.columnWidthPercent = columnWidthPercent;' +
  '\nexports.pageInfo = pageInfo;' +
  '\nexports.adjacentPage = adjacentPage;' +
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

test('adjacentPage moves one page and clamps both boundaries', () => {
  assert.strictEqual(lib.adjacentPage(120, 3, -1, 25), 2);
  assert.strictEqual(lib.adjacentPage(120, 3, 1, 25), 4);
  assert.strictEqual(lib.adjacentPage(120, 1, -1, 25), 1);
  assert.strictEqual(lib.adjacentPage(120, 5, 1, 25), 5);
});

test('adjacentPage normalizes direction and rejects invalid movement', () => {
  assert.strictEqual(lib.adjacentPage(120, 3, -99, 25), 2);
  assert.strictEqual(lib.adjacentPage(120, 3, 99, 25), 4);
  assert.strictEqual(lib.adjacentPage(120, 3, 0, 25), 3);
  assert.strictEqual(lib.adjacentPage(120, 3, 'nowhere', 25), 3);
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

test('buildRows preserves supplied initials for users absent from client cache', () => {
  const [row] = lib.buildRows([{ uid: 'u1' }], [{
    labelKey: 'office-people',
    users: d => [{ userId: d.uid, text: 'Lauri Ojansivu', initials: 'LO' }],
  }]);
  assert.deepStrictEqual(row.cells[0].users.map(user => user.initials), ['LO']);
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

test('an empty table still renders its header, so the New link is reachable', () => {
  // Organizations, Teams, People and Translation put their "New" link IN the
  // header (headerTemplate). The table used to be inside `if rowCount`, so an
  // empty pane rendered no table, no header and therefore no way to create the
  // FIRST organization, team, user or translation.
  const at = jade.indexOf('.table-page-table-wrap');
  const emptyAt = jade.indexOf('.table-page-empty');
  assert.ok(at > 0 && emptyAt > at,
    'the empty message comes BELOW the table, not instead of it');
  assert.ok(/unless rowCount\n\s+\.table-page-empty/.test(jade),
    'the message is what is conditional - the table is not');
  const before = jade.slice(0, at);
  assert.ok(!/if rowCount/.test(before),
    'nothing may gate the table itself on there being rows');
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
      `${gone} still referenced in adminProblems.js`);
  }
  // Every table renders through the one template.
  assert.ok(/\+tablePage\(tablePageData\)/.test(reportsJade));
});

test('the controls have one handler each, not one per report', () => {
  for (const cls of ['js-table-page-prev', 'js-table-page-next']) {
    const count = (reportsJs.match(new RegExp(`'click \\.${cls}'`, 'g')) || []).length;
    // One on the reports parent, plus one per METHOD-BACKED report template -
    // eventStreamReport and officeReport. Those two do not go through the
    // parent's reportConfig(), which is built around publications, so they carry
    // their own paginator. What this guards against is a handler per REPORT,
    // which is what the parent's single pair exists to avoid.
    assert.ok(count <= 3, `${cls} should have at most 3 handlers, found ${count}`);
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

test('every paginated page loads the SAME ten rows at a time', () => {
  // One number for the whole app, wherever the pager is drawn: the shared table
  // page, the Admin Panel reports and event streams, the People panes, the search
  // pages and the archive. A page that writes its own is the bug this pins.
  assert.strictEqual(lib.TABLE_PAGE_ROWS_PER_PAGE, 10,
    'the app pages ten rows at a time (docs/Features/Page/Table.md)');
  const sources = {
    'client/components/settings/adminProblems.js':
      ['const REPORTS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;',
       'const EVENTS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;'],
    'client/components/settings/peopleBody.js':
      ['const orgsPerPage = TABLE_PAGE_ROWS_PER_PAGE;',
       'const teamsPerPage = TABLE_PAGE_ROWS_PER_PAGE;',
       'const usersPerPage = TABLE_PAGE_ROWS_PER_PAGE;',
       'const domainsPerPage = TABLE_PAGE_ROWS_PER_PAGE;'],
    'client/lib/cardSearch.js':
      ['this.resultsPerPage = TABLE_PAGE_ROWS_PER_PAGE;'],
    'client/components/boards/boardArchive.js':
      ['const ARCHIVED_BOARDS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;'],
  };
  for (const [file, lines] of Object.entries(sources)) {
    const src = read(file);
    for (const line of lines) {
      assert.ok(src.includes(line), `${file} must read the shared number: ${line}`);
    }
    assert.ok(src.includes('TABLE_PAGE_ROWS_PER_PAGE }') ||
      /TABLE_PAGE_ROWS_PER_PAGE[,\s}]/.test(src.slice(0, src.indexOf('\n\n'))) ||
      /import \{[^}]*TABLE_PAGE_ROWS_PER_PAGE/.test(src),
      `${file} must import it rather than redefine it`);
  }
  // The one module that cannot import it - a plain-node test require()s it - must
  // still carry the same number.
  const { PER_PAGE_DEFAULT } = require('../models/lib/domainTablePage');
  assert.strictEqual(PER_PAGE_DEFAULT, lib.TABLE_PAGE_ROWS_PER_PAGE,
    'domainTablePage.PER_PAGE_DEFAULT must not drift from the shared number');
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
    // The menu is DATA now (PROBLEMS_MENU, docs/Features/Page/Left-Menu.md),
    // not markup, so it lives in the .js.
    assert.ok(reportsJs.includes(`'${id}'`), `${id} must exist in the Problems side menu`);
  }
});

test('pages that use the design link back to it', () => {
  for (const p of ['docs/Features/Reports/History/History.md',
    'docs/Features/Admin-Panel/Problems/CPU-usage.md',
    'docs/Features/Admin-Panel/Problems/Recovery.md']) {
    const src = read(p);
    assert.ok(/\[Table Page\]\((\.\.\/)+Features\/Page\/Table\.md\)/.test(src),
      `${p} must link to the shared design with a relative path`);
    const rel = /\[Table Page\]\(((?:\.\.\/)+Features\/Page\/Table\.md)\)/.exec(src)[1];
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
// Merged in from the former tests/adminProblemsPagination.test.cjs.
//
// Those guards were written when each report had its own markup, its own
// controls row and its own stylesheet. Every one of them is about a paginated
// table, so they belong with the design they now share - and keeping them in a
// separate file meant the same page was asserted against from two places, which
// is the split this whole change removed. The last three cover the OTHER pagers
// (People/Org/Team/Domain, the board Table view, Translation): those are not
// table pages, but they share the themed pager stylesheet listed in
// docs/Features/Page/Table.md, so a change there reaches them too.
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
  assert.ok(/publishReportPage\(this, 'report-cards'/.test(block),
    'and NAME the page it published, so the client renders that page and not '
    + 'whatever else minimongo holds');
  // The client does not sort at all any more: it asks for the named page and
  // renders it in the order the server sent, which is the only order that can
  // agree with the paging. It used to re-sort minimongo with a copy of the
  // publication's sort - two places to keep in step, and a page that showed rows
  // the publication had not sent (an open card, the boards the All Boards page
  // had already loaded).
  const client = read('client/components/settings/adminProblems.js');
  assert.ok(/reportPageResults\(Cards, 'report-cards'\)/.test(client),
    'client must render the page the server named');
  assert.ok(!/collectionResults\(Cards,/.test(client),
    'and must not re-query the collection for this report');
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
  // through the shared table page (docs/Features/Page/Table.md), so the row exists
  // once, in one template, with one set of handlers.
  const jade = read('client/components/settings/tablePage.jade');
  assert.ok(!/-search-button/.test(jade), 'the Search button must be gone (typing + Enter searches)');
  assert.strictEqual((jade.match(/table-page-controls/g) || []).length, 1,
    'exactly one controls row, in the one shared template');
  const reports = read('client/components/settings/adminProblems.jade');
  assert.ok(!/admin-report-controls/.test(reports), 'no per-report copy may come back');
  const js = read('client/components/settings/adminProblems.js');
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
test('the board Table view has one client-side sorting handler', () => {
  const jade = read('client/components/boards/tableView.jade');
  const js = read('client/components/boards/tableView.js');
  assert.ok(/js-table-view-sort/.test(jade) && /click \.js-table-view-sort/.test(js));
  assert.strictEqual((js.match(/click \.js-table-view-sort/g) || []).length, 1);
  assert.ok(/compareTableViewRows/.test(js), 'all columns share the tested comparator');
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

// ── Admin Panel / Settings / Translation ────────────────────────────────────
test('Translation renders through the shared table page', () => {
  const jadeSrc = read('client/components/settings/translationBody.jade');
  const js = read('client/components/settings/translationBody.js');
  const pane = jadeSrc.slice(jadeSrc.indexOf('template(name="translationSettings")'),
    jadeSrc.indexOf('template(name="newTranslationRow")'));
  assert.ok(/\+tablePage\(tablePageData\)/.test(pane), 'the pane IS the shared table page');
  assert.ok(!/thead|table-page-controls|searchTranslationButton/.test(pane),
    'and keeps no table, controls row or Search button of its own');
  // Its rows are interactive and its "New" link is a column header: the two slots.
  assert.ok(/rowTemplate: 'translationRow'/.test(js), 'interactive rows use the row slot');
  assert.ok(/headerTemplate: 'newTranslationRow'/.test(js), 'the New link uses the header slot');
  // The helper is on the template that renders it - Blaze never looks at an
  // enclosing template, and a missing context draws the chrome and no table.
  assert.ok(/Template\.translationSettings\.helpers\(\{[\s\S]*?tablePageData\(\)/.test(js),
    'tablePageData must be a helper of translationSettings');
  // Shared control classes, so no new markup and no new handler names.
  for (const cls of ['js-table-page-search', 'js-table-page-prev', 'js-table-page-next']) {
    assert.ok(js.includes(cls), `${cls} must be handled by the pane`);
  }
  assert.ok(!/searchTranslationInput|searchTranslationButton/.test(js),
    'the hand-written search box and its button are gone');
  // The row template still owns four cells, one per column.
  const row = jadeSrc.slice(jadeSrc.indexOf('template(name="translationRow")'),
    jadeSrc.indexOf('template(name="editTranslationPopup")'));
  assert.strictEqual((row.match(/^    td/gm) || []).length, 4,
    'the row must match the four columns of the header');
});

test('Translation pages ONE page server-side, with a count method', () => {
  // It used to grow a window by infinite scroll (and before that subscribed with
  // limit 0 - in Mongo, NO limit: every custom string of every language at once).
  const js = read('client/components/settings/translationBody.js');
  assert.ok(/const \{ limit, skip \} = pageInfo\(/.test(js),
    'the subscribed window comes from pageInfo, like the counter');
  assert.ok(/subscribe\('translation',[^,]+,\s*limit,\s*skip\)/.test(js),
    'one page, server-side');
  assert.ok(!/InfiniteScrolling|loadNextPage/.test(js),
    'the infinite scrolling must be gone - two paging mechanisms would fight');
  assert.ok(!/subscribe\('translation',[^,]+,\s*0\b/.test(js),
    'the limit-0 (= no limit = whole collection) load must stay gone');
  const pub = read('server/publications/translation.js');
  assert.ok(/publish\('translation', async function\(query, limit, skip = 0\)/.test(pub),
    'the publication must take a skip');
  assert.ok(/skip:\s*skip \|\| 0/.test(pub), 'and apply it server-side');
  // The client re-applies the publication's sort, so the field must be published
  // or minimongo has nothing to sort by.
  assert.ok(/sort:\s*\{\s*modifiedAt:\s*-1\s*\}/.test(pub) && /modifiedAt:\s*1,/.test(pub),
    'the sort field must be published too');
  assert.ok(/sort:\s*\{\s*modifiedAt:\s*-1\s*\}/.test(js),
    'and the client must sort the same way the server paged');
  const model = read('server/models/translation.js');
  assert.ok(/getTranslationsCollectionCount/.test(model), 'the total comes from a count method');
  assert.ok(/not-authorized/.test(model.slice(model.indexOf('getTranslationsCollectionCount'))),
    'which is admin-only, like the publication');
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
  assert.ok(/\+tablePage\(this\)/.test(org), 'renders the shared page from the context it was given');
  assert.ok(!/thead|org-pagination/.test(org), 'and keeps no table markup of its own');
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/rowTemplate: 'orgRow'/.test(js), 'its interactive rows use the row slot');
  assert.ok(/headerTemplate: 'orgFeatureHeader'/.test(js), 'its control headers use the header slot');
  // All of People's panes render inside ONE template, so a shared-class handler
  // must act only for the pane that is open - otherwise one click pages them all.
  assert.ok(/'org-setting': \{ page: tpl\.orgPage/.test(js),
    'the org pager must be scoped to the open pane');
});

test('Teams renders through the shared table page, and gains a working prev', () => {
  const people = read('client/components/settings/peopleBody.jade');
  const team = people.slice(people.indexOf('template(name="teamGeneral")'),
    people.indexOf('template(name="teamFeatureHeader")'));
  assert.ok(/\+tablePage\(this\)/.test(team), 'renders the shared page from the context it was given');
  assert.ok(!/thead|team-pagination/.test(team), 'and keeps no table markup of its own');
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/rowTemplate: 'teamRow'/.test(js) && /headerTemplate: 'teamFeatureHeader'/.test(js));
  // Teams had a prev BUTTON and no handler behind it - paging back was dead.
  // Folding both panes into one scoped handler pair fixed that.
  assert.ok(/'team-setting': \{ page: tpl\.teamPage/.test(js) &&
    /moveActivePeoplePage\(tpl, -1\)/.test(js),
    'Teams must now page backwards');
  // One handler for every People pane, because a duplicate key in ONE event map
  // silently overwrites the earlier one. Scoped to Template.people.events: this
  // used to count the whole file, which also forbade a handler on a DIFFERENT
  // template - and Roles Status is exactly that, its own template with its own
  // paging state (Template.rolesGeneral.events). A separate map is not a
  // duplicate key; it is how two panes that do not share state stay apart.
  const peopleEvents = js.slice(js.indexOf('Template.people.events({'));
  const oneMap = peopleEvents.slice(0, peopleEvents.indexOf('\nTemplate.'));
  assert.ok(oneMap.length > 0, 'Template.people.events must exist');
  assert.strictEqual((oneMap.match(/'click \.js-table-page-prev'/g) || []).length, 1,
    'one handler for every pane - duplicate keys in one event map would overwrite');
});

test('the People pane renders through the shared table page', () => {
  const people = read('client/components/settings/peopleBody.jade');
  const pane = people.slice(people.indexOf('template(name="peopleGeneral")'),
    people.indexOf('template(name="selectAllUser")'));
  assert.ok(/\+tablePage\(this\)/.test(pane));
  assert.ok(!/thead|people-pagination/.test(pane), 'no table markup of its own');
  const js = read('client/components/settings/peopleBody.js');
  assert.ok(/rowTemplate: 'peopleRow'/.test(js));
  // The page of users is ONE query now, shared by the table context and the old
  // helper - and it must not re-slice what the publication already paginated.
  assert.strictEqual((js.match(/function peopleDocs/g) || []).length, 1);
  assert.ok(!/peopleDocs\(tpl\)[\s\S]{0,200}slice\(/.test(js), 'never re-slice a published page');
  // All four table panes share one scoped pager pair.
  for (const [pane, page] of [['org-setting', 'orgPage'], ['team-setting', 'teamPage'],
    ['people-setting', 'peoplePage']]) {
    assert.ok(js.includes(`'${pane}': { page: tpl.${page}`),
      `${pane} must be handled by the shared pager`);
  }
});

test('the non-table People panes are recorded as such, not forced in', () => {
  // Locked users is a form and Shared templates is a checkbox list. There is no
  // set of rows, so the design does not apply - and the doc has to say WHY, or
  // someone will try to convert them.
  //
  // Roles used to be listed here too, for the same reason: it is a checkbox list.
  // It still is - and it has since gained a READ-ONLY table underneath it, Roles
  // Status, showing what each role may do. So the pane renders both, and the
  // exclusion now covers only the two that are still nothing but a form.
  const at = doc.indexOf('## Pages that do not use this design');
  const section = doc.slice(at, doc.indexOf('## Pages that use this design'));
  for (const pane of ['Locked users', 'Shared templates']) {
    assert.ok(section.includes(pane), `${pane} must be listed with its reason`);
  }
  assert.ok(/not tables/i.test(section), 'and the reason must be that they are not tables');

  const people = read('client/components/settings/peopleBody.jade');
  const paneSrc = (name, next) => people.slice(
    people.indexOf(`template(name="${name}")`), people.indexOf(`template(name="${next}")`));

  for (const [name, next] of [['lockedUsersGeneral', 'rolesGeneral'],
    ['templatesGeneral', 'orgRow']]) {
    assert.ok(!/\+tablePage/.test(paneSrc(name, next)),
      `${name} must not render a table page`);
  }

  // Roles is the one that changed, so pin the new truth rather than dropping it.
  const roles = paneSrc('rolesGeneral', 'templatesGeneral');
  assert.ok(/\+tablePage\(rolesStatusTable\)/.test(roles),
    'Roles renders the shared table page for its Roles Status pane');
  assert.ok(/js-roles-save/.test(roles), 'below the Save button of its checkbox list');
  assert.ok(roles.indexOf('js-roles-save') < roles.indexOf('+tablePage'),
    'the table comes AFTER the Save button, which is where it was asked for');
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
  for (const [cls, evt] of [['js-table-page-filter', 'change'],
    ['js-table-page-action', 'click']]) {
    const at = js.indexOf(`'${evt} .${cls}'`);
    assert.ok(at > 0, `${cls} must have a handler`);
    assert.ok(js.slice(at, at + 220).includes('people-setting'),
      `${cls} must be scoped to the open pane`);
  }
  // The search box serves THREE panes now: Organizations and Teams searched from
  // boxes in the page-title bar, and that bar is gone. One handler, dispatching on
  // the open pane - so it must name all three, or a pane searches the wrong list.
  const searchAt = js.indexOf("'keydown .js-table-page-search'");
  assert.ok(searchAt > 0, 'the search must have a handler');
  const handler = js.slice(searchAt, searchAt + 900);
  for (const pane of ['people-setting', 'org-setting', 'team-setting']) {
    assert.ok(handler.includes(pane), `the search must handle ${pane}`);
  }
  assert.ok(/activeMenuId\.get\(\)/.test(handler), 'dispatching on the open pane');
  // Each pane keeps its own term, so switching panes does not carry a search across.
  for (const v of ['peopleSearchTerm', 'orgSearchTerm', 'teamSearchTerm']) {
    assert.ok(js.includes(`${v} = new ReactiveVar`), `${v} must exist`);
  }
  // ...and the removed inputs must not be read any more.
  for (const gone of ['#searchOrgInput', '#searchTeamInput']) {
    assert.ok(!js.includes(gone), `${gone} is gone with the title bar`);
  }
});

test('the admin panel does not force ANY table wide', () => {
  // Reported on Domains, and again on Admin Panel / Version: the right-hand
  // columns were off screen until you scrolled. settingBody.css used to give every
  // table in the admin body a 1200px floor, width:max-content and nowrap cells -
  // written to FORCE a horizontal scrollbar, long before this design existed. On
  // `.table-page-table` it overrode exactly what makes the shared page fit; on a
  // two-column Version table it put the value a thousand pixels from its label.
  // A 1200px floor is not a property of the data. It is gone for every admin
  // table, and the shared page is excluded from what remains.
  const settings = read('client/components/settings/settingBody.css');
  const wide = /\.main-body table(:not\([^)]*\))? \{([^}]*)\}/.exec(settings);
  assert.ok(wide, 'admin tables must still be sized somewhere');
  assert.ok(!/min-width:\s*1200px/.test(wide[2]), 'no table gets a 1200px floor any more');
  assert.ok(!/max-content/.test(wide[2]), 'and none is sized to its content');
  assert.ok(/width:\s*100%/.test(wide[2]), 'an admin table fits its panel');
  assert.ok(wide[1] === ':not(.table-page-table)',
    'and the shared table page keeps its own layout');
  // The cell rules wrap now instead of forcing nowrap and per-column minimums -
  // either one alone is enough to push a table past the panel.
  for (const cell of ['td', 'th']) {
    const rule = new RegExp(`\\.main-body table(:not\\([^)]*\\))? ${cell}[ ,]`).exec(settings);
    assert.ok(rule && rule[1] === ':not(.table-page-table)',
      `the ${cell} rule must exclude the shared table page too`);
  }
  const cells = /\.main-body table:not\(\.table-page-table\) td,\s*\n[^{]*\{([^}]*)\}/.exec(settings);
  assert.ok(cells && /white-space:\s*normal/.test(cells[1]) && /overflow-wrap/.test(cells[1]),
    'admin table cells wrap rather than push the table wide');
  // ...and the panel no longer shows a scrollbar for content that fits.
  const body = /\.main-body \{([^}]*)\}/.exec(settings);
  assert.ok(/overflow-x:\s*auto/.test(body[1]),
    'a page whose content fits must not get a scrollbar with nothing to scroll to');
  // The shared table still owns its own sideways scrolling, as a last resort.
  assert.ok(/\.table-page-table-wrap \{[^}]*overflow-x:\s*auto/.test(css),
    'the table wrapper is the one element allowed to scroll sideways');
});

test('every +tablePage(name) resolves where it is written', () => {
  // Organizations, Teams and People rendered their search box and their pager but NO
  // TABLE. Their wrappers said `+tablePage(orgTablePageData)` while that helper was
  // registered on Template.people - the PARENT. Blaze resolves a name against the
  // current template's helpers, the global helpers and the data context; it never
  // searches an enclosing template. So the context was undefined, and a table page
  // with no rowCount draws its chrome and stops. Nothing threw, and every test passed.
  //
  // Domains is the control: its helper sits on Template.domainGeneral, the template
  // that uses it, and Domains kept working throughout.
  const jadeSrc = read('client/components/settings/peopleBody.jade');
  const jsSrc = read('client/components/settings/peopleBody.js');
  // Which template each `+tablePage(...)` call is inside.
  const templates = [];
  for (const line of jadeSrc.split('\n')) {
    const t = /^template\(name="(\w+)"\)/.exec(line);
    if (t) templates.push({ name: t[1], args: [] });
    const call = /\+tablePage\((\w+)\)/.exec(line);
    if (call && templates.length) templates[templates.length - 1].args.push(call[1]);
  }
  const calls = templates.filter(t => t.args.length);
  assert.ok(calls.length >= 4, 'the People panes must render the shared table page');
  for (const { name, args } of calls) {
    for (const arg of args) {
      // `this` is the context handed down by the parent - always resolvable.
      if (arg === 'this') continue;
      // Otherwise the helper must be registered on THIS template.
      const owner = new RegExp(`Template\\.${name}\\.helpers\\(\\{[\\s\\S]*?\\n\\}\\);`)
        .exec(jsSrc);
      assert.ok(owner && owner[0].includes(`${arg}()`),
        `${name} renders +tablePage(${arg}) but ${arg} is not a helper of ${name} - `
        + 'Blaze will not find it on an enclosing template, and the table silently '
        + 'disappears');
    }
  }
});

test('Broken cards is a report like the ones beside it', () => {
  // It was the one entry in the Problems menu with a different set of controls: no
  // search box, no total, no "page X / N", just its own prev/next - because it ran
  // on the global-search machinery instead of a column spec.
  const js = read('client/components/settings/adminProblems.js');
  assert.ok(/'report-broken': \{ page: tmpl\.brokenPage[\s\S]*?pub: 'brokenCardsReport'[\s\S]*?countMethod: 'getBrokenCardsReportCount' \}/.test(js),
    'it must be driven by the same loadReport() config as the other reports');
  assert.ok(/'report-broken': \{\n\s+emptyKey/.test(js), 'and have a column spec');
  // The CODE, without comments: the comment above the report's config NAMES the
  // machinery it no longer uses ("used to run on the global-search machinery
  // (CardSearchPaged, ...)"), and a guard that reads comments as code fails on the
  // sentence that explains the fix.
  const code = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/CardSearchPaged/.test(code) && !/Template\.brokenCardsReport/.test(code),
    'the global-search machinery must be gone from the Problems page');
  const jadeSrc = read('client/components/settings/adminProblems.jade');
  assert.ok(!/brokenCardsReport/.test(jadeSrc), 'and its template with it');
  // Server: one page, searchable, admin-only, with a count method beside it.
  const pub = read('server/publications/cards.js');
  assert.ok(/publish\('brokenCardsReport', async function\(searchTerm = '', limit, skip = 0\)/.test(pub),
    'the report publication takes searchTerm + limit/skip');
  const block = pub.slice(pub.indexOf("publish('brokenCardsReport'"));
  assert.ok(/isAdmin/.test(block.slice(0, 600)), 'admin-only, like every report publication');
  assert.ok(/getBrokenCardsReportCount\(searchTerm/.test(pub), 'and a count method takes the search term');
  // What "broken" means is ONE definition, shared with the standalone page - which
  // still runs on the global search and must keep its own publication.
  assert.ok(/const BROKEN_CARDS_SELECTOR =/.test(pub), 'one selector');
  assert.strictEqual((pub.match(/type: \{ \$nin: CARD_TYPES \}/g) || []).length, 1,
    'defined once, not copied into the report');
  assert.ok(/publish\('brokenCards', async function\(sessionId\)/.test(pub),
    'the standalone /broken-cards page keeps its publication');
});

test('Problems pagers ignore panes that own separate pagination state', () => {
  const js = read('client/components/settings/adminProblems.js');

  // Event-stream and Office table controls are descendants of adminProblems.
  // Blaze therefore also offers their events to the parent's delegated table
  // handlers. Those pane ids deliberately have no reportConfig entry: they use
  // their own publication and pagination state. A missing guard made Next read
  // cfg.count and throw instead of letting the child pager finish its request.
  for (const functionName of ['goPrevPage', 'goNextPage', 'runSearch']) {
    const start = js.indexOf(`function ${functionName}(`);
    const end = js.indexOf('\n}', start) + 2;
    assert.ok(start >= 0 && end > start, `${functionName} must exist`);
    const body = js.slice(start, end);
    const configLookup = body.indexOf('const cfg = reportConfig(tmpl)[reportId];');
    const missingGuard = body.indexOf('if (!cfg) return;');
    assert.ok(configLookup >= 0 && missingGuard > configLookup,
      `${functionName} must ignore a report id without shared table state`);
  }

  for (const templateName of ['eventStreamReport', 'officeReport']) {
    const start = js.indexOf(`Template.${templateName}.events({`);
    const end = js.indexOf('\n});', start) + 4;
    const events = js.slice(start, end);
    for (const direction of ['prev', 'next']) {
      const handler = new RegExp(
        `'click \\.js-table-page-${direction}'\\(event, tmpl\\) \\{[\\s\\S]*?event\\.stopPropagation\\(\\);`,
      );
      assert.ok(handler.test(events),
        `${templateName} ${direction} must not bubble into the shared Problems pager`);
    }
  }

  const officeStart = js.indexOf('Template.officeReport.events({');
  const officeEnd = js.indexOf('\n});', officeStart) + 4;
  const officeEvents = js.slice(officeStart, officeEnd);
  assert.ok(/'keydown \.js-table-page-search'\(event, tmpl\) \{[\s\S]*?event\.stopPropagation\(\);/.test(officeEvents),
    'Office search Enter must not bubble into the shared Problems search handler');
});

// ── one row of controls, one height, one theme ─────────────────────────────

test('every control in the row shares one height and no margin', () => {
  // forms.css is `button { display: block; margin-bottom: 14px; min-height: 41px }`,
  // written for stacked form buttons. In this row that margin is part of the flex
  // item, so a button that keeps it is centred HIGHER than one that does not -
  // People's "Unlock all users" sat lower than "Teams" beside it.
  const rule = /\.table-page-controls button,[\s\S]*?\{([^}]*)\}/.exec(css);
  assert.ok(rule, 'the controls row must set the button geometry itself');
  assert.ok(/margin:\s*0/.test(rule[1]), 'no button may keep a margin of its own');
  assert.ok(/height:\s*34px/.test(rule[1]), 'and they are all the search field height');
  // The pager is spelled out: paginationControls.css sizes it at the same
  // specificity, and load order must not decide the layout.
  assert.ok(/\.table-page-controls \.table-page-pagination button/.test(css),
    'the pager must be covered at a specificity that cannot lose');
  // A page may not bring geometry of its own for an action button.
  const people = read('client/components/settings/peopleBody.js');
  assert.ok(!/cls: 'unlock-all-btn'/.test(people),
    'the action must not carry a class with its own margin and height');
  assert.ok(!/\.unlock-all-btn \{/.test(read('client/components/settings/peopleBody.css')),
    'and that class must be gone from the stylesheet');
});

test('action buttons are themed, not black', () => {
  // Bare <button>s fall through to forms.css, whose fallback is literally #000.
  const pager = read('client/components/main/paginationControls.css');
  const at = pager.indexOf('.table-page-controls button.js-table-page-action');
  assert.ok(at > 0, 'the action buttons must be themed with the rest of the row');
  const block = pager.slice(at);
  assert.ok(/background:\s*var\(--theme-accent, #01628c\)/.test(block),
    'filled with the theme accent, WeKan blue as the fallback');
  for (const state of [':hover', ':focus', ':active', ':active:hover']) {
    assert.ok(pager.includes(`.table-page-controls button.js-table-page-action${state}`),
      `every state must be spelled out - ${state} is missing, so forms.css wins there`);
  }
  // Layout stays in the table page stylesheet.
  assert.ok(!/background/.test(/\.table-page-controls button\.js-table-page-action \{([^}]*)\}/.exec(css)[1]),
    'tablePage.css must not restate the colour');
});

// ── nothing outside the design may decide the width ─────────────────────────

test('no admin stylesheet forces a table wider than its panel', () => {
  // Reported twice: Domains with its right-hand columns off screen, and Admin
  // Panel / Version with the value column cut off at the window edge. Both came
  // from `min-width: 1200px !important; width: max-content !important` on a bare
  // `table` selector - one of them (peopleBody.css) with no page in the selector
  // at all, so it reached every table in the app AND beat this design's own
  // layout through !important.
  // Comments are stripped first: these files EXPLAIN the rules they used to have,
  // and the explanation is not a rule.
  const rules = sheet => read(sheet).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const sheet of ['client/components/settings/peopleBody.css',
    'client/components/settings/settingBody.css',
    'client/components/settings/translationBody.css']) {
    const src = rules(sheet);
    assert.ok(!/min-width:\s*1200px/.test(src), `${sheet}: the 1200px floor must be gone`);
    assert.ok(!/width:\s*max-content/.test(src), `${sheet}: max-content width must be gone`);
  }
  // What is left in those sheets must not reach a table page either.
  for (const sheet of ['client/components/settings/peopleBody.css',
    'client/components/settings/translationBody.css']) {
    const src = rules(sheet);
    for (const line of src.split('\n')) {
      assert.ok(!/^table[ ,{]/.test(line),
        `${sheet}: "${line.trim()}" is an app-wide table rule - scope it with `
        + ':not(.table-page-table)');
    }
  }
  // And the design defends itself: its own width cannot be overridden from outside.
  const rule = /\.table-page-table \{([^}]*)\}/.exec(css)[1];
  for (const prop of ['width', 'max-width', 'table-layout']) {
    assert.ok(new RegExp(`${prop}:[^;]*!important`).test(rule),
      `${prop} must be !important - it IS the design`);
  }
});

console.log(`\ntablePage: ${passed} tests passed`);

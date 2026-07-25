'use strict';

// The shared table page — docs/Design/Table-Page.md.
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
const doc = read('docs/Design/Table-Page.md');

// Load the ES module helpers without a bundler: strip the export keywords.
const lib = {};
new Function('exports', libSrc.replace(/export (const|function)/g, '$1') +
  '\nexports.TABLE_PAGE_ROWS_PER_PAGE = TABLE_PAGE_ROWS_PER_PAGE;' +
  '\nexports.columnWidthPercent = columnWidthPercent;' +
  '\nexports.pageInfo = pageInfo;' +
  '\nexports.buildRows = buildRows;' +
  '\nexports.buildHeader = buildHeader;')(lib);

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
    assert.ok(doc.includes(name), `${name} must be listed in Table-Page.md`);
  }
  assert.ok(/\| Table name \| Menu path \| Description \|/.test(doc),
    'the listing must be a table with those three columns');
  // Each listed Admin Panel table must have a side-menu entry in the code.
  for (const id of ['report-security', 'report-speed', 'report-tests', 'report-cpu',
    'report-files', 'report-rules', 'report-boards', 'report-cards',
    'report-impersonation', 'report-recovery']) {
    assert.ok(reportsJade.includes(id), `${id} must exist in the Problems side menu`);
  }
});

test('pages that use the design link back to it', () => {
  for (const p of ['docs/Features/Reports/History/History.md',
    'docs/Features/Admin-Panel/Problems/CPU-usage.md',
    'docs/Features/Admin-Panel/Problems/Recovery.md']) {
    const src = read(p);
    assert.ok(/\[Table Page\]\((\.\.\/)+Design\/Table-Page\.md\)/.test(src),
      `${p} must link to the shared design with a relative path`);
    const rel = /\[Table Page\]\(((?:\.\.\/)+Design\/Table-Page\.md)\)/.exec(src)[1];
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
});

test('the table page stylesheet does not restate button colours', () => {
  // A partial copy looks right until the button is clicked and then loses to
  // forms.css. Layout here, colour in the shared pager stylesheet.
  const block = css.slice(css.indexOf('.table-page-pagination'));
  const pagerRules = block.slice(0, block.indexOf('.table-page-table-wrap'));
  for (const prop of ['background', 'color:', 'border:']) {
    assert.ok(!new RegExp(`\\n\\s*${prop}`).test(pagerRules),
      `tablePage.css must not set ${prop} on the pager - that belongs to paginationControls.css`);
  }
});

test('the design doc explains the theming', () => {
  assert.ok(/## Theme/.test(doc), 'Table-Page.md must have a Theme section');
  assert.ok(/--theme-accent/.test(doc) && /Change color/.test(doc),
    'it must name the per-user override and where it is set');
  assert.ok(/#01628c/.test(doc), 'and the WeKan default fallback');
  assert.ok(/paginationControls\.css/.test(doc),
    'and point at the one stylesheet that owns the pager colours');
});

console.log(`\ntablePage: ${passed} tests passed`);

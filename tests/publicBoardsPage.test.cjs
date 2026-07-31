'use strict';

// /public is its own read-only table page, not All Boards with a different query.
// Run: node tests/publicBoardsPage.test.cjs
//
// It used to render `boardList` with `{ permission: 'public' }` swapped in, which
// brought the whole of All Boards with it: the Starred / Templates / Remaining
// menu, the workspaces tree, the org and team filters, Multi-Selection with its
// archive and duplicate actions, the sort popup, board dragging and an "Add board"
// tile. None of that means anything for a list of somebody else's public boards,
// and some of it offered actions the visitor has no rights to - Multi-Selection
// offered to archive boards they do not own.
//
// Design: docs/Design/Page/Public.md, which is docs/Design/Page/Table.md.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

const jade = read('client/components/boards/publicBoards.jade');
const js = read('client/components/boards/publicBoards.js');
const css = read('client/components/boards/publicBoards.css');
const router = read('config/router.js');
const publications = read('server/publications/boards.js');
const design = read('docs/Design/Page/Public.md');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('publicBoardsPage:');

test('/public renders this page, not All Boards', () => {
  const at = router.indexOf("FlowRouter.route('/public'");
  assert.notStrictEqual(at, -1, 'the route must exist');
  const route = router.slice(at, router.indexOf('});', at));
  assert.ok(/content: 'publicBoards'/.test(route), 'it must render publicBoards');
  assert.ok(!/content: 'boardList'/.test(route), 'and not the All Boards page');
});

test('the page is ONLY the table', () => {
  // Everything All Boards puts around its grid must be absent - this is the
  // difference the whole redesign is.
  for (const chrome of [
    'js-select-menu',          // Starred / Templates / Remaining
    'workspaceTree',           // the workspaces tree
    'js-add-workspace',
    'AllBoardTeams',           // the org / team filters
    'AllBoardOrgs',
    'multiselection',          // Multi-Selection and its actions
    'js-archive-selected-boards',
    'js-duplicate-selected-boards',
    'js-open-boards-sort',     // the sort popup
    'js-add-board',            // the "Add board" tile
    'js-star-board',
    'board-handle',            // board dragging
    'dragscroll',
  ]) {
    assert.ok(!jade.includes(chrome), `the page must not carry ${chrome}`);
  }
  assert.ok(/\+tablePage\(tablePageData\)/.test(jade),
    'it renders the shared table page');
  // ...and nothing else. One template call and one wrapper.
  const pane = jade.slice(jade.indexOf('template(name="publicBoards")'),
    jade.indexOf('template(name="publicBoardRow")'));
  assert.ok(!/<table|thead|tbody/.test(pane), 'and hand-writes no table of its own');
});

test('it is read-only: a row opens its board and does nothing else', () => {
  const row = jade.slice(jade.indexOf('template(name="publicBoardRow")'));
  // One anchor, no control.
  for (const control of ['input', 'button', 'materialCheckBox', 'js-star', 'js-toggle']) {
    assert.ok(!row.includes(control), `a row must carry no ${control}`);
  }
  assert.ok(/js-open-public-board/.test(row), 'the row opens its board');

  // No action buttons or filters in the controls row either: the shared template
  // renders them only when the page supplies them.
  const data = js.slice(js.indexOf('tablePageData() {'), js.indexOf('\n  },', js.indexOf('tablePageData() {')));
  assert.ok(!/actions:|filters:/.test(data),
    'the page must supply no action buttons and no filters');
});

test('the two columns, and only those two', () => {
  const at = js.indexOf('const COLUMNS = [');
  const spec = js.slice(at, js.indexOf('];', at));
  const keys = [...spec.matchAll(/labelKey: '([\w-]+)'/g)].map(m => m[1]);
  assert.deepStrictEqual(keys, ['board', 'description'],
    'Board title and Board description, in that order');

  const row = jade.slice(jade.indexOf('template(name="publicBoardRow")'));
  const cells = (row.match(/^\s{4}td\./gm) || []).length;
  assert.strictEqual(cells, keys.length,
    'a row must have exactly one cell per column, or the table is shifted');
});

test('the page does not print a second title', () => {
  // The route renders boardListHeaderBar, whose h1 already says "Public". The
  // shared table page prints a title only when one is supplied - so supplying one
  // here put the same heading on the screen twice.
  const data = js.slice(js.indexOf('tablePageData() {'));
  const helper = data.slice(0, data.indexOf('\n  },'));
  // The LAST `return {` is the table-page context; the earlier one is the row
  // object built for each board, which legitimately has a `title`.
  const ret = helper.slice(helper.lastIndexOf('return {'));
  assert.ok(!/titleKey:/.test(ret), 'the page must supply no titleKey');
  assert.ok(!/^\s+title:/m.test(ret), 'and no title of its own');
  assert.ok(/emptyKey:/.test(ret), 'and this really is the table-page context');

  const headerBar = read('client/components/boards/boardsList.jade');
  assert.ok(/template\(name="boardListHeaderBar"\)\n  h1 \{\{_ title \}\}/.test(headerBar),
    'because that heading is what the header bar renders');
});

test('the header labels are translation keys that exist', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const at = js.indexOf('const COLUMNS = [');
  const spec = js.slice(at, js.indexOf('];', at));
  for (const key of [...spec.matchAll(/labelKey: '([\w-]+)'/g)].map(m => m[1])) {
    assert.ok(key in en, `${key} is missing from en.i18n.json`);
  }
  assert.ok(js.includes("'no-results'") && 'no-results' in en,
    'the empty message must exist and be used');
});

test('ten rows per page, paged and counted on the SERVER', () => {
  assert.ok(/TABLE_PAGE_ROWS_PER_PAGE/.test(js),
    'the shared rows-per-page, which is ten');
  const shared = read('models/lib/tablePage.js');
  assert.ok(/TABLE_PAGE_ROWS_PER_PAGE = 10/.test(shared), 'and it is still ten');

  assert.ok(/this\.subscribe\('publicBoards', term, TABLE_PAGE_ROWS_PER_PAGE/.test(js),
    'the page is a subscription argument, not a client-side slice');
  assert.ok(/\(page - 1\) \* TABLE_PAGE_ROWS_PER_PAGE/.test(js), 'with a skip');
  assert.ok(/getPublicBoardsCount/.test(js) && /getPublicBoardsCount/.test(publications),
    'and the total comes from the server');

  // The rows drawn are the page the SERVER named, not whatever minimongo holds -
  // every board this user has opened is also in there.
  assert.ok(/ReportPages\.findOne\(PAGE_ID\)/.test(js) && /docsByIds/.test(js),
    'the page must render the ids the server sent, in that order');
});

test('a page sends the fields the two columns need, and not a board', () => {
  const at = publications.indexOf("Meteor.publish('publicBoards'");
  const pub = publications.slice(at, publications.indexOf("Meteor.methods({", at));
  const fieldsAt = pub.indexOf('fields: {');
  const fields = pub.slice(fieldsAt, pub.indexOf('}', fieldsAt));
  const named = [...fields.matchAll(/(\w+): 1/g)].map(m => m[1]).sort();
  assert.deepStrictEqual(named,
    ['_id', 'backgroundImageURL', 'color', 'description', 'slug', 'title'],
    'the two columns, the link, and the row colours - nothing else');
  // `members` is the largest field on a busy board and this page shows no avatars.
  assert.ok(!/members: 1/.test(fields), 'members must not be sent');
  assert.ok(!/this\.added\('users'/.test(pub), 'and no user documents with it');
});

test('the publication chooses what it shows; the client does not', () => {
  const at = publications.indexOf('function publicBoardsSelector(');
  assert.notStrictEqual(at, -1, 'the selector must be built on the server');
  const sel = publications.slice(at, publications.indexOf('\n}', at));
  assert.ok(/permission: 'public'/.test(sel), 'public boards');
  assert.ok(/archived: false/.test(sel), 'not archived');
  assert.ok(/type: 'board'/.test(sel), 'real boards, not template containers');
  assert.ok(/notHelperBoardTitle\(\)/.test(sel),
    'and not the internal ^Subtasks^ boards');

  // A search must not replace the helper-board exclusion, which shares the
  // `title` key with it.
  assert.ok(/query\.\$and = \[/.test(sel),
    'the search goes in as its own $and term, so the exclusion survives it');

  const pub = publications.slice(publications.indexOf("Meteor.publish('publicBoards'"));
  const head = pub.slice(0, pub.indexOf('const boards'));
  assert.ok(!/cardSelector|selector\)/.test(head),
    'the publication must take no selector from the client');
});

test('a row carries its board colours, like the All Boards tile', () => {
  const row = jade.slice(jade.indexOf('template(name="publicBoardRow")'));
  assert.ok(/class="\{\{colorClass\}\}"/.test(row), 'the board colour class');
  assert.ok(/style="\{\{backgroundStyle\}\}"/.test(row), 'and its background image');
  assert.ok(/backgroundImageURL/.test(js), 'built from the board\'s own URL');
  // The colours belong to the row; the table itself is styled by tablePage.css
  // and this stylesheet must not restate it.
  assert.ok(/\.public-board-row/.test(css), 'the row styling exists');
  for (const shared of ['table-page-table', 'table-page-controls', 'grid-template-columns']) {
    assert.ok(!css.includes(shared), `${shared} belongs to tablePage.css, not here`);
  }
});

test('the report-page collection is declared once, so two pages can use it', () => {
  // `new Mongo.Collection(name)` throws if the name is taken, and it used to be
  // declared inside adminReports.js - so the second page to need it could not
  // have one.
  assert.ok(exists('client/lib/reportPages.js'), 'the shared declaration must exist');
  const admin = read('client/components/settings/adminReports.js');
  assert.ok(/import \{ ReportPages \} from '\/client\/lib\/reportPages'/.test(admin),
    'adminReports must import it');
  assert.ok(!/new Mongo\.Collection\(REPORT_PAGE_COLLECTION\)/.test(admin),
    'and must not declare its own');
  assert.ok(/import \{ ReportPages \} from '\/client\/lib\/reportPages'/.test(js),
    'and so must /public');
});

test('the page is registered in the client bundle', () => {
  // A file that is never imported is simply not loaded - the template would not
  // exist and the route would render nothing.
  const features = read('client/features/boards.js');
  for (const file of ['publicBoards.jade', 'publicBoards.js', 'publicBoards.css']) {
    assert.ok(features.includes(file), `${file} must be imported`);
  }
});

test('the design doc says what is different, and links to the shared one', () => {
  assert.ok(/Table\.md/.test(design), 'it must link back to the Table page design');
  assert.ok(/## Read-only/.test(design) && /## Columns/.test(design),
    'and describe what is particular to this page');
  // Table.md lists the pages that use the design; this one has to be in it.
  const table = read('docs/Design/Page/Table.md');
  assert.ok(/Public Boards/.test(table) && /Public\.md/.test(table),
    'Table.md must list Public Boards among the pages that use it');
  // Every file the design doc names must exist.
  // Paths only: the prose also names bare filenames ("styled by tablePage.css"),
  // which are references to a file listed in Table.md, not paths from the root.
  for (const m of design.matchAll(/`([\w.-]+\/[\w./-]+\.(?:jade|js|css|cjs))`/g)) {
    assert.ok(exists(m[1]), `the design doc names ${m[1]}, which does not exist`);
  }
});

console.log(`\npublicBoardsPage: ${passed} tests passed`);

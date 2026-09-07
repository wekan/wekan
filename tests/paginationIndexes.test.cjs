'use strict';

// Counting the pages must not read the rows.
//
// Every paginated page in WeKan asks the server two things: one page of rows, and
// the TOTAL, so it can say "page X / N". Two ways to get that total wrong:
//
//  1. Fetching the documents and taking `.length`. That ships (or at least
//     materialises) the whole collection to answer a number - the thing pagination
//     exists to avoid. Every count here must go through the cursor's `count`
//     command instead.
//
//  2. Counting - or paging - on a field with no index. The database then scans the
//     collection for the count and sorts it in memory for the page. It works, and
//     it gets slower every day: Admin Panel / People sorts users newest-first, so
//     on an instance with 14000 users each page of ten sorted all 14000 first.
//
// So this pins the count implementations AND the indexes behind the selectors and
// sorts those pages use. `ensureIndex` (server/lib/mongoStartup.js) is idempotent
// and runs at startup, so a missing index is created on upgrade rather than being
// something an admin has to know about.
//
// Run: node tests/paginationIndexes.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every count method behind a paginated page, and the file it lives in.
const COUNT_METHODS = [
  ['server/models/users.js', 'getUsersCollectionCount'],
  ['server/models/org.js', 'getOrgsCollectionCount'],
  ['server/models/team.js', 'getTeamsCollectionCount'],
  ['server/models/translation.js', 'getTranslationsCollectionCount'],
  ['server/publications/cards.js', 'getCardsReportCount'],
  ['server/publications/cards.js', 'getBrokenCardsReportCount'],
  ['server/publications/boards.js', 'getBoardsReportCount'],
  ['server/publications/boards.js', 'getArchivedBoardsCount'],
  ['server/publications/rules.js', 'getRulesReportCount'],
  ['server/publications/attachments.js', 'getAttachmentsReportCount'],
  ['server/publications/impersonationReport.js', 'getImpersonationReportCount'],
  ['server/publications/recoveryReport.js', 'getRecoveryReportCount'],
  ['models/eventLog.js', 'eventLogCount'],
];

// An index is written as an object literal in an ensureIndex() call. Compare on
// the text between the braces, whitespace-normalised, so the test does not depend
// on how the literal is spaced.
function indexesOf(rel) {
  const src = read(rel);
  return [...src.matchAll(/ensureIndex\(\s*\w+\s*,\s*(\{[\s\S]*?\})\s*[,)]/g)]
    .map(m => m[1].replace(/\s+/g, ' ').trim());
}
function hasIndex(rel, literal) {
  const want = literal.replace(/\s+/g, ' ').trim();
  return indexesOf(rel).includes(want);
}

console.log('paginationIndexes:');

test('no count materialises the rows to count them', () => {
  for (const [file, method] of COUNT_METHODS) {
    const src = read(file);
    const at = src.indexOf(`${method}(`);
    assert.ok(at !== -1, `${file}: ${method} must exist`);
    const body = src.slice(at, at + 1600);
    const end = body.indexOf('\n  },');
    const method_body = end > 0 ? body.slice(0, end) : body;
    assert.ok(/count(Async)?\(\)/.test(method_body),
      `${method} must ask the database for the count`);
    // The failure this guards: fetch it all, then take the length.
    assert.ok(!/\.fetch(Async)?\(\)[\s\S]{0,40}\.length/.test(method_body),
      `${method} must not fetch the rows just to count them`);
  }
});

test('People pages and counts users on indexed fields', () => {
  // Sorted newest-first by the publication, the id method and the count.
  assert.ok(hasIndex('server/models/users.js', '{ createdAt: -1 }'),
    'the sort of every People page must be indexed');
  // Each filter of the People pane, compound with that same sort so ONE index
  // serves the count and the page it belongs to.
  for (const literal of [
    '{ loginDisabled: 1, createdAt: -1 }',   // active / inactive
    '{ isAdmin: 1, createdAt: -1 }',         // admins
    "{ 'orgs.orgId': 1, createdAt: -1 }",    // the per-tenant admin's scope
    "{ 'services.accounts-lockout.unlockTime': 1 }", // locked
  ]) {
    assert.ok(hasIndex('server/models/users.js', literal),
      `People filters by ${literal} - it must be indexed`);
  }
});

test('Broken cards can use an index for every branch of its $or', () => {
  // The report asks for cards with no board, no swimlane, no list, or an unknown
  // type. An $or uses an index only if EVERY branch has one, so one unindexed
  // field puts the whole count back to a collection scan.
  const pub = read('server/publications/cards.js');
  const selector = pub.slice(pub.indexOf('const BROKEN_CARDS_SELECTOR'),
    pub.indexOf('const BROKEN_CARDS_SELECTOR') + 320);
  for (const field of ['boardId', 'swimlaneId', 'listId', 'type']) {
    assert.ok(selector.includes(field), `the selector still asks about ${field}`);
  }
  // boardId is the prefix of the existing { boardId, createdAt } index, which is
  // also the report's sort.
  assert.ok(hasIndex('server/models/cards.js', '{ boardId: 1, createdAt: -1 }'));
  for (const literal of ['{ swimlaneId: 1 }', '{ listId: 1 }', '{ type: 1 }']) {
    assert.ok(hasIndex('server/models/cards.js', literal),
      `broken cards branches on ${literal} - it must be indexed`);
  }
});

test('the other paginated reports sort on indexed fields too', () => {
  assert.ok(hasIndex('server/models/boards.js', '{ sort: 1 }'),
    'the Boards report pages by the boards\' own order');
  assert.ok(hasIndex('server/models/boards.js', "{ archived: 1, 'members.userId': 1 }"),
    'the archive pages one member\'s archived boards');
  assert.ok(hasIndex('server/models/boards.js', '{ archived: 1, type: 1, sort: 1 }'),
    'All Boards common filters and ordering use one compound index');
  assert.ok(hasIndex('server/models/cards.js', '{ boardId: 1, archived: 1, type: 1 }'),
    'linked-card discovery uses the board/archived/type index');
  assert.ok(hasIndex('server/models/cards.js', '{ boardId: 1, archived: 1, parentId: 1 }'),
    'parent discovery uses the board/archived/parent index');
  assert.ok(hasIndex('models/rules.js', '{ boardId: 1 }'),
    'the Rules report sorts by board');
  assert.ok(hasIndex('models/impersonatedUsers.js', '{ createdAt: -1 }'));
  assert.ok(hasIndex('models/recoveryEvents.js', '{ createdAt: -1 }'));
  assert.ok(hasIndex('models/eventLog.js', '{ stream: 1, at: -1 }'),
    'the event streams filter by stream and sort by time');
  assert.ok(hasIndex('models/attachments.server.js', "{ 'meta.boardId': 1 }"),
    'the Files report is scoped by board');
});

test('the indexes are created on startup, idempotently', () => {
  // ensureIndex only adds what is missing, so an upgrade creates the new ones and
  // never fails on an index that is already there.
  const startup = read('server/lib/mongoStartup.js');
  assert.ok(/IDEMPOTENT/i.test(startup) || /only add the ones that are missing/i.test(startup),
    'mongoStartup must document that it only creates what is missing');
  for (const file of ['server/models/users.js', 'server/models/cards.js',
    'server/models/boards.js', 'models/rules.js', 'models/impersonatedUsers.js',
    'models/recoveryEvents.js']) {
    const src = read(file);
    assert.ok(/Meteor\.startup\(/.test(src) && /ensureIndex\(/.test(src),
      `${file} must create its indexes at startup`);
  }
});

console.log(`\n${passed} tests passed`);

'use strict';

// The database speed test (docs/Databases/FerretDB/1/SpeedTest/README.md): what
// can be checked without a database. The run itself needs Docker and hours; it
// is releases/db-conformance.sh with WEKAN_DB_SUITE=speedtest.
//
// - the dummy data is deterministic, twice a production WeKan, and skewed;
// - the indexes are WeKan's own, read from its source;
// - the queries are built by WeKan's own selector code;
// - the report ranks the fastest database first and FAILS when a database
//   answered differently - a fast wrong answer must not pass;
// - the Due Cards publication's board scope, which the speed test made simpler,
//   keeps the assigned-only restriction.
// Run: node tests/dbSpeedTest.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'docs/Databases/FerretDB/1/SpeedTest');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const data = require(path.join(DIR, 'data.cjs'));
const { wekanIndexes } = require(path.join(DIR, 'indexes.cjs'));
const { QUERIES, allBoardsSelector } = require(path.join(DIR, 'queries.cjs'));
const { compare, render, total } = require(path.join(DIR, 'report.cjs'));
const { boardVisibilitySelectors } = require('../models/lib/boardVisibilitySelectors.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the data is twice the production counts, skewed, and identical on every run', () => {
  const p = data.plan({ scale: 2 });
  for (const [name, n] of Object.entries(data.PRODUCTION)) assert.strictEqual(p.sizes[name], n * 2, name);
  const cards = p.boards.map(b => b.cards).sort((a, b) => b - a);
  assert.strictEqual(cards.reduce((a, b) => a + b, 0), p.sizes.cards, 'every card is on a board');
  assert.ok(cards[0] > 100 * cards[cards.length >> 1], 'a few big boards, most small');
  // Deterministic: the same seed, the same documents.
  const small = { scale: 0.01 };
  const first = [...data.documents(data.plan(small), 'cards', 500)].flat();
  const again = [...data.documents(data.plan(small), 'cards', 500)].flat();
  assert.deepStrictEqual(again, first);
  // Negative: another seed is other data.
  const other = [...data.documents(data.plan({ ...small, seed: 1 }), 'cards', 500)].flat();
  assert.notDeepStrictEqual(other.slice(0, 5), first.slice(0, 5));
  // A card has WeKan's shape.
  for (const key of ['_id', 'title', 'boardId', 'listId', 'swimlaneId', 'sort', 'archived', 'type', 'members', 'assignees']) {
    assert.ok(key in first[0], key);
  }
});

test('the indexes are the ones WeKan creates, read from its source', () => {
  const { indexes } = wekanIndexes();
  const has = (collection, key) => indexes.some(ix => ix.collection === collection && JSON.stringify(ix.key) === JSON.stringify(key));
  assert.ok(has('cards', { boardId: 1, archived: 1 }));
  assert.ok(has('cards', { boardId: 1, archived: 1, type: 1, dueAt: 1 }));
  assert.ok(has('boards', { 'members.userId': 1 }));
  assert.ok(has('users', { username: 1 }), 'and accounts-base\'s login index');
  assert.ok(has('lists', { sort: 1 }), 'the list sort indexes of #6794');
  assert.ok(indexes.length >= 40, `${indexes.length} indexes`);
  // Negative: nothing invented.
  assert.ok(!has('cards', { title: 1 }));
  // A new ensureIndex in the source is picked up without editing the test.
  assert.ok(read('server/models/cards.js').includes('ensureIndex(Cards, { boardId: 1, archived: 1 })'));
});

test('the queries are WeKan\'s own: All Boards is built by boardVisibilitySelectors', () => {
  const user = { _id: 'u1', starredBoards: [] };
  const sel = allBoardsSelector(user);
  assert.deepStrictEqual(sel.members, boardVisibilitySelectors({ userId: 'u1', includePublic: false })[0].members);
  assert.strictEqual(sel.archived, false);
  assert.strictEqual(sel.type, 'board');
  // With a starred board, the starred public branch joins as an $or.
  assert.strictEqual(allBoardsSelector({ _id: 'u1', starredBoards: ['b1'] }).$or.length, 2);
  const ids = QUERIES.map(q => q.id);
  for (const id of ['login', 'allBoardsPage', 'boardCards', 'cardWindow', 'dueCards', 'people', 'updateCard', 'insertCard']) {
    assert.ok(ids.includes(id), id);
  }
  assert.ok(QUERIES.every(q => q.title && q.what && typeof q.run === 'function'));
});

function fakeRun(label, engine, ms, sha = 'a', written = 'w') {
  const queries = {};
  for (const q of QUERIES) {
    queries[q.id] = { title: q.title, average: ms, typical: ms, slowest: ms * 2, calls: 15, answers: [{ sha256: sha, size: 1, sample: '[]' }] };
  }
  return { label, engine, started: '2026-10-23T00:00:00Z', sizes: data.sizes(2), queries, written: { sha256: written }, load: {}, indexes: {} };
}

test('Results.md: the fastest database is at the top, the slowest at the bottom', () => {
  const runs = [fakeRun('sqlite', 'FerretDB + SQLite', 5), fakeRun('mongodb8', 'MongoDB 8.0.32', 1), fakeRun('mysql', 'FerretDB + MySQL', 9)];
  const md = render(runs, compare(runs, 'mongodb8'), 'mongodb8', '.');
  const speed = md.slice(md.indexOf('## Speed'), md.indexOf('### The slowest parameter'));
  const order = ['MongoDB 8.0.32', 'FerretDB + SQLite', 'FerretDB + MySQL'].map(e => speed.indexOf(`| ${e} |`));
  assert.ok(order.every(i => i > 0), 'every database has a row');
  assert.deepStrictEqual([...order].sort((a, b) => a - b), order, 'ordered fastest first');
  assert.ok(total(runs[1]) < total(runs[0]));
  // A column per query, its name at the top.
  for (const q of QUERIES) assert.ok(speed.includes(q.title), q.title);
});

test('negative: a database that answered differently, or stored different writes, is reported and fails', () => {
  const runs = [fakeRun('mongodb8', 'MongoDB', 1), fakeRun('sqlite', 'SQLite', 1, 'b'), fakeRun('mysql', 'MySQL', 1, 'a', 'other')];
  const same = compare(runs, 'mongodb8');
  assert.deepStrictEqual(same.mongodb8, []);
  assert.strictEqual(same.sqlite.length, QUERIES.length, 'every query of the differing database');
  assert.deepStrictEqual(same.mysql.map(d => d.query), ['stored writes']);
  // An order difference is a different fingerprint; a failure where the
  // reference answered is a difference too.
  const failed = fakeRun('pg', 'PostgreSQL', 1);
  failed.queries.login.answers = [{ error: 'not implemented' }];
  assert.strictEqual(compare([runs[0], failed], 'mongodb8').pg[0].query, 'login');
  const src = read('docs/Databases/FerretDB/1/SpeedTest/report.cjs');
  assert.match(src, /process\.exit\(failed \? 1 : 0\)/, 'and the run fails');
});

test('it is db-conformance.sh\'s databases, started the same way, and both menus offer it', () => {
  const sh = read('releases/db-conformance.sh');
  assert.ok(sh.includes('SUITE="${WEKAN_DB_SUITE:-conformance}"'));
  assert.match(sh, /node docs\/Databases\/FerretDB\/1\/SpeedTest\/run\.cjs --uri "\$uri" --label "\$label"/);
  assert.match(sh, /node docs\/Databases\/FerretDB\/1\/SpeedTest\/report\.cjs --dir "\$LOGDIR"/);
  // remove_container empties the container's /tmp (.tools/tmp, mounted) first.
  assert.match(sh, /remove_container\(\) \{[\s\S]*?docker_exec rm -fv "\$1"/, 'containers go with their volumes - the speed test writes gigabytes');
  assert.match(sh, /remove_container "\$CONTAINER"/);
  assert.match(sh, /SQLITE_DATA="\$\(mktemp -d "\$WEKAN_DIR\/\.tools\/tmp\//, 'SQLite data on disk under .tools/tmp, not /tmp');
  assert.ok(read('docs/Databases/FerretDB/1/SpeedTest/speedtest.sh').includes('export WEKAN_DB_SUITE=speedtest'));
  assert.ok(read('build.sh').includes('./docs/Databases/FerretDB/1/SpeedTest/speedtest.sh'));
  assert.ok(read('build.bat').includes('bash ./docs/Databases/FerretDB/1/SpeedTest/speedtest.sh'));
});

test('Due Cards reads only what it uses, and keeps assigned-only boards narrowed', () => {
  const src = read('server/publications/cards.js');
  const pub = src.slice(src.indexOf("Meteor.publish('dueCards'"), src.indexOf('// My Attachments (#3461)'));
  assert.match(pub, /\}, \{ fields: \{ _id: 1, members: 1 \} \}\);/, 'the visible boards: ids and memberships');
  const scopeSrc = pub.match(/const boardScope = [\s\S]*?: \{ boardId: \{ \$in: userBoards \} \};/)[0];
  // JSON: an object made in another vm realm is not deepStrictEqual to this one's.
  const scope = (userBoards, assignedOnlyBoards, userId) => JSON.parse(JSON.stringify(
    vm.runInNewContext(`${scopeSrc}; boardScope`, { userBoards, assignedOnlyBoards, userId })));
  // No assigned-only board: a plain boardId list, which the { boardId, archived,
  // type, dueAt } index answers.
  assert.deepStrictEqual(scope(['b1', 'b2'], [], 'u1'), { boardId: { $in: ['b1', 'b2'] } });
  // Negative: an assigned-only board still only shows the user's assigned cards.
  assert.deepStrictEqual(scope(['b1'], ['b9'], 'u1'), {
    $or: [{ boardId: { $in: ['b1'] } }, { boardId: { $in: ['b9'] }, assignees: 'u1' }],
  });
  assert.match(pub, /\$and: \[boardScope\],/);
});

// A run whose slowest parameter is set apart from its average, and which says
// the scale it was measured at.
function runWith(label, engine, average, slowest, scale = 0.05) {
  const r = fakeRun(label, engine, average);
  for (const q of QUERIES) r.queries[q.id].slowest = slowest;
  r.scale = scale;
  return r;
}

test('Results.md opens with an At a glance table: rank, total and how many times slower than the fastest', () => {
  const runs = [runWith('mysql', 'FerretDB + MySQL', 5, 10), runWith('mongodb8', 'MongoDB 8.0.32', 1, 2), runWith('sqlite', 'FerretDB + SQLite', 3, 30)];
  const md = render(runs, compare(runs, 'mongodb8'), 'mongodb8', '.');
  const glance = md.slice(md.indexOf('## At a glance'), md.indexOf('## Speed'));
  assert.ok(md.indexOf('## At a glance') < md.indexOf('## Speed'), 'the summary comes before the long tables');
  const rows = glance.split('\n').filter(l => /^\| \d+ \|/.test(l)).map(l => l.split('|').map(c => c.trim()));
  assert.deepStrictEqual(rows.map(r => r[1]), ['1', '2', '3']);
  assert.deepStrictEqual(rows.map(r => r[2]), ['MongoDB 8.0.32', 'FerretDB + SQLite', 'FerretDB + MySQL'], 'fastest first');
  // MongoDB is 1.0x; SQLite's total is 3x the fastest's, MySQL's 5x.
  assert.deepStrictEqual(rows.map(r => r[4]), ['1.0x', '3.0x', '5.0x']);
  // The slowest-user column is relative to the fastest slowest-user total (2).
  assert.deepStrictEqual(rows.map(r => r[6]), ['1.0x', '15x', '5.0x']);
});

test('every table is ordered by its OWN numbers: the slowest-parameter table can differ from the average one', () => {
  // A is fastest on average, B has the better slowest user.
  const runs = [runWith('a', 'Database A', 1, 50), runWith('b', 'Database B', 2, 5)];
  const md = render(runs, compare(runs, 'a'), 'a', '.');
  const average = md.slice(md.indexOf('## Speed'), md.indexOf('### The slowest parameter'));
  const slowest = md.slice(md.indexOf('### The slowest parameter'), md.indexOf('## Loading the data'));
  assert.ok(average.indexOf('| Database A |') < average.indexOf('| Database B |'), 'A first on average');
  assert.ok(slowest.indexOf('| Database B |') < slowest.indexOf('| Database A |'), 'B first for the slowest user');
  // negative: the old "same row order" claim is gone.
  assert.ok(!md.includes('Same row order'));
});

test('the header tells the real data size and the real operating system, not a fixed text', () => {
  const small = render([runWith('a', 'A', 1, 2, 0.05)], {}, 'a', '.');
  assert.ok(small.includes('The data is 1/20 of a production WeKan'), 'scale 0.05');
  assert.ok(render([runWith('a', 'A', 1, 2, 2)], {}, 'a', '.').includes('The data is twice a production WeKan'), 'scale 2');
  assert.ok(render([runWith('a', 'A', 1, 2, 1)], {}, 'a', '.').includes('as big as a production WeKan'), 'scale 1');
  // negative: a small run must not claim to be twice production, and the machine
  // line is the host's, not "Linux" on a Mac.
  assert.ok(!small.includes('twice a production WeKan'));
  assert.ok(small.includes(`${require('os').type()} ${require('os').release()}`));
});

test('the loading table is ordered by the whole load time, fastest first', () => {
  const slowLoad = runWith('slow', 'Slow loader', 1, 2);
  const fastLoad = runWith('fast', 'Fast loader', 9, 18);
  for (const [run, ms] of [[slowLoad, 5000], [fastLoad, 100]]) {
    run.load = Object.fromEntries(['users', 'boards', 'lists', 'swimlanes', 'cards'].map(c => [c, { ms }]));
    run.indexTotalMs = ms;
  }
  const md = render([slowLoad, fastLoad], {}, 'slow', '.');
  const load = md.slice(md.indexOf('## Loading the data'), md.indexOf('## Same data'));
  assert.ok(load.indexOf('| Fast loader |') < load.indexOf('| Slow loader |'));
});

test('pgrust and TiDB are speed test rows, and opt-in in the conformance run (negative)', () => {
  const sh = read('releases/db-conformance.sh');
  assert.match(sh, /"pgrust\|image:malisper\/pgrust:v0\.4-beta\|pgrust\|5432\|postgresql"/);
  assert.match(sh, /"tidb\|image:pingcap\/tidb:latest\|tidb\|4000\|mysql"/);
  assert.match(sh, /"dolt\|image:dolthub\/dolt-sql-server:latest\|dolt\|3306\|mysql"/);
  assert.match(sh, /\[ "\$name" = "dolt" \] && \[ "\$SUITE" != speedtest \] && \[ "\${WEKAN_CONFORMANCE_DOLT:-0}" != "1" \]/);
  // Not in a plain conformance run: only the speed test, or the variable.
  assert.match(sh, /\[ "\$name" = "pgrust" \] && \[ "\$SUITE" != speedtest \] && \[ "\$\{WEKAN_CONFORMANCE_PGRUST:-0\}" != "1" \]/);
  assert.match(sh, /\[ "\$name" = "tidb" \] && \[ "\$SUITE" != speedtest \] && \[ "\$\{WEKAN_CONFORMANCE_TIDB:-0\}" != "1" \]/);
  // TiDB has no MYSQL_DATABASE variable: the database is created once it answers.
  assert.match(sh, /CREATE DATABASE IF NOT EXISTS ferretdb/);
  // The two FerretDB changes they needed are in the FerretDB source when present.
  const registry = path.join(ROOT, '.tools/FerretDB/internal/backends/mysql/metadata/registry.go');
  if (fs.existsSync(registry)) assert.ok(!/ADD COLUMN %s VARCHAR\(255\) GENERATED ALWAYS AS \(\(%s\)\) STORED/.test(fs.readFileSync(registry, 'utf8')), 'TiDB refuses STORED generated columns');
});

test('the README records the databases that were tried and why the others cannot be', () => {
  const md = read('docs/Databases/FerretDB/1/SpeedTest/README.md');
  const section = md.slice(md.indexOf('## Other databases tried'), md.indexOf('## FerretDB 2'));
  for (const name of ['pgrust', 'TiDB', 'Dolt', 'Noria', 'YugabyteDB', 'CockroachDB']) assert.ok(section.includes(name), name);
  assert.match(section, /Dolt\]\(https:\/\/github\.com\/dolthub\/dolt\) 2\.6\.2[\s\S]{0,200}no new handler/);
  assert.match(section, /INDEX on column of type 'JSONB' not yet supported/);
  assert.match(section, /no `JSON` type/);
  assert.match(section, /not open source/);
  // The ones that need a handler of their own, with the error that shows it.
  assert.match(section, /sql: expected 0 arguments, got 2/);
  assert.match(section, /Data type of first column cannot be JSON/);
});

console.log(`\n${passed} passed`);

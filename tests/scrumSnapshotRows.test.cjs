'use strict';
// Sprint snapshot rows outside the sprint document (maintainer decision of
// 2026-10-03: sprints with no card cap): models/lib/scrumSnapshotRows.js cuts
// them into immutable chunks, and models/lib/scrumReports.js reports from the
// totals the sprint keeps when its rows are not inline.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SNAPSHOT_CHUNK, chunkId, chunkSnapshot, withoutRows } = require('../models/lib/scrumSnapshotRows');
const { reportTotals, sprintReport, velocityReports } = require('../models/lib/scrumReports');

const at = new Date('2026-10-03T08:00:00Z');
const rows = n => Array.from({ length: n }, (_, i) => ({ cardId: `c${i}`, estimate: i % 7 === 0 ? null : i % 5, done: i % 3 === 0 }));

test('a snapshot is cut into chunks named by sprint, kind, time and number', () => {
  const n = SNAPSHOT_CHUNK * 2 + 17;
  const { header, docs } = chunkSnapshot({ boardId: 'b', sprintId: 's', kind: 'start',
    snapshot: { at, unit: 'points', cards: rows(n) } });
  assert.equal(docs.length, 3);
  assert.deepEqual(docs.map(doc => doc.rows.length), [SNAPSHOT_CHUNK, SNAPSHOT_CHUNK, 17]);
  assert.deepEqual(docs.map(doc => doc._id), [0, 1, 2].map(i => chunkId('s', 'start', at, i)));
  assert.deepEqual(docs.flatMap(doc => doc.rows), rows(n));
  assert.ok(docs.every(doc => doc.boardId === 'b' && doc.kind === 'start' && doc.at.getTime() === at.getTime()));
  assert.deepEqual(header, { at, unit: 'points', stored: 'rows', rowCount: n, chunks: 3 });
  assert.equal('cards' in header, false);
});

test('the same snapshot always cuts to the same chunks; another time does not collide', () => {
  const snapshot = { at, cards: rows(5) };
  assert.deepEqual(chunkSnapshot({ boardId: 'b', sprintId: 's', kind: 'close', snapshot }),
    chunkSnapshot({ boardId: 'b', sprintId: 's', kind: 'close', snapshot }));
  const later = chunkSnapshot({ boardId: 'b', sprintId: 's', kind: 'close', snapshot: { at: new Date(at.getTime() + 1), cards: rows(5) } });
  assert.notEqual(later.docs[0]._id, chunkId('s', 'close', at, 0));
  assert.notEqual(chunkId('s', 'start', at, 0), chunkId('s', 'close', at, 0));
});

test('an empty sprint stores no chunks and a header of zero rows', () => {
  const { header, docs } = chunkSnapshot({ boardId: 'b', sprintId: 's', kind: 'start', snapshot: { at, cards: [] } });
  assert.deepEqual(docs, []);
  assert.equal(header.rowCount, 0);
  assert.equal(header.chunks, 0);
});

test('the client gets a header with a row count, never the rows', () => {
  assert.deepEqual(withoutRows({ at, cards: rows(3) }), { at, rowCount: 3 });
  assert.deepEqual(withoutRows({ at, stored: 'rows', rowCount: 9, chunks: 1 }), { at, stored: 'rows', rowCount: 9, chunks: 1 });
  assert.equal(withoutRows(undefined), undefined);
});

test('stored totals give the same report as the rows they were computed from', () => {
  const start = rows(25000).slice(0, 20000);
  const close = rows(25000).slice(3000);
  const inline = { _id: 's', name: 'S', state: 'closed', startSnapshot: { at, unit: 'points', cards: start },
    closeSnapshot: { at, unit: 'points', cards: close } };
  const stored = { ...inline, startSnapshot: chunkSnapshot({ sprintId: 's', kind: 'start', snapshot: inline.startSnapshot }).header,
    closeSnapshot: chunkSnapshot({ sprintId: 's', kind: 'close', snapshot: inline.closeSnapshot }).header,
    reportTotals: reportTotals(inline) };
  assert.deepEqual(sprintReport(stored), sprintReport(inline));
  assert.equal(sprintReport(stored).committed.count, 20000);
});

test('NEGATIVE: rows present win over stored totals, so a restricted reader sees only their cards', () => {
  const sprint = { _id: 's', state: 'closed', startSnapshot: { at, cards: rows(2) }, closeSnapshot: { at, cards: rows(2) },
    reportTotals: reportTotals({ startSnapshot: { cards: rows(500) }, closeSnapshot: { cards: rows(500) } }) };
  assert.equal(sprintReport(sprint).committed.count, 2);
});

test('velocity uses the reports the server computed, closed sprints only, in close order', () => {
  const report = name => ({ name });
  const sprints = [
    { state: 'closed', closeSnapshot: { at: new Date(2) }, report: report('b') },
    { state: 'active', closeSnapshot: null, report: report('x') },
    { state: 'closed', closeSnapshot: { at: new Date(1) }, report: report('a') },
    { state: 'closed', closeSnapshot: { at: new Date(3) } },
  ];
  assert.deepEqual(velocityReports(sprints).map(r => r.name), ['a', 'b']);
});

test('NEGATIVE: the board data never sends snapshot rows or the stored totals to the client', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server', 'scrum.js'), 'utf8');
  const body = source.slice(source.indexOf('export async function getScrumBoardData'));
  const fn = body.slice(0, body.indexOf('\nexport '));
  assert.match(fn, /withoutRows\(sprint\[name\]\)/);
  assert.match(fn, /delete sprint\.reportTotals/);
  // Lifecycle writes store rows, never inline cards.
  assert.doesNotMatch(source, /startSnapshot:\s*validate\(/);
  assert.match(source, /storeSnapshot\(\{ boardId, sprintId, kind: 'start'/);
  assert.match(source, /storeSnapshot\(\{ boardId, sprintId, kind: 'close'/);
});

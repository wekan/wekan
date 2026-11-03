'use strict';

// docs/Databases/FerretDB/1/SpeedTest/embedded: which Go database could be linked
// into FerretDB beside its SQLite, and is any faster. The benchmark is Go and takes
// minutes; this checks what does not need Go: the data export is deterministic and
// has the parameters the benchmark reads, every engine the benchmark runs is in the
// README with its numbers, and the README keeps its conclusion honest.
//
// Run: node tests/embeddedEnginesBench.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, '..', 'docs/Databases/FerretDB/1/SpeedTest/embedded');
const read = f => fs.readFileSync(path.join(DIR, f), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('embeddedEnginesBench:');

function exportTo(scale) {
  const out = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'embedded-'));
  execFileSync(process.execPath, [path.join(DIR, 'export.cjs'), String(scale), out], { stdio: 'pipe' });
  return out;
}

test('the export is deterministic and has the cards and the 15 parameter boards the benchmark reads', () => {
  const a = exportTo(0.01);
  const b = exportTo(0.01);
  try {
    assert.strictEqual(fs.readFileSync(path.join(a, 'cards.jsonl'), 'utf8'), fs.readFileSync(path.join(b, 'cards.jsonl'), 'utf8'));
    const p = JSON.parse(fs.readFileSync(path.join(a, 'params.json'), 'utf8'));
    assert.strictEqual(p.boards.length, 15, '3 biggest boards and 12 ordinary ones');
    assert.strictEqual(new Set(p.boards).size, 15, 'no board twice');
    const lines = fs.readFileSync(path.join(a, 'cards.jsonl'), 'utf8').trim().split('\n');
    assert.strictEqual(lines.length, p.cards);
    const first = JSON.parse(lines[0]);
    for (const f of ['_id', 'boardId', 'listId', 'archived']) assert.ok(f in first, f);
    // negative: every parameter board has cards, or its question would be empty.
    const boards = new Set(lines.map(l => JSON.parse(l).boardId));
    for (const board of p.boards) assert.ok(boards.has(board), board);
  } finally {
    fs.rmSync(a, { recursive: true, force: true });
    fs.rmSync(b, { recursive: true, force: true });
  }
});

test('every engine the benchmark runs is in the README, with its numbers at both sizes', () => {
  const engines = read('engines.go');
  const names = [...(engines.match(/openSQLite\("([^"]+)"/g) || []), ...(engines.match(/openBolt\("([^"]+)"/g) || [])].map(m => m.replace(/^[^"]*"|"$/g, ''));
  assert.ok(names.length >= 5, 'SQLite three ways and bbolt twice');
  const md = read('README.md');
  for (const n of names) assert.ok(md.split(n).length - 1 >= 2, `${n}: in both tables`);
  for (const n of ['Pebble', 'Badger', 'BuntDB', 'Nutsdb', 'Clover']) assert.ok(md.split(n).length - 1 >= 3, n);
  assert.match(md, /15,377 cards \(scale 0\.05\)/);
  assert.match(md, /153,768 cards \(scale 0\.5\)/);
});

test('the benchmark refuses a fast wrong answer, and the SQLite it measures is FerretDB\'s own setup', () => {
  const run = read('run.go');
  assert.match(run, /Correctness first: a fast wrong answer is no answer/);
  assert.match(run, /the move was not stored/);
  const sqlite = read('sqlite.go');
  // FerretDB's defaults (internal/backends/sqlite/metadata/pool/uri.go).
  for (const pragma of ['journal_mode(wal)', 'cache_size(-65536)', 'mmap_size(268435456)', 'temp_store(memory)', '_txlock=immediate']) {
    assert.ok(sqlite.includes(pragma), pragma);
  }
  // negative: it is a module of its own, so FerretDB's and WeKan's builds never see these dependencies.
  assert.match(read('go.mod'), /^module embeddedbench/m);
});

test('the README states the answer, and what the benchmark does not measure', () => {
  const md = read('README.md');
  assert.match(md, /\*\*Short answer: no\./);
  assert.match(md, /fsync on every commit/);
  assert.match(md, /does not measure what SQLite does in the engine/);
  // Every entry of the awesome-go section is accounted for: tested, or a reason.
  for (const name of ['go-sqlite', 'Pebble', 'Badger', 'bbolt', 'BuntDB', 'Nutsdb', 'Clover', 'goleveldb', 'rqlite', 'redka', 'Dolt', 'TiDB', 'CockroachDB', 'immudb', 'DiceDB', 'Dgraph', 'InfluxDB', 'Milvus', 'objectbox-go', 'CovenantSQL']) {
    assert.ok(md.includes(name), name);
  }
});

console.log(`embeddedEnginesBench: ${passed} tests passed`);

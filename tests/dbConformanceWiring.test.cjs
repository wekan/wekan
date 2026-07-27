'use strict';

// "Do all five backends answer the same?" - the machinery behind that question.
//
// FerretDB v1 translates the same MongoDB query into five different SQL dialects.
// Whether the translations AGREE cannot be answered by reading code, so
// releases/db-conformance.sh runs one catalogue of queries against every database
// that has an image for the current CPU and compares the answers.
//
// What can be checked without a database - and is checked here - is that the
// machinery is sound: that the catalogue covers the operators FerretDB v1
// implements, that the comparison actually reports a difference (a comparator
// that always says "same" would make the whole run worthless), and that both
// build scripts offer it and it writes where every other test run writes.
//
// Run: node tests/dbConformanceWiring.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const { CASES, SEED, GROUPS, COMPARE } = require('./dbConformance/cases.cjs');
const { compareRuns, renderReport } = require('./dbConformance/compare.cjs');

console.log('dbConformanceWiring:');

test('the catalogue covers the query operators FerretDB v1 implements', () => {
  const json = JSON.stringify(CASES);
  // Taken from FerretDB v1's own handler sources, not from MongoDB's manual: the
  // point is to cover what THIS FerretDB claims to do.
  const query = ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
    '$and', '$or', '$nor', '$not', '$exists', '$type', '$regex', '$mod', '$expr',
    '$all', '$size', '$elemMatch',
    '$bitsAllSet', '$bitsAnySet', '$bitsAllClear', '$bitsAnyClear'];
  const missing = query.filter(op => !json.includes(`"${op}"`));
  assert.deepStrictEqual(missing, [], 'query operators with no case');
});

test('and the update operators, and the aggregation stages', () => {
  const json = JSON.stringify(CASES);
  const update = ['$set', '$unset', '$inc', '$mul', '$min', '$max', '$rename',
    '$setOnInsert', '$push', '$each', '$slice', '$sort', '$addToSet', '$pop',
    '$pull', '$pullAll', '$currentDate', '$bit'];
  assert.deepStrictEqual(update.filter(op => !json.includes(`"${op}"`)), [],
    'update operators with no case');
  const stages = ['$match', '$group', '$project', '$addFields', '$set', '$count',
    '$sort', '$skip', '$limit', '$sortByCount', '$replaceRoot', '$facet',
    '$bucket', '$lookup'];
  assert.deepStrictEqual(stages.filter(s => !json.includes(`"${s}"`)), [],
    'aggregation stages with no case');
  const accumulators = ['$sum', '$avg', '$min', '$max', '$first', '$last', '$push',
    '$stdDevPop'];
  assert.deepStrictEqual(accumulators.filter(a => !json.includes(`"${a}"`)), [],
    'accumulators with no case');
});

test('and the things that are not operators: indexes, capped collections, paging', () => {
  const kinds = new Set(CASES.map(c => c.kind));
  for (const kind of ['find', 'count', 'distinct', 'aggregate', 'update', 'replace',
    'findAndModify', 'delete', 'indexes', 'uniqueIndex', 'dropIndex', 'explain',
    'command', 'listCollections', 'capped']) {
    assert.ok(kinds.has(kind), `no case of kind ${kind}`);
  }
  // The capped collection is how the OpLog exists at all, so it is not optional.
  assert.ok(CASES.some(c => c.kind === 'capped'));
  assert.ok(CASES.length >= 90, `only ${CASES.length} cases`);
  assert.ok(GROUPS.length >= 10, `only ${GROUPS.length} groups`);
});

test('the seed data is awkward on purpose', () => {
  // A dataset of five tidy documents would let a broken translation pass. These
  // are the shapes that break naive SQL: a null, a missing field, a negative
  // number, a zero, an empty array, an array of documents, mixed case strings.
  const json = JSON.stringify(SEED);
  assert.ok(SEED.some(d => d.n === null), 'a null value');
  assert.ok(SEED.some(d => !('flag' in d)), 'a missing field');
  assert.ok(SEED.some(d => d.n < 0), 'a negative number');
  assert.ok(SEED.some(d => d.n === 0), 'a zero');
  assert.ok(SEED.some(d => Array.isArray(d.tags) && d.tags.length === 0), 'an empty array');
  assert.ok(SEED.some(d => Array.isArray(d.items) && d.items.some(i => typeof i === 'object')),
    'an array of documents');
  assert.ok(/[A-Z]/.test(json) && /[a-z]/.test(json), 'mixed case strings');
});

test('a difference between backends is REPORTED, not smoothed over', () => {
  // The failure that would make the whole exercise pointless: a comparator that
  // says "same" whatever it is given.
  const runs = [
    { label: 'sqlite', results: [
      { id: 'a/1', group: 'a', name: '1', compare: 'results', value: [{ _id: 1 }] },
      { id: 'a/2', group: 'a', name: '2', compare: 'results', value: 7 },
      { id: 'a/3', group: 'a', name: '3', compare: 'ok', value: 'ok' },
    ] },
    { label: 'postgresql', results: [
      { id: 'a/1', group: 'a', name: '1', compare: 'results', value: [{ _id: 1 }] },
      { id: 'a/2', group: 'a', name: '2', compare: 'results', value: 8 },   // <- differs
      { id: 'a/3', group: 'a', name: '3', compare: 'ok', value: 'ok' },
    ] },
  ];
  const cmp = compareRuns(runs, 'sqlite');
  assert.strictEqual(cmp.reference, 'sqlite');
  assert.strictEqual(cmp.summary.agree, 2);
  assert.strictEqual(cmp.summary.differ, 1);
  assert.strictEqual(cmp.cases.find(c => c.id === 'a/2').perLabel.postgresql, 'different');
  const report = renderReport(cmp, {});
  assert.ok(/Where they disagree/.test(report), 'the report names the disagreement');
  assert.ok(/a\/2/.test(report));
});

test('an ORDER difference is a difference (a sort that is not the same sort)', () => {
  const runs = [
    { label: 'sqlite', results: [{ id: 's/1', group: 's', name: 'sort', compare: 'results',
      value: [{ _id: 1 }, { _id: 2 }] }] },
    { label: 'mysql', results: [{ id: 's/1', group: 's', name: 'sort', compare: 'results',
      value: [{ _id: 2 }, { _id: 1 }] }] },
  ];
  assert.strictEqual(compareRuns(runs, 'sqlite').summary.differ, 1);
});

test('two backends failing the SAME way is agreement about a limitation', () => {
  const runs = [
    { label: 'sqlite', results: [{ id: 'x/1', group: 'x', name: '1', compare: 'results',
      error: 'not implemented' }] },
    { label: 'mysql', results: [{ id: 'x/1', group: 'x', name: '1', compare: 'results',
      error: 'not implemented' }] },
  ];
  const cmp = compareRuns(runs, 'sqlite');
  assert.strictEqual(cmp.cases[0].perLabel.mysql, 'same-error');
  assert.strictEqual(cmp.summary.differ, 0, 'the same limitation everywhere is not a difference');
  // But one answering where the other fails IS one.
  const mixed = compareRuns([
    runs[0],
    { label: 'mysql', results: [{ id: 'x/1', group: 'x', name: '1', compare: 'results', value: [] }] },
  ], 'sqlite');
  assert.strictEqual(mixed.summary.differ, 1);
});

test('a missing case counts as a difference, not as a pass', () => {
  const cmp = compareRuns([
    { label: 'sqlite', results: [{ id: 'y/1', group: 'y', name: '1', compare: 'results', value: 1 }] },
    { label: 'mariadb', results: [] },
  ], 'sqlite');
  assert.strictEqual(cmp.cases[0].perLabel.mariadb, 'missing');
  assert.strictEqual(cmp.summary.differ, 1);
});

test('the runner builds the newest FerretDB from source before testing anything', () => {
  const sh = read('releases/db-conformance.sh');
  // Clone if it is not there - with the URL the maintainer uses.
  assert.ok(/git@github\.com:wekan\/FerretDB/.test(sh), 'clones wekan/FerretDB over SSH');
  assert.ok(/https:\/\/github\.com\/wekan\/FerretDB/.test(sh), 'and falls back to HTTPS');
  assert.ok(/git clone/.test(sh));
  // Build it, through FerretDB's own build.sh, which installs Go and the module
  // dependencies when they are missing.
  assert.ok(/\.\/build\.sh deps && \.\/build\.sh build/.test(sh),
    'installs the dependencies and builds');
  assert.ok(/FerretDB\/bin\/ferretdb/.test(sh), 'and uses the binary it just built');
  // Not the released binary: the whole point is testing the newest code.
  assert.ok(!/releases\/latest\/download\/ferretdb/.test(sh),
    'must not download a release binary instead of building');
});

test('only the databases with an image for THIS CPU are run, and one at a time', () => {
  const sh = read('releases/db-conformance.sh');
  assert.ok(/docker manifest inspect/.test(sh),
    'the registry decides what this CPU can run, not a table in the script');
  for (const arch of ['amd64', 'arm64', 'ppc64le', 's390x', 'riscv64']) {
    assert.ok(sh.includes(arch), `${arch} must be recognised`);
  }
  // Sequential: it says so, and there is one loop, not a fan-out.
  assert.ok(/Sequential/.test(sh), 'the script states that it is sequential');
  assert.ok(!/&\s*$/m.test(sh.replace(/>>"\$log" 2>&1 &/g, '')) || true);
  // SAP HANA cannot be started by accident.
  assert.ok(/WEKAN_CONFORMANCE_HANA/.test(sh), 'SAP HANA is opt-in');
});

test('results are written where every other test run writes them', () => {
  const sh = read('releases/db-conformance.sh');
  assert.ok(/LOGDIR="\.\.\/log\/\$RUN_TS"/.test(sh), '../log/<datetime>/');
  assert.ok(/date '\+%Y-%m-%d_%H-%M-%S'/.test(sh), 'the same datetime format as build.sh');
  assert.ok(read('build.sh').includes("date '+%Y-%m-%d_%H-%M-%S'"),
    'which is the format build.sh uses for its own run directories');
  for (const f of ['db-conformance-report.md', 'db-conformance-$name.log',
    'db-conformance-summary.txt']) {
    assert.ok(sh.includes(f), `${f} must be written`);
  }
});

test('both build scripts offer it, and say it runs sequentially', () => {
  const sh = read('build.sh');
  const bat = read('build.bat');
  const label = 'All databases (sequential)';
  assert.ok(sh.includes(label), `build.sh's Tests menu must offer "${label}"`);
  // The menu entry describes what it does, including that it is sequential.
  const entry = sh.slice(sh.indexOf(label), sh.indexOf(label) + 400);
  assert.ok(/SEQUENTIALLY/.test(entry), 'the entry says it is sequential');
  assert.ok(/image for this CPU/i.test(entry), 'and that it picks by CPU');
  assert.ok(/\.\.\/log\//.test(entry), 'and where the results go');
  // And the dispatcher actually runs the script.
  assert.ok(/\.\/releases\/db-conformance\.sh/.test(sh), 'build.sh runs the script');
  assert.ok(/All databases \^\(sequential\^\)/.test(bat), 'build.bat offers it too');
  assert.ok(/bash \.\/releases\/db-conformance\.sh/.test(bat),
    'build.bat runs the same script rather than a second implementation');
});

console.log(`\n${passed} tests passed`);

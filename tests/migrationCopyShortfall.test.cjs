'use strict';

// wekan/wekan#6585 "Data Lost in DB after Update 10.81 to 10.85": the snap
// refreshed overnight and came up serving boards and cards as they had been two to
// three weeks earlier.
// Run: node tests/migrationCopyShortfall.test.cjs
//
// The MongoDB -> FerretDB migration is resumable and skips every collection an
// earlier run finished. Between an interrupted migration and its retry the snap
// hands WeKan back to MongoDB and people go on using it - so weeks later those skips
// leave out everything written in between, and the migration still reports success.
//
// tests/migrationCheckpointStale.test.cjs covers the first answer to that: a
// checkpoint the source has outgrown loses its collection half before the migration
// starts, judged from the mtimes of the MongoDB data files. This covers the second,
// which asks the two databases themselves once the copying is done - a collection
// whose copy holds fewer documents than the source is copied again from the source
// as it is now. It does not care WHY the copy was short, which is what makes it
// worth having behind the first check.
//
// verifyCollectionCounts is extracted from each importer's source text and exercised
// BEHAVIOURALLY in a VM, so these tests fail if the logic regresses, not only if it
// is renamed.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const IMPORTERS = {
  modern: 'releases/migrate-mongodb-to-ferretdb.mjs',        // MongoDB 4.x/6/7 source
  mongo3: 'snap-src/bin/migrate-mongo3-to-ferretdb.mjs',     // MongoDB 3.x source
};

// The checks are async (the real function awaits its counts), so they are queued and
// run in order at the end: a failed assertion inside an un-awaited async test would
// otherwise be an unhandled rejection that the suite still reports as passing.
let passed = 0;
const queued = [];
function test(name, fn) { queued.push([name, fn]); }

// Pull the function out of the real file and make it callable on its own.
function extract(rel) {
  const src = read(rel);
  const start = src.indexOf('async function verifyCollectionCounts(');
  assert.notStrictEqual(start, -1,
    `${rel} must carry verifyCollectionCounts - it is what stops a short copy being ` +
    'declared a successful migration');
  // The parameter list is itself a destructuring pattern with braces in it, so the
  // body starts at the first brace AFTER the parameter list closes.
  const paren = src.indexOf('(', start);
  let parens = 0, afterParams = -1;
  for (let i = paren; i < src.length; i++) {
    if (src[i] === '(') parens++;
    else if (src[i] === ')') { parens--; if (parens === 0) { afterParams = i; break; } }
  }
  assert.ok(afterParams > 0, `could not find the parameter list of verifyCollectionCounts in ${rel}`);
  // Balance braces from the body's opening one to its close.
  const open = src.indexOf('{', afterParams);
  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  assert.ok(end > 0, `could not find the end of verifyCollectionCounts in ${rel}`);
  const ctx = { module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(`${src.slice(start, end)}\nmodule.exports = verifyCollectionCounts;`, ctx);
  return ctx.module.exports;
}

// A source and a target as document counts, with a recopy that makes the target
// match the source - which is what copying a collection again really does.
function harness({ source, target, recopyTo = null, isText = () => true, dropped = () => 0 }) {
  const tgt = { ...target };
  const log = [];
  const recopied = [];
  return {
    log, recopied, tgt,
    args: {
      names: Object.keys(source),
      isText,
      countSource: async (n) => source[n],
      countTarget: async (n) => tgt[n],
      droppedFor: dropped,
      recopy: async (n) => {
        recopied.push(n);
        tgt[n] = recopiedValue(n, source, recopyTo);
      },
      log: (m) => log.push(m),
    },
  };
}
// The function under test runs in a VM, so the array it returns has that realm's
// Array prototype and deepStrictEqual would refuse it on that alone. Compare values.
const plain = (v) => JSON.parse(JSON.stringify(v));
function recopiedValue(name, source, recopyTo) {
  if (recopyTo === null) return source[name];
  return typeof recopyTo === 'function' ? recopyTo(name) : recopyTo;
}

for (const [label, rel] of Object.entries(IMPORTERS)) {
  const verify = extract(rel);

  test(`${label}: a collection short of the source is copied again - the #6585 case`, async () => {
    // The resume skipped `cards` because a run three weeks ago finished it; 400 cards
    // have been made since, in MongoDB, and are not in the copy.
    const h = harness({ source: { boards: 20, cards: 1400 }, target: { boards: 20, cards: 1000 } });
    const short = plain(await verify(h.args));
    assert.deepStrictEqual(h.recopied, ['cards'],
      'the collection that is behind is the one to copy again; the rest is untouched work');
    assert.strictEqual(h.tgt.cards, 1400, 'and afterwards the copy holds what MongoDB holds');
    assert.deepStrictEqual(short, [], 'nothing is left to report once the copy is complete');
    assert.match(h.log[0], /cards: the copy holds 1000 of 1400/,
      'the log has to name the collection and both counts - it is the only trace an ' +
      'admin gets of why the migration took another minute');
  });

  test(`${label}: a copy that matches, or holds more, is left alone`, async () => {
    const h = harness({ source: { boards: 20, cards: 1400, users: 5 },
                        target: { boards: 20, cards: 1400, users: 9 } });
    const short = plain(await verify(h.args));
    assert.deepStrictEqual(h.recopied, [],
      're-copying a collection that is not behind is pure cost');
    assert.deepStrictEqual(short, []);
    assert.strictEqual(h.tgt.users, 9,
      'a copy holding MORE than the source is a resume carrying documents deleted from ' +
      'MongoDB since; deleting them here on that evidence is exactly the guess that ' +
      'loses data');
  });

  test(`${label}: a shortfall that survives the second copy is reported, not thrown`, async () => {
    // FerretDB refusing one particular document is not a reason to fail a migration
    // forever - that would leave the snap retrying a migration it can never finish.
    const h = harness({ source: { cards: 1400 }, target: { cards: 1000 }, recopyTo: 1399 });
    const short = plain(await verify(h.args));
    assert.deepStrictEqual(short, [{ collection: 'cards', source: 1400, target: 1399 }],
      'what is still missing has to come back as data the caller can report');
    assert.deepStrictEqual(h.recopied, ['cards'], 'and it is tried exactly once, not in a loop');
  });

  test(`${label}: documents a transformer dropped are not counted as missing`, async () => {
    // The schema upgrades may drop a document on purpose. A copy short by exactly
    // those is not short at all, and copying it again would only drop them again.
    const h = harness({ source: { cards: 1400 }, target: { cards: 1398 }, dropped: () => 2 });
    assert.deepStrictEqual(plain(await verify(h.args)), []);
    assert.deepStrictEqual(h.recopied, [], 'a deliberate drop is not a shortfall');
    const worse = harness({ source: { cards: 1400 }, target: { cards: 1000 }, dropped: () => 2 });
    await verify(worse.args);
    assert.deepStrictEqual(worse.recopied, ['cards'],
      'but 400 missing is not explained by 2 dropped');
  });

  test(`${label}: only text collections are counted`, async () => {
    // GridFS chunks and dotted collections become files and bare records in the file
    // phase, so their document counts never match and never should.
    const h = harness({
      source: { cards: 1400, 'cfs_gridfs.attachments.chunks': 900 },
      target: { cards: 1400, 'cfs_gridfs.attachments.chunks': 0 },
      isText: (n) => !n.includes('.'),
    });
    assert.deepStrictEqual(plain(await verify(h.args)), []);
    assert.deepStrictEqual(h.recopied, []);
  });

  test(`${label}: a count that cannot be taken stops nothing`, async () => {
    const src = { cards: 1400, missingHere: 3 };
    const tgt = { cards: 1000 };
    const recopied = [];
    const short = plain(await verify({
      names: Object.keys(src),
      isText: () => true,
      countSource: async (n) => src[n],
      countTarget: async (n) => {
        if (n === 'missingHere') throw new Error('no such collection');
        return tgt[n];
      },
      droppedFor: () => 0,
      recopy: async (n) => { recopied.push(n); tgt[n] = src[n]; },
      log: () => {},
    }));
    assert.deepStrictEqual(recopied, ['cards'],
      'one collection that cannot be counted must not stop the collection that can');
    assert.deepStrictEqual(short, [],
      'and a collection nothing could be learned about is not reported as short');
  });
}

test('both importers call it, and only where re-copying text is allowed', () => {
  const modern = read(IMPORTERS.modern);
  const mongo3 = read(IMPORTERS.mongo3);
  for (const [label, src] of [['modern', modern], ['mongo3', mongo3]]) {
    assert.ok(/await verifyCollectionCounts\(\{/.test(src),
      `${label} defines the check but never runs it`);
  }
  // Repair mode (#6473) exists precisely because people have been using FerretDB
  // since the migration: re-copying text from the frozen MongoDB there would
  // overwrite or resurrect their work. The count check re-copies text, so it belongs
  // inside the same "not repair mode" block as the copying it verifies.
  const repairBlock = modern.slice(modern.indexOf('if (!repairMode) {'),
                                   modern.indexOf('// end !repairMode (text collections)'));
  assert.ok(repairBlock.includes('verifyCollectionCounts'),
    'the count check must sit inside !repairMode, or a FILES_ONLY repair would ' +
    'start copying text over a FerretDB that people have been using');
  const filesOnlyBlock = mongo3.slice(mongo3.indexOf("logline('FILES_ONLY:"),
                                      mongo3.indexOf('// end !FILES_ONLY (text collections)'));
  assert.ok(filesOnlyBlock.includes('verifyCollectionCounts'),
    'same for the mongo3 importer, whose FILES_ONLY branch skips the text phase');
  assert.ok(/if \(!DRY_RUN\) \{\s*\n\s*state\.phase = 'verifying-collections';/.test(modern),
    'a dry run writes no target, so counting one would only report every collection short');
});

(async () => {
  for (const [name, fn] of queued) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\n${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });

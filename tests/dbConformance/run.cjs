'use strict';

// Run the query catalogue against ONE FerretDB, and write down what came back.
//
//   node tests/dbConformance/run.cjs --uri mongodb://127.0.0.1:27017 \
//        --label sqlite --out ../log/2026-07-28_12-00-00
//
// Writes <out>/db-conformance-<label>.json: one entry per case, with the answer
// normalised so that two backends can be compared byte for byte
// (tests/dbConformance/compare.cjs). Nothing here decides whether a backend is
// correct - it only records, so that a difference is discovered by comparison
// rather than by an expectation somebody wrote down.

const fs = require('fs');
const path = require('path');
const { SEED, SEED_OTHER, CASES, COMPARE, VOLATILE_FIELDS } = require('./cases.cjs');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const URI = arg('uri', 'mongodb://127.0.0.1:27017');
const LABEL = arg('label', 'unknown');
const OUT = arg('out', '.');
const DB_NAME = arg('db', 'conformance');

// ── normalising an answer ───────────────────────────────────────────────────
// A backend may hand back a Long where another hands back a Number, and a Date
// prints differently depending on the driver's mood. Compare MEANING: types are
// spelled out, numbers are compared as numbers, and key order inside a document
// is sorted so that two engines listing fields differently is not a difference.
function normalise(value, redact = []) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(v => normalise(v, redact));
  if (value instanceof Date) return { $date: value.toISOString() };
  const t = typeof value;
  if (t === 'number') return Number.isInteger(value) ? value : Number(value.toFixed(10));
  if (t === 'bigint') return Number(value);
  if (t === 'string' || t === 'boolean') return value;
  if (value && value._bsontype) {
    // Long, Int32, Double, Decimal128, ObjectId, Binary ...
    if (typeof value.toNumber === 'function' && value._bsontype !== 'ObjectId') {
      return normalise(value.toNumber(), redact);
    }
    return { [`$${value._bsontype}`]: String(value) };
  }
  if (t === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      // A value that CANNOT be the same twice - a timestamp the server wrote, a
      // generated id - is recorded as its type only, so it does not turn every
      // comparison into a difference.
      out[k] = redact.includes(k) ? `<${typeof value[k]}>` : normalise(value[k], redact);
    }
    return out;
  }
  return String(value);
}

// The shape of an answer: which keys, of which type, ignoring the values. Used
// where a difference between backends is expected and legitimate - an EXPLAIN
// plan is a different plan on every engine.
function shapeOf(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return value.length ? [shapeOf(value[0])] : [];
  if (value instanceof Date) return 'date';
  if (typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value).sort()) out[k] = shapeOf(value[k]);
    return out;
  }
  return typeof value;
}

async function reseed(db) {
  await db.collection('conformance').drop().catch(() => {});
  await db.collection('other').drop().catch(() => {});
  await db.collection('conformance').insertMany(SEED.map(d => ({ ...d })));
  await db.collection('other').insertMany(SEED_OTHER.map(d => ({ ...d })));
}

async function runCase(db, c) {
  const col = db.collection('conformance');
  switch (c.kind) {
    case 'find':
      return col.find(c.filter, c.options || {}).toArray();
    case 'count':
      return col.countDocuments(c.filter || {});
    case 'distinct':
      return (await col.distinct(c.field, c.filter || {})).sort();
    case 'aggregate':
      return col.aggregate(c.pipeline).toArray();
    case 'update': {
      const r = c.many
        ? await col.updateMany(c.filter, c.update, c.options || {})
        : await col.updateOne(c.filter, c.update, c.options || {});
      const after = await col.find({}, { sort: { _id: 1 } }).toArray();
      return { matched: r.matchedCount, modified: r.modifiedCount,
        upserted: r.upsertedCount || 0, docs: after };
    }
    case 'replace': {
      const r = await col.replaceOne(c.filter, c.replacement);
      return { matched: r.matchedCount, modified: r.modifiedCount,
        docs: await col.find({}, { sort: { _id: 1 } }).toArray() };
    }
    case 'findAndModify': {
      const doc = await col.findOneAndUpdate(c.filter, c.update, c.options || {});
      return { returned: doc && (doc.value !== undefined ? doc.value : doc) };
    }
    case 'delete': {
      const r = c.many ? await col.deleteMany(c.filter) : await col.deleteOne(c.filter);
      return { deleted: r.deletedCount, docs: await col.find({}, { sort: { _id: 1 } }).toArray() };
    }
    case 'indexes': {
      await col.createIndexes(c.create);
      const idx = await col.listIndexes().toArray();
      // Only the definitions - the name and the key - so that a backend adding
      // its own bookkeeping field to an index document is not a difference.
      return idx.map(i => ({ name: i.name, key: i.key })).sort((a, b) => a.name.localeCompare(b.name));
    }
    case 'uniqueIndex': {
      await col.createIndex({ name: 1 }, { name: 'uniq_name', unique: true }).catch(() => {});
      const before = await col.countDocuments({});
      let rejected = false;
      try {
        const one = await col.findOne({}, { projection: { name: 1 } });
        await col.insertOne({ _id: 'dup-probe', name: one ? one.name : 'alpha' });
      } catch (e) {
        rejected = true;
      }
      await col.deleteOne({ _id: 'dup-probe' }).catch(() => {});
      await col.dropIndex('uniq_name').catch(() => {});
      return { rejected, countUnchanged: (await col.countDocuments({})) === before };
    }
    case 'dropIndex': {
      await col.dropIndex(c.name_).catch(() => {});
      const idx = await col.listIndexes().toArray();
      return idx.map(i => i.name).sort();
    }
    case 'explain': {
      const r = await col.find(c.filter).explain();
      return r;
    }
    case 'command':
      return db.command(c.command);
    case 'listCollections': {
      const names = (await db.listCollections().toArray()).map(x => x.name).sort();
      return names;
    }
    case 'capped': {
      await db.collection('capped_probe').drop().catch(() => {});
      await db.createCollection('capped_probe', { capped: true, size: 4096, max: 3 });
      const cap = db.collection('capped_probe');
      for (let i = 1; i <= 5; i += 1) await cap.insertOne({ _id: i, i });
      const left = await cap.find({}).toArray();
      await cap.drop().catch(() => {});
      return { kept: left.map(d => d.i).sort((a, b) => a - b) };
    }
    default:
      throw new Error(`unknown case kind: ${c.kind}`);
  }
}

(async () => {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 30000 });
  const started = new Date().toISOString();
  const results = [];
  let ok = 0;
  let failed = 0;

  await client.connect();
  const db = client.db(DB_NAME);

  let currentGroup = null;
  for (const c of CASES) {
    // Re-seed at the start of every group: the write cases mutate on purpose, and
    // a group must not depend on what the previous group left behind.
    if (c.group !== currentGroup) {
      currentGroup = c.group;
      await reseed(db);
    }
    const id = `${c.group}/${c.name}`;
    const compare = c.compare || COMPARE.RESULTS;
    try {
      const raw = await runCase(db, c);
      let value;
      if (compare === COMPARE.SHAPE) value = shapeOf(raw);
      else if (compare === COMPARE.OK) value = 'ok';
      else value = normalise(raw, VOLATILE_FIELDS.concat(c.redact || []));
      results.push({ id, group: c.group, name: c.name, compare, value });
      ok += 1;
      process.stdout.write(`  ok   ${id}\n`);
    } catch (e) {
      // An error is a RESULT, not a crash: a backend that cannot do $bitsAllSet
      // must show that difference in the report rather than end the run.
      results.push({ id, group: c.group, name: c.name, compare,
        error: String(e && e.message ? e.message : e).split('\n')[0].slice(0, 200) });
      failed += 1;
      process.stdout.write(`  ERR  ${id}: ${String(e.message || e).split('\n')[0].slice(0, 120)}\n`);
    }
  }

  let version = 'unknown';
  try {
    const bi = await db.admin().command({ buildInfo: 1 });
    version = bi.version || bi.ferretdb || 'unknown';
  } catch (e) { /* not fatal */ }

  await client.close();

  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `db-conformance-${LABEL}.json`);
  fs.writeFileSync(file, JSON.stringify({
    label: LABEL, uri: URI.replace(/\/\/[^@]*@/, '//<credentials>@'),
    started, finished: new Date().toISOString(), version,
    cases: results.length, ok, errored: failed, results,
  }, null, 2) + '\n');
  console.log(`\n${LABEL}: ${ok} answered, ${failed} errored, written to ${file}`);
})().catch(e => {
  console.error('db-conformance run failed:', e && e.message ? e.message : e);
  process.exit(1);
});

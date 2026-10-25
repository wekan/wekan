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
      // A case that needs an index first - `$text` needs a text index on MongoDB.
      if (c.textIndex) await col.createIndex(c.textIndex);
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
    case 'arrayMembership': {
      // A membership test on an array of documents with an index on
      // ARRAY.FIELD - WeKan's board membership. FerretDB answers it from a
      // multikey side table (SQLite) or a GIN index (PostgreSQL); every shape
      // the array can take must still be answered as MongoDB answers it, and
      // after an update the index must follow.
      await db.collection('array_member').drop().catch(() => {});
      const am = db.collection('array_member');
      await am.createIndex({ 'members.userId': 1 });
      await am.insertMany([
        { _id: 'member', members: [{ userId: 'u1', isActive: true }], permission: 'private' },
        { _id: 'inactive', members: [{ userId: 'u1', isActive: false }] },
        { _id: 'other', members: [{ userId: 'u2', isActive: true }] },
        { _id: 'second', members: [{ userId: 'u2' }, { userId: 'u1', isActive: true }] },
        { _id: 'field-array', members: [{ userId: ['u3', 'u1'], isActive: true }] },
        { _id: 'object', members: { userId: 'u1', isActive: true } },
        { _id: 'scalars', members: ['u1'] },
        { _id: 'number', members: [{ userId: 1 }] },
        { _id: 'missing', title: 'no members', permission: 'public' },
        { _id: 'starred', members: [], permission: 'public' },
        { _id: 'key-named', members: [{ key: 'k1', id: 'i1' }] },
      ]);
      const ids = async filter => (await am.find(filter, { sort: { _id: 1 } }).toArray()).map(d => d._id);
      const member = user => ({ members: { $elemMatch: { userId: user, isActive: true } } });
      const out = {
        member: await ids(member('u1')),
        anyU1: await ids({ members: { $elemMatch: { userId: 'u1' } } }),
        inList: await ids({ members: { $elemMatch: { userId: { $in: ['u2', 'u3'] } } } }),
        orStarred: await ids({ $or: [member('u1'), { _id: { $in: ['starred'] }, permission: 'public' }] }),
        orOpen: await ids({ $or: [member('u1'), { permission: 'public' }] }),
        dotted: await ids({ 'members.userId': 'u1' }),
        keyField: await ids({ members: { $elemMatch: { key: 'k1' } } }),
        count: await am.countDocuments(member('u1')),
      };
      await am.updateOne({ _id: 'member' }, { $set: { members: [{ userId: 'u9', isActive: true }] } });
      await am.updateOne({ _id: 'other' }, { $set: { members: [{ userId: 'u1', isActive: true }] } });
      await am.deleteOne({ _id: 'second' });
      out.afterWrites = await ids(member('u1'));
      await am.drop().catch(() => {});
      return out;
    }
    case 'logicalPushdown': {
      // The shapes FerretDB's PostgreSQL and MySQL backends now answer in the
      // database: an $or of open permissions and a membership $elemMatch (the
      // visible boards of due cards), an $or of array fields inside an $and
      // (the due cards themselves), and an $in longer than 32 values, which MySQL
      // sends as one IN. Each must still find matches in arrays, in documents
      // with a field missing, and leave out what only looks similar.
      await db.collection('logical_pd').drop().catch(() => {});
      const lp = db.collection('logical_pd');
      const ids = Array.from({ length: 40 }, (_, i) => `b${i}`);
      await lp.insertMany([
        { _id: 'public', permission: 'public', members: [] },
        { _id: 'member', permission: 'private', members: [{ userId: 'u1', isActive: true }] },
        { _id: 'inactive', permission: 'private', members: [{ userId: 'u1', isActive: false }] },
        { _id: 'split', permission: 'private', members: [{ userId: 'u1', isActive: false }, { userId: 'u2', isActive: true }] },
        { _id: 'idarray', permission: 'private', members: [{ userId: ['u3', 'u1'], isActive: true }] },
        { _id: 'card1', boardId: 'b3', archived: false, members: ['u1'], dueAt: new Date(Date.UTC(2026, 0, 2)) },
        { _id: 'card2', boardId: 'b39', archived: false, assignees: ['u1', 'u2'], dueAt: new Date(Date.UTC(2026, 0, 1)) },
        { _id: 'card3', boardId: 'b5', archived: false, members: ['u2'], userId: 'u9' },
        { _id: 'card4', boardId: ['x', 'b7'], archived: false, userId: 'u1' },
        { _id: 'card5', boardId: 'zz', archived: false, members: ['u1'] },
        { _id: 'card6', boardId: 'B3', archived: false, members: ['u1'] },
      ]);
      const ids2 = async (filter, sort = { _id: 1 }) => (await lp.find(filter, { sort }).toArray()).map(d => d._id);
      const mine = { $or: [{ members: 'u1' }, { assignees: 'u1' }, { userId: 'u1' }] };
      const out = {
        visible: await ids2({ $or: [{ permission: 'public' }, { members: { $elemMatch: { userId: 'u1', isActive: true } } }] }),
        dueCards: await ids2({ archived: false, $and: [{ boardId: { $in: ids } }, mine] }, { dueAt: 1, _id: 1 }),
        longIn: await ids2({ boardId: { $in: ids } }),
        longInNumbers: await ids2({ n: { $in: Array.from({ length: 40 }, (_, i) => i) } }),
        orMissing: await ids2({ $or: [{ assignees: 'u2' }, { nothere: 'x' }] }),
        orWithRegex: await ids2({ $or: [{ members: 'u2' }, { _id: { $regex: '^pub' } }] }),
        elemMatchOperator: await ids2({ members: { $elemMatch: { userId: { $in: ['u3'] }, isActive: true } } }),
      };
      await lp.drop().catch(() => {});
      return out;
    }
    case 'mixedSort': {
      // A sort over values of every simple type, with ties, null and missing
      // fields - SQLite sorts these in the database (FerretDB's ORDER BY
      // pushdown) - and, separately, with an array and a document among them,
      // which make the handler sort in Go again. _id breaks ties, so the
      // answer is one order everywhere.
      await db.collection('mixed_sort').drop().catch(() => {});
      const ms = db.collection('mixed_sort');
      const simple = [
        5, -3, 2.5, 5, -0.5, 0, 'b', 'a', '', 'B', '\u00e4\u00f6', 'a', true, false,
        new Date(Date.UTC(2026, 9, 24)), new Date(Date.UTC(2026, 9, 23)), null, undefined, 1e10, 2 ** 40,
      ];
      await ms.insertMany(simple.map((v, i) => (v === undefined ? { _id: i, k: i % 3 } : { _id: i, k: i % 3, v })));
      const order = async (sort, limit) =>
        (await ms.find({}, { sort, ...(limit ? { limit } : {}) }).toArray()).map(d => d._id);
      const out = {
        asc: await order({ v: 1, _id: 1 }),
        desc: await order({ v: -1, _id: 1 }),
        compound: await order({ k: -1, v: 1, _id: 1 }),
        limited: await order({ v: 1, _id: 1 }, 5),
        limitedDesc: await order({ v: -1, _id: -1 }, 5),
      };
      await ms.insertMany([{ _id: 100, v: [7, -10] }, { _id: 101, v: { x: 1 } }]);
      out.complexAsc = await order({ v: 1, _id: 1 });
      out.complexDesc = await order({ v: -1, _id: 1 }, 6);
      await ms.drop().catch(() => {});
      return out;
    }
    case 'indexedEquality': {
      // An equality or $in on an INDEXED field. MySQL and MariaDB answer it from
      // the index's generated column (FerretDB's indexedNarrowing), which must
      // still find a value inside an array, a value differing only by case must
      // not match, and a value the column cannot compare exactly (special
      // characters, a number) must still be found the slower way.
      await db.collection('indexed_eq').drop().catch(() => {});
      const ix = db.collection('indexed_eq');
      await ix.createIndex({ f: 1 });
      await ix.createIndex({ g: 1, f: 1 });
      await ix.insertMany([
        { _id: 1, f: 'abc' }, { _id: 2, f: ['x', 'abc'] }, { _id: 3, f: 'ABC' }, { _id: 4, f: 'a<b&"c' },
        { _id: 5, f: 5 }, { _id: 6, f: 5.5 }, { _id: 7 }, { _id: 8, f: 'abc', g: 'k' }, { _id: 9, f: 'x'.repeat(200) },
        { _id: 10, f: [] }, { _id: 11, f: { abc: 1 } },
      ]);
      const ids = async filter => (await ix.find(filter, { sort: { _id: 1 } }).toArray()).map(d => d._id);
      const out = {
        eq: await ids({ f: 'abc' }),
        eqOp: await ids({ f: { $eq: 'abc' } }),
        upper: await ids({ f: 'ABC' }),
        special: await ids({ f: 'a<b&"c' }),
        number: await ids({ f: 5 }),
        inList: await ids({ f: { $in: ['abc', 'x'] } }),
        inMixed: await ids({ f: { $in: ['ABC', 5.5] } }),
        compound: await ids({ g: 'k', f: 'abc' }),
        long: await ids({ f: 'x'.repeat(200) }),
        byId: await ids({ _id: 3 }),
        // Inside an $and, as WeKan's due cards query wraps its board ids.
        andIn: await ids({ $and: [{ f: { $in: ['abc', 'x'] } }, { $or: [{ g: 'k' }, { _id: { $lte: 2 } }] }] }),
        andEq: await ids({ $and: [{ f: 'abc' }, { f: { $in: ['abc', 'ABC'] } }] }),
      };
      await ix.drop().catch(() => {});
      return out;
    }
    case 'stringIds': {
      // Writes by STRING _id - the seed's _ids are numbers, and MariaDB 12.3
      // compares JSON numbers right but two equal JSON strings as different:
      // FerretDB's update and delete by _id matched nothing there, and every
      // edit was silently lost. And _ids that differ only by case or accent are
      // different documents, which a case-insensitive _id index refused.
      await db.collection('string_ids').drop().catch(() => {});
      const ids = db.collection('string_ids');
      const inserted = await ids.insertMany([{ _id: 'a', v: 1 }, { _id: 'A', v: 2 }, { _id: 'ä', v: 3 }, { _id: 'b', v: 4 }])
        .then(r => r.insertedCount, e => `error ${e.code}`);
      const updated = await ids.updateOne({ _id: 'a' }, { $set: { v: 10 } }).then(r => r.modifiedCount);
      const replaced = await ids.replaceOne({ _id: 'ä' }, { v: 30 }).then(r => r.modifiedCount);
      const deleted = await ids.deleteOne({ _id: 'A' }).then(r => r.deletedCount);
      const many = await ids.deleteMany({ _id: { $in: ['b', 'nope'] } }).then(r => r.deletedCount);
      const left = await ids.find({}, { sort: { _id: 1 } }).toArray();
      await ids.drop().catch(() => {});
      return { inserted, updated, replaced, deleted, many, left };
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

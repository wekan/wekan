'use strict';

// WHAT is asked of every database, and how the answers are compared.
//
// FerretDB v1 stores MongoDB documents in SQLite, PostgreSQL, MySQL, MariaDB or
// SAP HANA. Every one of those is a different translation of the same query into
// a different SQL dialect, so "it starts and WeKan loads" says very little: the
// question is whether `{a: {$gt: 5}}` returns the same documents, in the same
// order, on all of them.
//
// So this is one catalogue of queries, declarative on purpose - a case is data,
// not code - which means it can be listed, counted and unit-tested without a
// database anywhere near it. tests/dbConformance/run.cjs executes it against one
// FerretDB, and compare.cjs checks that every backend gave the same answer.
//
// The operator list is taken from the FerretDB v1 source itself
// (internal/handler/common/*.go and .../aggregations/stages/*.go), not from
// MongoDB's manual: the point is to cover what THIS FerretDB implements.

// ── the fixed dataset ───────────────────────────────────────────────────────
// Small, and deliberately awkward: mixed types in one field, nulls, missing
// fields, nested documents, arrays of scalars and of documents, a negative
// number, a zero, a float that is not an integer, and strings that sort
// differently under different collations.
const SEED = [
  { _id: 1, name: 'alpha', n: 5, f: 1.5, tags: ['red', 'green'], nested: { a: 1, b: 'x' },
    items: [{ k: 'a', v: 1 }, { k: 'b', v: 2 }], flag: true, when: new Date('2020-01-02T03:04:05Z') },
  { _id: 2, name: 'Beta', n: -3, f: 2.0, tags: ['green'], nested: { a: 2, b: 'y' },
    items: [{ k: 'a', v: 5 }], flag: false, when: new Date('2021-06-07T08:09:10Z') },
  { _id: 3, name: 'gamma', n: 0, f: 0.5, tags: [], nested: { a: 3 },
    items: [], flag: true, when: new Date('2022-12-31T23:59:59Z') },
  { _id: 4, name: 'delta', n: 42, f: 42.5, tags: ['blue', 'red', 'red'], nested: { a: 4, b: 'z' },
    items: [{ k: 'c', v: 7 }, { k: 'a', v: 9 }], flag: true, when: new Date('2019-03-04T05:06:07Z') },
  { _id: 5, name: 'epsilon', n: null, tags: ['blue'], nested: {}, items: [{ k: 'b', v: 0 }],
    when: new Date('2023-01-01T00:00:00Z') },
  { _id: 6, name: 'zeta', n: 7, f: 7.25, nested: { a: null }, flag: false,
    when: new Date('2018-11-12T13:14:15Z') },
];

// A second collection, for $lookup.
const SEED_OTHER = [
  { _id: 'a', label: 'A label' },
  { _id: 'b', label: 'B label' },
  { _id: 'c', label: 'C label' },
];

// ── how an answer is compared ───────────────────────────────────────────────
//
//   'results' - the returned documents must be IDENTICAL across backends. This
//               is the default and the interesting one.
//   'shape'   - the answer legitimately differs per backend (an EXPLAIN plan is a
//               different plan on PostgreSQL than on SQLite), so only the shape
//               is compared: which keys came back, and of what type.
//   'ok'      - the command must merely succeed everywhere. Used where the value
//               is a size in bytes or a count of pages, which a different storage
//               engine is entitled to answer differently.
const COMPARE = { RESULTS: 'results', SHAPE: 'shape', OK: 'ok' };

// Fields whose value CANNOT be the same twice, because the server writes the
// clock into them. $currentDate sets one, and every later case in that group
// returns the whole collection - so without this, one $currentDate turns every
// following case into a "difference" between backends that ran a minute apart.
// Recorded as their type, everywhere, not only in the case that wrote them.
const VOLATILE_FIELDS = ['touched'];

// ── the catalogue ───────────────────────────────────────────────────────────
// Every case: { group, name, kind, ...payload, compare }
// `kind` is what run.cjs does with it, so a case is data all the way down.
const CASES = [
  // ── comparison ────────────────────────────────────────────────────────────
  { group: 'comparison', name: '$eq', kind: 'find', filter: { n: { $eq: 5 } } },
  { group: 'comparison', name: '$eq implicit', kind: 'find', filter: { name: 'alpha' } },
  { group: 'comparison', name: '$ne', kind: 'find', filter: { n: { $ne: 5 } } },
  { group: 'comparison', name: '$gt', kind: 'find', filter: { n: { $gt: 0 } } },
  { group: 'comparison', name: '$gte', kind: 'find', filter: { n: { $gte: 0 } } },
  { group: 'comparison', name: '$lt', kind: 'find', filter: { n: { $lt: 7 } } },
  { group: 'comparison', name: '$lte', kind: 'find', filter: { n: { $lte: 0 } } },
  { group: 'comparison', name: '$in', kind: 'find', filter: { n: { $in: [5, 42, 999] } } },
  { group: 'comparison', name: '$in with null', kind: 'find', filter: { n: { $in: [5, null] } } },
  { group: 'comparison', name: '$nin', kind: 'find', filter: { n: { $nin: [5, 42] } } },
  { group: 'comparison', name: 'range on float', kind: 'find', filter: { f: { $gt: 1, $lt: 8 } } },
  { group: 'comparison', name: 'range on date', kind: 'find',
    filter: { when: { $gte: new Date('2020-01-01T00:00:00Z') } } },
  { group: 'comparison', name: 'string range', kind: 'find', filter: { name: { $gt: 'd' } } },

  // ── logical ───────────────────────────────────────────────────────────────
  { group: 'logical', name: '$and', kind: 'find', filter: { $and: [{ n: { $gt: 0 } }, { flag: true }] } },
  { group: 'logical', name: '$or', kind: 'find', filter: { $or: [{ n: 42 }, { name: 'alpha' }] } },
  { group: 'logical', name: '$nor', kind: 'find', filter: { $nor: [{ n: 42 }, { name: 'alpha' }] } },
  { group: 'logical', name: '$not', kind: 'find', filter: { n: { $not: { $gt: 0 } } } },

  // ── element ───────────────────────────────────────────────────────────────
  { group: 'element', name: '$exists true', kind: 'find', filter: { f: { $exists: true } } },
  { group: 'element', name: '$exists false', kind: 'find', filter: { f: { $exists: false } } },
  { group: 'element', name: '$type string', kind: 'find', filter: { n: { $type: 'null' } } },
  { group: 'element', name: '$type number', kind: 'find', filter: { n: { $type: 'int' } } },

  // ── evaluation ────────────────────────────────────────────────────────────
  { group: 'evaluation', name: '$regex', kind: 'find', filter: { name: { $regex: '^a' } } },
  { group: 'evaluation', name: '$regex case-insensitive', kind: 'find',
    filter: { name: { $regex: '^b', $options: 'i' } } },
  { group: 'evaluation', name: '$mod', kind: 'find', filter: { n: { $mod: [2, 1] } } },
  { group: 'evaluation', name: '$expr', kind: 'find', filter: { $expr: { $gt: ['$n', 5] } } },

  // ── array ─────────────────────────────────────────────────────────────────
  { group: 'array', name: 'equality on array member', kind: 'find', filter: { tags: 'red' } },
  { group: 'array', name: '$all', kind: 'find', filter: { tags: { $all: ['red', 'green'] } } },
  { group: 'array', name: '$size', kind: 'find', filter: { tags: { $size: 1 } } },
  { group: 'array', name: '$size zero', kind: 'find', filter: { tags: { $size: 0 } } },
  { group: 'array', name: '$elemMatch', kind: 'find',
    filter: { items: { $elemMatch: { k: 'a', v: { $gt: 3 } } } } },
  { group: 'array', name: 'dotted array field', kind: 'find', filter: { 'items.k': 'b' } },

  // ── nested documents ──────────────────────────────────────────────────────
  { group: 'nested', name: 'dotted path', kind: 'find', filter: { 'nested.a': 2 } },
  { group: 'nested', name: 'dotted path null', kind: 'find', filter: { 'nested.a': null } },
  { group: 'nested', name: 'whole subdocument', kind: 'find', filter: { nested: { a: 2, b: 'y' } } },

  // ── bitwise ───────────────────────────────────────────────────────────────
  { group: 'bitwise', name: '$bitsAllSet', kind: 'find', filter: { n: { $bitsAllSet: 1 } } },
  { group: 'bitwise', name: '$bitsAnySet', kind: 'find', filter: { n: { $bitsAnySet: 2 } } },
  { group: 'bitwise', name: '$bitsAllClear', kind: 'find', filter: { n: { $bitsAllClear: 1 } } },
  { group: 'bitwise', name: '$bitsAnyClear', kind: 'find', filter: { n: { $bitsAnyClear: 1 } } },

  // ── projection, sort, paging ──────────────────────────────────────────────
  { group: 'projection', name: 'include fields', kind: 'find', filter: {},
    options: { projection: { name: 1, n: 1 } } },
  { group: 'projection', name: 'exclude fields', kind: 'find', filter: {},
    options: { projection: { items: 0, tags: 0, nested: 0, when: 0 } } },
  { group: 'projection', name: '$slice', kind: 'find', filter: { tags: { $exists: true } },
    options: { projection: { tags: { $slice: 1 } } } },
  { group: 'projection', name: 'elemMatch projection', kind: 'find', filter: {},
    options: { projection: { items: { $elemMatch: { k: 'a' } } } } },
  // `$meta` is the third projection operator. Two keywords can be answered, and
  // they are compared differently on purpose.
  //
  // `recordId` is the STORAGE identity of the document, so its value is each
  // backend's own and comparing values would report a difference that is not
  // one. What has to agree is that every backend answers, and answers with the
  // same shape - a number on every row - which is what COMPARE.SHAPE checks.
  { group: 'projection', name: '$meta recordId', kind: 'find', filter: {},
    options: { projection: { name: 1, rid: { $meta: 'recordId' } }, sort: { _id: 1 } },
    compare: COMPARE.SHAPE },
  // `textScore` is computed by the handler ABOVE the backends, from the
  // document's own strings, so every backend must produce the SAME number and
  // the values are compared in full. It is also the only case that exercises
  // `$text`: only `alpha` (_id 1) carries the term, and it carries it once.
  // Sorted by `_id` so the comparison does not depend on the order a backend
  // happens to return rows in.
  { group: 'projection', name: '$meta textScore', kind: 'find',
    filter: { $text: { $search: 'alpha' } },
    options: { projection: { name: 1, score: { $meta: 'textScore' } }, sort: { _id: 1 } } },
  { group: 'sort', name: 'sort ascending', kind: 'find', filter: {}, options: { sort: { n: 1 } } },
  { group: 'sort', name: 'sort descending', kind: 'find', filter: {}, options: { sort: { n: -1 } } },
  { group: 'sort', name: 'sort by two fields', kind: 'find', filter: {},
    options: { sort: { flag: 1, name: 1 } } },
  { group: 'sort', name: 'sort by date', kind: 'find', filter: {}, options: { sort: { when: 1 } } },
  { group: 'paging', name: 'limit', kind: 'find', filter: {}, options: { sort: { _id: 1 }, limit: 2 } },
  { group: 'paging', name: 'skip + limit', kind: 'find', filter: {},
    options: { sort: { _id: 1 }, skip: 2, limit: 2 } },
  { group: 'paging', name: 'skip past the end', kind: 'find', filter: {},
    options: { sort: { _id: 1 }, skip: 99 } },

  // ── counting and distinct ─────────────────────────────────────────────────
  { group: 'count', name: 'countDocuments all', kind: 'count', filter: {} },
  { group: 'count', name: 'countDocuments filtered', kind: 'count', filter: { flag: true } },
  { group: 'count', name: 'distinct scalar', kind: 'distinct', field: 'name', filter: {} },
  { group: 'count', name: 'distinct array field', kind: 'distinct', field: 'tags', filter: {} },
  { group: 'count', name: 'distinct dotted', kind: 'distinct', field: 'nested.a', filter: {} },

  // ── aggregation ───────────────────────────────────────────────────────────
  { group: 'aggregation', name: '$match + $sort', kind: 'aggregate',
    pipeline: [{ $match: { n: { $gt: 0 } } }, { $sort: { n: 1 } }] },
  { group: 'aggregation', name: '$group $sum', kind: 'aggregate',
    pipeline: [{ $group: { _id: '$flag', total: { $sum: '$n' } } }, { $sort: { _id: 1 } }] },
  { group: 'aggregation', name: '$group $avg $min $max', kind: 'aggregate',
    pipeline: [{ $group: { _id: null, avg: { $avg: '$n' }, min: { $min: '$n' }, max: { $max: '$n' } } }] },
  { group: 'aggregation', name: '$group $first $last $push', kind: 'aggregate',
    pipeline: [{ $sort: { _id: 1 } },
      { $group: { _id: '$flag', first: { $first: '$name' }, last: { $last: '$name' }, all: { $push: '$name' } } },
      { $sort: { _id: 1 } }] },
  { group: 'aggregation', name: '$count', kind: 'aggregate',
    pipeline: [{ $match: { flag: true } }, { $count: 'howMany' }] },
  { group: 'aggregation', name: '$project', kind: 'aggregate',
    pipeline: [{ $sort: { _id: 1 } }, { $project: { name: 1, doubled: { $multiply: ['$n', 2] } } }] },
  { group: 'aggregation', name: '$addFields', kind: 'aggregate',
    pipeline: [{ $sort: { _id: 1 } }, { $addFields: { tagCount: { $size: { $ifNull: ['$tags', []] } } } },
      { $project: { name: 1, tagCount: 1 } }] },
  { group: 'aggregation', name: '$set', kind: 'aggregate',
    pipeline: [{ $sort: { _id: 1 } }, { $set: { upper: { $toUpper: '$name' } } },
      { $project: { upper: 1 } }] },
  { group: 'aggregation', name: '$skip + $limit', kind: 'aggregate',
    pipeline: [{ $sort: { _id: 1 } }, { $skip: 1 }, { $limit: 2 }] },
  { group: 'aggregation', name: '$sortByCount', kind: 'aggregate',
    pipeline: [{ $sortByCount: '$flag' }] },
  { group: 'aggregation', name: '$replaceRoot', kind: 'aggregate',
    pipeline: [{ $match: { _id: 1 } }, { $replaceRoot: { newRoot: '$nested' } }] },
  { group: 'aggregation', name: '$facet', kind: 'aggregate',
    pipeline: [{ $facet: { counted: [{ $count: 'n' }], firstTwo: [{ $sort: { _id: 1 } }, { $limit: 2 }, { $project: { name: 1 } }] } }] },
  { group: 'aggregation', name: '$bucket', kind: 'aggregate',
    pipeline: [{ $match: { n: { $ne: null } } },
      { $bucket: { groupBy: '$n', boundaries: [-10, 0, 10, 100], default: 'other', output: { count: { $sum: 1 } } } }] },
  { group: 'aggregation', name: '$lookup', kind: 'aggregate',
    pipeline: [{ $sort: { _id: 1 } }, { $limit: 3 },
      { $lookup: { from: 'other', localField: 'nested.b', foreignField: '_id', as: 'joined' } },
      { $project: { name: 1, joined: 1 } }] },
  { group: 'aggregation', name: '$group $stdDevPop', kind: 'aggregate',
    pipeline: [{ $group: { _id: null, sd: { $stdDevPop: '$n' } } }] },

  // ── writes: every update operator FerretDB v1 implements ──────────────────
  { group: 'update', name: '$set', kind: 'update', filter: { _id: 1 }, update: { $set: { added: 'yes' } } },
  { group: 'update', name: '$unset', kind: 'update', filter: { _id: 1 }, update: { $unset: { f: '' } } },
  { group: 'update', name: '$inc', kind: 'update', filter: { _id: 1 }, update: { $inc: { n: 10 } } },
  { group: 'update', name: '$mul', kind: 'update', filter: { _id: 1 }, update: { $mul: { n: 3 } } },
  { group: 'update', name: '$min', kind: 'update', filter: { _id: 4 }, update: { $min: { n: 1 } } },
  { group: 'update', name: '$max', kind: 'update', filter: { _id: 4 }, update: { $max: { n: 99 } } },
  { group: 'update', name: '$rename', kind: 'update', filter: { _id: 2 }, update: { $rename: { name: 'title' } } },
  { group: 'update', name: '$setOnInsert (upsert)', kind: 'update', filter: { _id: 99 },
    update: { $setOnInsert: { created: true } }, options: { upsert: true } },
  { group: 'update', name: '$push', kind: 'update', filter: { _id: 1 }, update: { $push: { tags: 'blue' } } },
  { group: 'update', name: '$push $each $sort $slice', kind: 'update', filter: { _id: 1 },
    update: { $push: { tags: { $each: ['aqua', 'black'], $sort: 1, $slice: 3 } } } },
  { group: 'update', name: '$addToSet', kind: 'update', filter: { _id: 4 }, update: { $addToSet: { tags: 'red' } } },
  { group: 'update', name: '$pop', kind: 'update', filter: { _id: 4 }, update: { $pop: { tags: 1 } } },
  { group: 'update', name: '$pull', kind: 'update', filter: { _id: 4 }, update: { $pull: { tags: 'red' } } },
  { group: 'update', name: '$pullAll', kind: 'update', filter: { _id: 1 }, update: { $pullAll: { tags: ['red'] } } },
  { group: 'update', name: '$currentDate', kind: 'update', filter: { _id: 3 },
    update: { $currentDate: { touched: true } } },
  { group: 'update', name: '$bit', kind: 'update', filter: { _id: 6 }, update: { $bit: { n: { and: 3 } } } },
  { group: 'update', name: 'updateMany', kind: 'update', filter: { flag: true },
    update: { $set: { seen: 1 } }, many: true },
  { group: 'update', name: 'replaceOne', kind: 'replace', filter: { _id: 6 },
    replacement: { _id: 6, name: 'zeta', replaced: true } },
  { group: 'update', name: 'findOneAndUpdate', kind: 'findAndModify', filter: { _id: 2 },
    update: { $set: { touchedBy: 'findAndModify' } }, options: { returnDocument: 'after' } },
  { group: 'update', name: 'deleteOne', kind: 'delete', filter: { _id: 5 } },
  { group: 'update', name: 'deleteMany', kind: 'delete', filter: { flag: false }, many: true },

  // ── indexes ───────────────────────────────────────────────────────────────
  { group: 'index', name: 'create + list', kind: 'indexes',
    create: [{ key: { n: 1 }, name: 'n_1' }, { key: { name: 1, n: -1 }, name: 'name_1_n_-1' },
      { key: { 'nested.a': 1 }, name: 'nested.a_1', unique: false }] },
  { group: 'index', name: 'unique index rejects a duplicate', kind: 'uniqueIndex' },
  { group: 'index', name: 'query uses the index and still returns the same rows', kind: 'find',
    filter: { n: { $gte: 0 } }, options: { sort: { n: 1 } } },
  { group: 'index', name: 'drop', kind: 'dropIndex', name_: 'n_1' },

  // ── things whose ANSWER may differ, but which must work ───────────────────
  // An EXPLAIN is a different plan on every engine - not only different values but
  // different keys - so it only has to answer. Comparing its shape said "different"
  // for the one thing that cannot be the same.
  { group: 'meta', name: 'explain a find', kind: 'explain', filter: { n: { $gt: 0 } },
    compare: COMPARE.OK },
  { group: 'meta', name: 'collStats', kind: 'command', command: { collStats: 'conformance' },
    compare: COMPARE.OK },
  { group: 'meta', name: 'dbStats', kind: 'command', command: { dbStats: 1 }, compare: COMPARE.OK },
  { group: 'meta', name: 'listCollections', kind: 'listCollections', compare: COMPARE.RESULTS },
  { group: 'meta', name: 'capped collection keeps only the newest', kind: 'capped' },
  { group: 'meta', name: 'buildInfo answers', kind: 'command', command: { buildInfo: 1 },
    compare: COMPARE.OK },
];

// Cases run in order, and the write cases MUTATE the collection on purpose: a
// backend that applies $inc differently must show it in every later read too.
// So the catalogue is re-seeded before each GROUP, not before each case - which
// run.cjs does, and which is why the order inside a group matters.
const GROUPS = [...new Set(CASES.map(c => c.group))];

module.exports = { SEED, SEED_OTHER, CASES, GROUPS, COMPARE, VOLATILE_FIELDS };

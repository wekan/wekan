'use strict';

// Time the common WeKan queries against ONE database, and record what it answered.
//
//   node docs/Databases/FerretDB/1/SpeedTest/run.cjs --uri mongodb://127.0.0.1:37017 \
//        --label sqlite --engine "FerretDB v1.98.0 + SQLite 3.51" --out .tools/log/...
//
// 1. drops and LOADS the dummy database (data.cjs) - timed;
// 2. creates the indexes WeKan creates (indexes.cjs) - timed;
// 3. runs every query of queries.cjs once per parameter (the warm-up pass, whose
//    answers are fingerprinted for the comparison), then again until the query's
//    time budget is used, and keeps every call's time;
// 4. writes <out>/speedtest-<label>.json.
//
// Nothing here decides which database is faster or correct: report.cjs compares
// the files.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../../..');
const { MongoClient } = require(path.join(ROOT, 'node_modules/mongodb'));
const data = require('./data.cjs');
const { wekanIndexes } = require('./indexes.cjs');
// --queries <file>: another catalogue of the same shape - for timing a query
// before and after a change to it, side by side.
const QUERIES_FILE = (() => {
  const i = process.argv.indexOf('--queries');
  return i !== -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : './queries.cjs';
})();
const { QUERIES, writtenState } = require(QUERIES_FILE);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const URI = arg('uri', 'mongodb://127.0.0.1:27017');
const LABEL = arg('label', 'unknown');
const ENGINE = arg('engine', LABEL);
const OUT = arg('out', '.');
const DB_NAME = arg('db', 'wekanspeedtest');
const SCALE = Number(arg('scale', process.env.WEKAN_SPEEDTEST_SCALE || '2'));
// How long ONE query may keep being repeated after its warm-up pass.
const BUDGET_MS = Number(arg('budget-ms', process.env.WEKAN_SPEEDTEST_BUDGET_MS || '10000'));
const MAX_PASSES = Number(arg('passes', process.env.WEKAN_SPEEDTEST_PASSES || '5'));
// For working on one query: --only login,dueCards runs just those; --keep leaves
// the database in place afterwards and --reuse skips the load when it is there.
const ONLY = arg('only', '') ? arg('only', '').split(',') : null;
const KEEP = process.argv.includes('--keep');
const REUSE = process.argv.includes('--reuse');
// How many ordinary boards/users join the biggest ones as parameters.
const SAMPLE = 12;

// ── fingerprinting an answer ────────────────────────────────────────────────
// Types spelled out, numbers as numbers, keys sorted: two engines listing a
// document's fields in a different order is not a difference; a different value,
// type or (for an ordered query) position is.
function normalise(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(normalise);
  if (value instanceof Date) return { $date: value.toISOString() };
  if (typeof value === 'number') return Number.isInteger(value) ? value : Number(value.toFixed(10));
  if (typeof value === 'bigint') return Number(value);
  if (typeof value !== 'object') return value;
  if (value._bsontype) {
    if (typeof value.toNumber === 'function' && value._bsontype !== 'ObjectId') return normalise(value.toNumber());
    return { [`$${value._bsontype}`]: String(value) };
  }
  const out = {};
  for (const k of Object.keys(value).sort()) out[k] = normalise(value[k]);
  return out;
}
function fingerprint(answer, ordered) {
  let n = normalise(answer);
  if (!ordered && Array.isArray(n)) n = n.map(d => JSON.stringify(d)).sort();
  const text = JSON.stringify(n);
  return { sha256: crypto.createHash('sha256').update(text).digest('hex'), size: Array.isArray(answer) ? answer.length : undefined, sample: text.slice(0, 300) };
}

// ── the parameters: the same everywhere, chosen from the plan ───────────────
function pickSample(items, weightOf, n, seed) {
  const rnd = data.prng(seed);
  const sorted = [...items].sort((a, b) => weightOf(b) - weightOf(a) || (a.order - b.order));
  const top = sorted.slice(0, 3);
  const rest = items.filter(x => !top.includes(x));
  const picked = new Set();
  while (picked.size < Math.min(n, rest.length)) picked.add(rest[Math.floor(rnd() * rest.length)]);
  return [...top, ...[...picked].sort((a, b) => a.order - b.order)];
}

function parameters(plan) {
  const memberOf = new Map();
  plan.boards.forEach((b) => b.members.forEach((u) => memberOf.set(u, (memberOf.get(u) || 0) + 1)));
  const users = plan.users.map((id, i) => ({ order: i, id, boards: memberOf.get(i) || 0 }));
  const pickedUsers = pickSample(users.filter(u => u.boards > 0), u => u.boards, SAMPLE, plan.seed + 100);
  const boards = plan.boards.map((b, i) => ({ order: i, b })).filter(x => !x.b.archived && x.b.type === 'board' && x.b.cards > 0);
  const pickedBoards = pickSample(boards, x => x.b.cards, SAMPLE, plan.seed + 200);

  // The details a query needs - a list and swimlane of the board, some of its
  // cards, a word from a card title - come from the generated documents, read
  // once, not from the database being tested.
  const want = new Map(pickedBoards.map(x => [x.b._id, { _id: x.b._id, cards: x.b.cards, cardIds: [], members: x.b.members.map(u => plan.users[u]) }]));
  for (const batch of data.documents(plan, 'cards', 5000)) {
    for (const c of batch) {
      const w = want.get(c.boardId);
      if (!w || w.cardIds.length >= 20) continue;
      if (!w.cardIds.length) { w.listId = c.listId; w.swimlaneId = c.swimlaneId; w.word = c.title.split(' ')[1] || c.title; w.cardId = c._id; w.userId = c.userId; }
      // Any card of the board, archived or not: a board whose few cards are all
      // archived must still have one to edit, or the write is updateOne({ _id:
      // undefined }) - a scan of every card that measures nothing WeKan does.
      w.cardIds.push(c._id);
    }
  }
  const starredOf = new Map();
  for (const batch of data.documents(plan, 'users', 5000)) {
    for (const u of batch) starredOf.set(u._id, { username: u.username, starredBoards: u.profile.starredBoards });
  }
  return {
    users: pickedUsers.map((u, index) => ({ index, user: { _id: u.id, boards: u.boards, ...starredOf.get(u.id) } })),
    boards: pickedBoards.map((x, index) => ({ index, board: want.get(x.b._id) })),
    // The first page, a middle one and the last.
    pages: [0, 1, Math.floor(plan.sizes.users / 20), Math.floor(plan.sizes.users / 10) - 1].map((page, index) => ({ index, page })),
  };
}

const median = (ms) => {
  const s = [...ms].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

// One median PER PARAMETER - the biggest board's own time, an ordinary board's own
// time - and from those: the average over the parameters (what the speed table
// ranks by, so the big boards count as the share of the questions they are) and
// the slowest parameter (almost always the biggest board or the busiest user).
// A median over all calls together would be an ordinary board's time and hide
// the big ones, which are where a user waits.
function stats(byParam) {
  const perParam = byParam.map(t => (t.length ? median(t) : undefined));
  const known = perParam.filter(v => v !== undefined);
  return {
    calls: byParam.reduce((n, t) => n + t.length, 0),
    perParam,
    average: known.reduce((a, b) => a + b, 0) / known.length,
    typical: median(known),
    slowest: Math.max(...known),
  };
}

const now = () => Number(process.hrtime.bigint()) / 1e6;

async function main() {
  const started = new Date().toISOString();
  const client = await MongoClient.connect(URI, { serverSelectionTimeoutMS: 30000, socketTimeoutMS: 0 });
  const db = client.db(DB_NAME);
  const result = { label: LABEL, engine: ENGINE, uri: URI.replace(/\/\/[^@/]*@/, '//***@'), started,
    scale: SCALE, load: {}, indexes: {}, queries: {}, errors: [] };
  try {
    try {
      const info = await db.admin().command({ buildInfo: 1 });
      result.buildInfo = { version: info.version, ferretdb: info.ferretdbVersion || (info.ferretdbFeatures ? 'yes' : undefined) };
    } catch (e) { result.buildInfo = { error: e.message }; }

    console.log(`[${LABEL}] ${ENGINE}: planning the data (scale ${SCALE})`);
    const plan = data.plan({ scale: SCALE });
    result.sizes = plan.sizes;
    const loaded = REUSE && await db.collection('cards').estimatedDocumentCount().catch(() => 0) >= plan.sizes.cards;
    if (!loaded) await db.dropDatabase();

    // 1. load
    for (const name of loaded ? [] : data.COLLECTIONS) {
      const t0 = now();
      let n = 0;
      for (const batch of data.documents(plan, name, 1000)) {
        await db.collection(name).insertMany(batch, { ordered: true });
        n += batch.length;
        if (n % 100000 < 1000) process.stdout.write(`\r[${LABEL}] loading ${name}: ${n}/${plan.sizes[name]}   `);
      }
      result.load[name] = { docs: n, ms: now() - t0 };
      console.log(`\r[${LABEL}] loaded ${name}: ${n} documents in ${(result.load[name].ms / 1000).toFixed(1)} s        `);
    }

    // 2. indexes
    const { indexes } = loaded ? { indexes: [] } : wekanIndexes();
    const tIx = now();
    for (const ix of indexes) {
      const t0 = now();
      try {
        await db.collection(ix.collection).createIndex(ix.key, ix.options);
        result.indexes[`${ix.collection} ${JSON.stringify(ix.key)}`] = { ms: now() - t0 };
      } catch (e) {
        result.indexes[`${ix.collection} ${JSON.stringify(ix.key)}`] = { ms: now() - t0, error: e.message };
        result.errors.push({ where: `createIndex ${ix.collection} ${JSON.stringify(ix.key)} ${JSON.stringify(ix.options)}`, error: e.message });
        console.log(`[${LABEL}] index ${ix.collection} ${JSON.stringify(ix.key)} ${JSON.stringify(ix.options)}: ${e.message}`);
      }
    }
    result.indexTotalMs = now() - tIx;
    console.log(`[${LABEL}] ${indexes.length} indexes in ${(result.indexTotalMs / 1000).toFixed(1)} s`);

    // 3. queries
    const params = parameters(plan);
    result.parameters = {
      users: params.users.map(p => ({ _id: p.user._id, boards: p.user.boards })),
      boards: params.boards.map(p => ({ _id: p.board._id, cards: p.board.cards })),
      pages: params.pages.map(p => p.page),
    };
    for (const q of QUERIES) {
      if (ONLY && !ONLY.includes(q.id)) continue;
      const list = params[q.params];
      const warm = list.map(() => []);
      const answers = [];
      let failed = null;
      // Warm-up pass: every parameter once, answers fingerprinted.
      for (const [i, p] of list.entries()) {
        const t0 = now();
        try {
          const answer = await q.run(db, p, 0);
          warm[i].push(now() - t0);
          answers.push(fingerprint(answer, q.ordered));
        } catch (e) {
          failed = e.message;
          answers.push({ error: e.message });
        }
      }
      // Timed passes: the warm-up already read what each query needs from disk, so
      // these measure the database answering, not the first cold read. Writes keep
      // their first pass too - each pass writes a different card, so none is warm.
      const timed = q.write ? warm.map(t => [...t]) : list.map(() => []);
      const tStart = now();
      // Writes always make every pass: what they leave behind is compared, and a
      // slower database stopped by the time budget would have written less.
      for (let pass = 1; !failed && pass <= MAX_PASSES && (q.write || now() - tStart < BUDGET_MS); pass += 1) {
        for (const [i, p] of list.entries()) {
          const t0 = now();
          try { await q.run(db, p, pass); } catch (e) { failed = e.message; break; }
          timed[i].push(now() - t0);
        }
      }
      // A query too slow to be repeated within its budget keeps its warm-up time.
      timed.forEach((t, i) => { if (!t.length) t.push(...warm[i]); });
      const r = { title: q.title, ...stats(timed), error: failed || undefined, answers };
      result.queries[q.id] = r;
      console.log(`[${LABEL}] ${q.id.padEnd(15)} average ${r.average.toFixed(2)} ms  typical ${r.typical.toFixed(2)} ms  slowest ${r.slowest.toFixed(2)} ms  (${r.calls} calls)${failed ? `  ERROR ${failed}` : ''}`);
    }
    result.written = fingerprint(await writtenState(db), true);
  } catch (e) {
    result.errors.push({ where: 'run', error: e.stack || e.message });
    console.error(`[${LABEL}] ${e.stack || e.message}`);
  } finally {
    result.finished = new Date().toISOString();
    // Leave nothing behind: a 1 GB test database in a dev server's FerretDB is
    // not something anybody asked for.
    if (!KEEP) await db.dropDatabase().catch(() => {});
    await client.close();
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, `speedtest-${LABEL}.json`), `${JSON.stringify(result, null, 1)}\n`);
  }
  process.exit(result.errors.some(e => e.where === 'run') ? 1 : 0);
}

main();

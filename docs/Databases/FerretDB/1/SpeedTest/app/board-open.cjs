'use strict';

// Where the time goes when a WeKan board is opened, with WeKan running on a database
// (FerretDB on SQLite, or MongoDB): the browser's wall clock, what crosses the DDP
// WebSocket, the Meteor server's CPU by who spends it (Node inspector profile), and
// FerretDB's CPU (its pprof). The speed test asks the database alone; this asks whether
// the database is what a person waits for.
//
//   # WeKan on FerretDB: meteor run --port 3310 --inspect=9229 with MONGO_URL set,
//   # FerretDB with --debug-addr=127.0.0.1:8098
//   WEKAN_BASE_URL=http://localhost:3310 WEKAN_MONGO_URL=mongodb://127.0.0.1:27040/wekan \
//     node docs/Databases/FerretDB/1/SpeedTest/app/board-open.cjs --sizes 200,2000 \
//       --inspect 9229 --ferret-pprof http://127.0.0.1:8098 --label ferretdb-sqlite
//
// Dev servers: the Meteor build is the development one, so the client's own time is
// larger than in production; the comparison between databases is what it is for.

const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../../../../../..');
const pw = require(path.join(ROOT, 'tests/playwright/node_modules/playwright-core'));
const { MongoClient } = require(path.join(ROOT, 'tests/playwright/node_modules/mongodb'));
const WebSocket = require(path.join(ROOT, 'node_modules/ws'));

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const BASE = process.env.WEKAN_BASE_URL || 'http://localhost:3310';
process.env.WEKAN_BASE_URL = BASE;
const MONGO = process.env.WEKAN_MONGO_URL || 'mongodb://127.0.0.1:27040/wekan';
process.env.WEKAN_MONGO_URL = MONGO;
const db = require(path.join(ROOT, 'tests/playwright/helpers/db.js'));
const { loginWithToken } = require(path.join(ROOT, 'tests/playwright/helpers/auth.js'));

const SIZES = arg('sizes', '200,2000').split(',').map(Number);
const INSPECT = arg('inspect', '');
const PPROF = arg('ferret-pprof', '');
const LABEL = arg('label', 'run');
const GO = arg('go', path.join(ROOT, '.tools/go/bin/go'));
const FERRET_BIN = arg('ferret-bin', path.join(ROOT, '.tools/FerretDB/bin/ferretdb'));
const QUIET_MS = 1500;

// ── seeding ─────────────────────────────────────────────────────────────────
async function seedBoard(user, size) {
  const board = db.seedBoard({ ownerId: user.id, title: `Open ${size}`, listCount: 6, cardTitlesPerList: [['Template']] });
  const template = db.findOne('cards', { boardId: board.boardId, title: 'Template' });
  const client = await new MongoClient(MONGO).connect();
  try {
    const cards = client.db().collection('cards');
    const docs = [];
    for (let i = 0; i < size; i += 1) {
      docs.push({
        ...template,
        _id: `card${board.boardId}x${i}`,
        title: `Card ${i} ${['plan', 'build', 'review', 'ship'][i % 4]} the thing`,
        listId: board.listIds[i % board.listIds.length],
        sort: Math.floor(i / board.listIds.length) * 100,
        cardNumber: i + 2,
        createdAt: new Date(), modifiedAt: new Date(), dateLastActivity: new Date(),
      });
    }
    for (let i = 0; i < docs.length; i += 1000) await cards.insertMany(docs.slice(i, i + 1000));
  } finally {
    await client.close();
  }
  return board;
}

// ── the Meteor server's CPU, from the Node inspector ────────────────────────
async function inspector() {
  const list = await (await fetch(`http://127.0.0.1:${INSPECT}/json`)).json();
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  let id = 0;
  const pending = new Map();
  ws.on('message', (m) => {
    const msg = JSON.parse(m);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  });
  const send = (method, params = {}) => new Promise((resolve) => { id += 1; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
  await send('Profiler.enable');
  await send('Profiler.setSamplingInterval', { interval: 250 });
  return {
    start: () => send('Profiler.start'),
    stop: async () => (await send('Profiler.stop')).result.profile,
    close: () => ws.close(),
  };
}

const { analyse } = require('./profileAnalysis.cjs');

// ── FerretDB's CPU, from its pprof ──────────────────────────────────────────
async function ferretProfile(seconds) {
  if (!PPROF) return null;
  const res = await fetch(`${PPROF}/debug/pprof/profile?seconds=${seconds}`);
  const file = path.join(process.env.TMPDIR || '/tmp', `ferret-open-${Date.now()}.prof`);
  require('fs').writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const env = { ...process.env, HOME: path.join(ROOT, '.tools') };
  const top = execFileSync(GO, ['tool', 'pprof', '-top', '-nodecount=80', FERRET_BIN, file], { encoding: 'utf8', env });
  const total = /Total samples = ([\d.]+)(m?s)/.exec(top);
  const cpuMs = total ? Number(total[1]) * (total[2] === 's' ? 1000 : 1) : null;
  // A line reads: flat flat% sum% cum cum% name - SQLite's share is the cumulative time of its VM.
  const line = top.split('\n').find((l) => /_sqlite3VdbeExec/.test(l));
  const sqlite = line ? /([\d.]+)(m?s)\s+[\d.]+%\s+[\d.]+%\s+([\d.]+)(m?s)\s+[\d.]+%/.exec(line) : null;
  // The cumulative top, for the first open: who in FerretDB spends it.
  const cum = execFileSync(GO, ['tool', 'pprof', '-top', '-cum', '-nodecount=34', FERRET_BIN, file], { encoding: 'utf8', env })
    .split('\n').filter((l) => /^\s+[\d.]+m?s/.test(l)).map((l) => l.trim().replace(/\s+/g, ' ')).slice(0, 34);
  return { cum, cpuMs, sqliteMs: sqlite ? Number(sqlite[3]) * (sqlite[4] === 's' ? 1000 : 1) : null };
}

// ── one board open ──────────────────────────────────────────────────────────
async function openBoard(user, board, size) {
  const browser = await pw.chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await context.newPage();
  await page.addInitScript(() => { try { localStorage.setItem('wekan-mobile-mode', 'false'); } catch (e) { /* none */ } });
  let frames = 0; let bytes = 0; let last = Date.now();
  page.on('websocket', (ws) => ws.on('framereceived', (e) => { frames += 1; bytes += e.payload.length; last = Date.now(); }));
  await loginWithToken(page, user.id, user.token);
  await page.waitForTimeout(1500);

  const insp = INSPECT ? await inspector() : null;
  frames = 0; bytes = 0;
  const ferret = PPROF ? ferretProfile(14) : Promise.resolve(null);
  if (insp) await insp.start();
  const t0 = Date.now();
  await page.goto(`${BASE}/b/${board.boardId}/${board.slug}`, { waitUntil: 'commit' });
  let tFirst = null;
  await page.waitForSelector('.minicard', { timeout: 60000 }).then(() => { tFirst = Date.now() - t0; });
  // quiet: no DDP frame for QUIET_MS
  for (;;) {
    if (Date.now() - last > QUIET_MS && Date.now() - t0 > (tFirst || 0)) break;
    if (Date.now() - t0 > 60000) break;
    await page.waitForTimeout(100);
  }
  const tQuiet = Date.now() - t0 - QUIET_MS;
  const profile = insp ? await insp.stop() : null;
  const minicards = await page.locator('.minicard').count();
  const ferretResult = await ferret;
  if (insp) insp.close();
  await browser.close();
  return { size, tFirst, tQuiet, frames, kb: Math.round(bytes / 1024), minicards, server: profile ? analyse(profile) : null, ferret: ferretResult };
}

const f = (v) => (v === null || v === undefined ? '-' : Math.round(v).toLocaleString('en-US'));

async function main() {
  const user = db.seedUser();
  const results = [];
  // What FerretDB spends in the same 14 s with nobody in the browser: the baseline.
  const idle = PPROF ? await ferretProfile(14) : null;
  if (idle) console.error(`FerretDB idle for 14 s: ${f(idle.cpuMs)} ms of CPU`);
  for (const size of SIZES) {
    console.error(`seeding a board of ${size} cards...`);
    const board = await seedBoard(user, size);
    // The first open of a board is the one a person waits for; a second shows a warm server.
    for (const pass of ['first open', 'second open']) {
      console.error(`opening ${size} (${pass})...`);
      const r = await openBoard(user, board, size);
      r.pass = pass;
      results.push(r);
    }
  }
  console.log(`\n## ${LABEL}: opening a board\n`);
  if (idle) console.log(`FerretDB with nobody in the browser: ${f(idle.cpuMs)} ms of CPU in the same 14 s window (subtract it).\n`);
  console.log('| Cards | Open | First card (ms) | Settled (ms) | DDP frames | DDP KB | Minicards drawn | Meteor server busy (ms) | FerretDB CPU (ms) | of it SQLite (ms) |');
  console.log('| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const r of results) {
    console.log(`| ${r.size} | ${r.pass} | ${f(r.tFirst)} | ${f(r.tQuiet)} | ${f(r.frames)} | ${f(r.kb)} | ${f(r.minicards)} | ${f(r.server && r.server.busyMs)} | ${f(r.ferret && r.ferret.cpuMs)} | ${f(r.ferret && r.ferret.sqliteMs)} |`);
  }
  for (const r of results.filter((x) => x.pass === 'first open' && x.server)) {
    console.log(`\n### The Meteor server, ${r.size} cards, first open: ${f(r.server.busyMs)} ms of CPU\n`);
    for (const [c, ms] of r.server.categories) console.log(`- ${c}: ${f(ms)} ms (${Math.round((100 * ms) / r.server.busyMs)}%)`);
    if (r.ferret && r.ferret.cum) {
      console.log(`\n### FerretDB, ${r.size} cards, first open: cumulative CPU by function (flat flat% sum% cum cum% name)\n`);
      console.log('```');
      r.ferret.cum.forEach((l) => console.log(l));
      console.log('```');
    }
    console.log('\nTop functions:');
    for (const [fn, ms] of r.server.topFunctions) console.log(`- ${f(ms)} ms  ${fn}`);
  }
  process.exit(0);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });


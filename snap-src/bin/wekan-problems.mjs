#!/usr/bin/env node
// wekan-problems.mjs — print the Admin Panel / Problems "Status" overview as text,
// so an admin with server (snap) access can see problems, migrations and repairs
// WITHOUT Admin Panel access. Built on the `mongodb` driver WeKan already bundles
// (same NODE_PATH bootstrap as db-eval.mjs), so no `mongosh` is needed. Reads the
// live database over the MongoDB wire protocol (MongoDB and FerretDB v1/SQLite
// both speak it; the snap runs one at a time on port 27019).
//
// Usage: node wekan-problems.mjs [area] [mongo-url]
//   (default) / status   full overview: in-progress + problems + login checks
//   migrations|repairs   only what is currently in progress
//   login                only the login-page ("Must be logged in") checks
//   broken-cards         only the broken-cards count
//   cpu                  machine CPU load / core count (no DB needed)
//   help                 this usage
//
// This mirrors, in one small self-contained file, the server helpers
// models/lib/loginProblems.js + models/lib/problemsOverview.js and
// server/lib/systemStatus.js. Keep them in sync.

import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// ── Resolve the bundled mongodb driver (see db-eval.mjs for why this dance) ────
const _roots = [];
const _push = (u) => { if (u) { try { _roots.push(new URL(u)); } catch {} } };
if (process.env.SNAP)      _push(pathToFileURL(process.env.SNAP + '/'));
if (process.env.NODE_PATH) _push(pathToFileURL(process.env.NODE_PATH.split(':')[0].replace(/\/programs\/server\/node_modules\/?$/, '') + '/'));
_push(new URL('../', import.meta.url));
const _subPaths = [
  'programs/server/npm/node_modules/meteor/npm-mongo/node_modules/_.cjs',
  'programs/server/npm/node_modules/_.cjs',
  'programs/server/node_modules/_.cjs',
  '_.cjs',
];
const _reqs = [];
for (const r of _roots) for (const sp of _subPaths) { try { _reqs.push(createRequire(new URL(sp, r))); } catch {} }
_reqs.push(createRequire(import.meta.url));

const area = (process.argv[2] || 'status').toLowerCase();
const url = process.argv[3] || process.env.WEKAN_PROBLEMS_URL || 'mongodb://127.0.0.1:27019/wekan';

if (area === 'help' || area === '-h' || area === '--help') {
  console.log('Usage: wekan.problems [status|migrations|login|broken-cards|cpu|help]');
  process.exit(0);
}

// CPU needs no DB.
if (area === 'cpu') {
  const cpus = os.cpus() || [];
  const [l1, l5, l15] = os.loadavg();
  console.log('CPU usage');
  console.log(`  cores:        ${cpus.length}${cpus.length ? ' (' + cpus[0].model.trim() + ')' : ''}`);
  console.log(`  load average: ${l1.toFixed(2)} (1m)  ${l5.toFixed(2)} (5m)  ${l15.toFixed(2)} (15m)`);
  console.log(`  uptime:       ${Math.round(os.uptime())} s`);
  console.log('  Note: sustained load near or above the core count means the machine is saturated.');
  console.log('  A migration/repair (see "wekan.problems") can push CPU up; it drops when it finishes.');
  process.exit(0);
}

let MongoClient;
for (const req of _reqs) {
  try { const m = req('mongodb'); if (m && typeof m.MongoClient === 'function') { MongoClient = m.MongoClient; break; } } catch {}
}
if (typeof MongoClient !== 'function') {
  console.error('wekan-problems: FATAL — could not resolve the mongodb driver from the WeKan bundle.');
  process.exit(1);
}

// ── login-page problem checks (mirrors models/lib/loginProblems.js) ───────────
function loginChecks(inProgressMessages) {
  const active = inProgressMessages.length > 0;
  const rootUrl = (process.env.ROOT_URL || '').trim();
  const ldap = process.env.LDAP_ENABLE === 'true';
  const sandstorm = !!(process.env.SANDSTORM || process.env.SANDSTORM_SMTP_SEND);
  const checks = [];
  checks.push({
    ok: !active, severity: active ? 'warning' : 'ok',
    title: 'Migration or repair',
    detail: active
      ? `Logins may be slow, show "Must be logged in", or sit on a "Loading, please wait" spinner until this finishes and CPU drops. ${inProgressMessages.join('; ')}`
      : 'No migration or repair is currently running.',
  });
  checks.push({
    ok: !!rootUrl, severity: rootUrl ? 'ok' : 'error',
    title: 'ROOT_URL',
    detail: rootUrl
      ? `ROOT_URL=${rootUrl} — must match the exact URL users open, or DDP login never completes.`
      : 'ROOT_URL is not set. Set it to the exact URL users open, or DDP login never completes.',
  });
  if (ldap) checks.push({ ok: true, severity: 'info', title: 'LDAP is enabled', detail: 'If logins are slow/failing, check for leaked LDAP connections exhausting the directory server limit.' });
  if (sandstorm) checks.push({ ok: true, severity: 'info', title: 'Running under Sandstorm', detail: 'A wrong base path/ROOT_URL strands users on a "Must be logged in" page.' });
  return checks;
}

function describeTextMigration(tm) {
  let where = '';
  if (tm.phase === 'migrating') where = `: ${tm.collection || ''} (${tm.collectionsDone || 0}/${tm.collectionsTotal || 0} collections)`;
  else if (tm.phase === 'repairing') where = `: repairing ${tm.boardsDone || 0}/${tm.boardsTotal || 0} boards`;
  return `Database migration (${tm.direction || '?'}) — ${tm.phase || 'running'}${where}`;
}

const client = new MongoClient(url, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
let code = 0;
try {
  await client.connect();
  const db = client.db('wekan');

  // What is in progress.
  const inProgress = [];
  const tms = db.collection('text_migration_status');
  const tm = await tms.findOne({ _id: 'text-migration' });
  if (tm && tm.running) inProgress.push(describeTextMigration(tm));
  const br = await tms.findOne({ _id: 'board-repair' });
  if (br && br.running) inProgress.push(`Board data-repair — ${br.boardsDone || 0}/${br.boardsTotal || 0} boards`);
  try { const rec = await db.collection('recoveryStatus').findOne({}); if (rec && rec.active) inProgress.push(rec.message || 'Data recovery / maintenance in progress'); } catch {}
  try { const jobs = await db.collection('cronJobStatus').find({ status: 'running' }).toArray(); for (const j of jobs) inProgress.push(`Migration job ${j.jobId || j.jobType || j._id} running`); } catch {}
  try { const att = await db.collection('attachmentMigrationStatus').findOne({ $or: [{ running: true }, { status: 'running' }] }); if (att) inProgress.push(att.message || 'Attachment migration / repair in progress'); } catch {}

  // Broken cards.
  let broken = 0;
  try {
    broken = await db.collection('cards').countDocuments({
      $or: [{ boardId: { $in: [null, ''] } }, { swimlaneId: { $in: [null, ''] } }, { listId: { $in: [null, ''] } }],
    });
  } catch {}

  // Product name for the heading.
  let product = 'WeKan';
  try { const s = await db.collection('settings').findOne({ productName: { $type: 'string' } }); if (s && s.productName && s.productName.trim()) product = s.productName.trim(); } catch {}

  const login = loginChecks(inProgress);

  const printInProgress = () => {
    console.log('In progress:');
    if (inProgress.length === 0) console.log('  (none) No migrations or repairs are in progress.');
    else inProgress.forEach(m => console.log(`  - ${m}`));
  };
  const printLogin = () => {
    console.log('Login page ("Must be logged in" / "Loading, please wait") checks:');
    login.forEach(c => console.log(`  [${c.severity}] ${c.title} — ${c.detail}`));
  };
  const printProblems = () => {
    console.log('Problems:');
    const probs = [];
    if (broken > 0) probs.push(`[warning] Broken cards: ${broken} card(s) with a missing board/list/swimlane or bad type.`);
    login.filter(c => c.ok === false).forEach(c => probs.push(`[${c.severity}] ${c.title}: ${c.detail}`));
    if (probs.length === 0) console.log('  (none) No problems detected.');
    else probs.forEach(p => console.log(`  - ${p}`));
  };

  if (area === 'migrations' || area === 'repairs') {
    printInProgress();
  } else if (area === 'login') {
    printLogin();
  } else if (area === 'broken-cards') {
    console.log(`Broken cards: ${broken}`);
  } else { // status / overview / default
    console.log(`${product} Problems — Status`);
    console.log(`Database: ${url}`);
    console.log('');
    printInProgress();
    console.log('');
    printProblems();
    console.log('');
    printLogin();
    console.log('');
    console.log('More: wekan.problems cpu | login | migrations | broken-cards');
  }
} catch (e) {
  console.error('wekan-problems: could not read the database:', e && e.message ? e.message : String(e));
  code = 1;
} finally {
  try { await client.close(true); } catch {}
}
process.exit(code);

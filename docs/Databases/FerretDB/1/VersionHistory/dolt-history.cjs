'use strict';

// What a database with version history gives WeKan's undo and redo: Dolt (git for
// data, MySQL protocol) under FerretDB's MySQL handler. WeKan writes through the
// MongoDB protocol as always; every FerretDB write is a Dolt transaction, and with
// dolt_transaction_commit on every transaction is a Dolt commit.
//
//   node docs/Databases/FerretDB/1/VersionHistory/dolt-history.cjs \
//     --uri 'mongodb://127.0.0.1:27022/?directConnection=true' --sql-port 3307 --sql-password rootpw
//
// It prints what it finds; README.md next to it explains the findings. The SQL side
// is asked through the mysql client of the mysql:9 image, so nothing is installed.

const { execFileSync } = require('child_process');
const { MongoClient } = require('mongodb');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const URI = arg('uri', 'mongodb://127.0.0.1:27022/?directConnection=true');
const PORT = arg('sql-port', '3307');
const PASSWORD = arg('sql-password', 'rootpw');
const DB = 'wekanhistory';
const TIMING_ONLY = process.argv.includes('--timing');

function sql(query, { db = DB, allowError = false } = {}) {
  try {
    return execFileSync('docker', ['run', '--rm', '--network', 'host', 'mysql:9', 'mysql',
      '-h', '127.0.0.1', '-P', PORT, '-u', 'root', `-p${PASSWORD}`, '-B', '-N', '-D', db, '-e', query],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    if (allowError) return `ERROR: ${String(e.stderr || e.message).replace(/mysql: \[Warning\][^\n]*\n/, '').trim()}`;
    throw e;
  }
}
const commits = () => Number(sql('SELECT COUNT(*) FROM dolt_log'));
const head = () => sql("SELECT commit_hash FROM dolt_log LIMIT 1");
const say = (line = '') => console.log(line);
const json = (v) => { try { return JSON.parse(v); } catch { return v; } };

async function main() {
  const client = await new MongoClient(URI).connect();
  const db = client.db(DB);
  await db.dropDatabase().catch(() => {});

  // Setup the way WeKan has it: a board, two lists and some cards.
  const boards = db.collection('boards');
  const lists = db.collection('lists');
  const cards = db.collection('cards');
  await boards.insertOne({ _id: 'b1', title: 'Board', archived: false });
  await lists.insertMany([{ _id: 'l1', boardId: 'b1', title: 'To do' }, { _id: 'l2', boardId: 'b1', title: 'Done' }]);
  await cards.insertMany([
    { _id: 'c1', boardId: 'b1', listId: 'l1', title: 'Write docs', sort: 1, archived: false },
    { _id: 'c2', boardId: 'b1', listId: 'l1', title: 'Fix bug', sort: 2, archived: false },
  ]);

  const table = sql(`SELECT table_name FROM information_schema.tables WHERE table_schema='${DB}' AND table_name LIKE 'cards%' LIMIT 1`);

  if (TIMING_ONLY) {
    const N = 200;
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < N; i += 1) await cards.updateOne({ _id: 'c1' }, { $set: { title: `Edit ${i}` } });
    const ms = Number(process.hrtime.bigint() - t0) / 1e6 / N;
    say(`updateOne: ${ms.toFixed(2)} ms per call, ${commits()} commits, dolt_transaction_commit=${sql('SELECT @@dolt_transaction_commit', { db: 'information_schema' })}`);
    await client.close();
    return;
  }

  say('# 1. A Dolt commit per FerretDB write');
  const ops = [
    ['edit title',          () => cards.updateOne({ _id: 'c1' }, { $set: { title: 'Write docs v2' } })],
    ['move to Done',        () => cards.updateOne({ _id: 'c1' }, { $set: { listId: 'l2', sort: 5 } })],
    ['archive (soft delete)', () => cards.updateOne({ _id: 'c1' }, { $set: { archived: true } })],
    ['hard delete c2',      () => cards.deleteOne({ _id: 'c2' })],
  ];
  const hashes = {};
  for (const [name, run] of ops) {
    const before = commits();
    await run();
    hashes[name] = head();
    say(`${name.padEnd(24)} commits +${commits() - before}   ${hashes[name].slice(0, 10)}`);
  }
  say(sql("SELECT CONCAT(committer, ' | ', date, ' | ', message) FROM dolt_log LIMIT 4"));

  say('\n# 2. Who changed what: dolt_diff of the cards table, as WeKan\'s History table would show it');
  const diff = sql(`SELECT diff_type, to_commit, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(from__ferretdb_sjson, '$.title')), ''), COALESCE(JSON_UNQUOTE(JSON_EXTRACT(to__ferretdb_sjson, '$.title')), ''), ` +
    `COALESCE(JSON_UNQUOTE(JSON_EXTRACT(from__ferretdb_sjson, '$.listId')), ''), COALESCE(JSON_UNQUOTE(JSON_EXTRACT(to__ferretdb_sjson, '$.listId')), '') ` +
    `FROM dolt_diff_${table} ORDER BY to_commit_date, to_commit`, { allowError: true });
  say('diff_type | commit | title from -> to | list from -> to');
  say(diff.split('\n').map((l) => { const c = l.split('\t'); return `${c[0]} | ${String(c[1]).slice(0, 8)} | ${c[2]} -> ${c[3]} | ${c[4]} -> ${c[5]}`; }).join('\n'));

  say('\n# 3. Undo the last change (WeKan: Ctrl+Z) = DOLT_REVERT of HEAD, then redo = revert the revert');
  const exists = async (id) => !!(await cards.findOne({ _id: id }));
  say(`c2 exists before undo: ${await exists('c2')}`);
  say(sql("CALL DOLT_REVERT('HEAD')", { allowError: true }));
  say(`c2 exists after undo:  ${await exists('c2')}   (read through FerretDB, the MongoDB protocol)`);
  say(sql("CALL DOLT_REVERT('HEAD')", { allowError: true }));
  say(`c2 exists after redo:  ${await exists('c2')}`);
  say(`commits now: ${commits()} - an undo and a redo are commits of their own, the history is never rewritten`);

  say('\n# 4. Restore ONE older change while later ones stay (WeKan: Restore of a selected History row)');
  await cards.insertOne({ _id: 'c3', boardId: 'b1', listId: 'l1', title: 'Other card', sort: 3, archived: false });
  await cards.updateOne({ _id: 'c3' }, { $set: { title: 'Other card v2' } });
  const c3edit = head();
  await cards.updateOne({ _id: 'c2x', boardId: 'b1' }, { $set: { title: 'x' } }, { upsert: true });
  say('revert an old edit of c3 after an unrelated later commit (different row):');
  say(sql(`CALL DOLT_REVERT('${c3edit}')`, { allowError: true }));
  say(`c3 title: ${(await cards.findOne({ _id: 'c3' })).title}`);
  say('revert the OLD title edit of c1 while c1 was changed again afterwards (same row, other field):');
  say(sql(`CALL DOLT_REVERT('${hashes['edit title']}')`, { allowError: true }));
  const c1 = await cards.findOne({ _id: 'c1' });
  say(`c1 now: title=${c1.title} listId=${c1.listId} archived=${c1.archived}`);
  say(`left behind by the failed revert: ${sql('SELECT COUNT(*) FROM dolt_conflicts', { allowError: true })} conflict table(s), status: ${sql("SELECT GROUP_CONCAT(CONCAT(table_name, ':', status)) FROM dolt_status", { allowError: true })}`);
  const stuck = await cards.updateOne({ _id: 'c1' }, { $set: { sort: 99 } }).then(() => 'a write still works', (e) => `a write FAILS: ${String(e.message).slice(0, 120)}`);
  say(`FerretDB write while the conflict is open: ${stuck}`);
  say(`clean up with DOLT_RESET('--hard'): ${sql("CALL DOLT_RESET('--hard')", { allowError: true })}`);
  const after = await cards.updateOne({ _id: 'c1' }, { $set: { sort: 100 } }).then(() => 'a write works again', (e) => `a write FAILS: ${String(e.message).slice(0, 120)}`);
  say(`FerretDB write after the reset: ${after}`);

  say('\n# 5. Time travel: the board as it was (AS OF), read with SQL');
  const asOf = sql(`SELECT COUNT(*) FROM ${table} AS OF '${hashes['move to Done']}'`, { allowError: true });
  const nowCount = sql(`SELECT COUNT(*) FROM ${table}`);
  say(`cards at the "move to Done" commit: ${asOf}; now: ${nowCount}`);
  const oldTitle = sql(`SELECT JSON_UNQUOTE(JSON_EXTRACT(_ferretdb_sjson, '$.title')) FROM ${table} AS OF '${hashes['edit title']}' WHERE JSON_UNQUOTE(JSON_EXTRACT(_ferretdb_sjson, '$._id')) = 'c1'`, { allowError: true });
  say(`c1 title as of the "edit title" commit: ${oldTitle}`);

  say('\n# 6. What it costs');
  say(`commits for ${ops.length + 6} FerretDB writes: ${commits()}`);
  say(`size of the data database: ${sql(`SELECT COUNT(*) FROM dolt_log`)} commits; chunks are shared, only changed rows are stored again`);
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });

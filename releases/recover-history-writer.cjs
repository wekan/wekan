#!/usr/bin/env node
'use strict';
const { MongoClient } = require('mongodb');
const { inspectHistoryWriters, retireHistoryWriter } = require('../server/lib/historyWriterGate');
const { migrateHistoryChain } = require('../server/lib/historyChainMigration');
function parse(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!['--board', '--null-board', '--retire', '--migration', '--migrate', '--offline'].includes(key) || Object.hasOwn(options, key)) throw Error('arguments');
    options[key] = ['--null-board', '--offline'].includes(key) ? true : args[++i];
    if (!options[key] || (typeof options[key] === 'string' && options[key].startsWith('--'))) throw Error('arguments');
  }
  if (Boolean(options['--board']) === Boolean(options['--null-board']) ||
      ((options['--retire'] || options['--migrate']) && !options['--offline']) ||
      (options['--migrate'] && (options['--retire'] || options['--migration'])) ||
      (options['--migration'] && !options['--retire'])) throw Error('arguments');
  return { boardId: options['--board'] || null, writerId: options['--retire'],
    migrate: !!options['--migrate'], migrationId: options['--migrate'] || options['--migration'] || null, offline: !!options['--offline'] };
}
async function main() {
  if (process.argv.includes('--help')) {
    console.log('Usage: MONGO_URL=<database URI> node releases/recover-history-writer.cjs (--board <id> | --null-board) [--retire <writer UUID> --offline [--migration <migration UUID>] | --migrate <migration UUID> --offline]');
    console.log('Default: read-only admission inspection. --offline confirms every application, recovery and database writer is stopped and stays stopped until completion.');
    console.log('Retires only the exact uncertain admission token; does not replay missing History or repair chains. Draining gates require their existing migration UUID.');
    console.log('--migrate validates existing History and permanently switches this board to coordinated appends. Reuse the same migration UUID after interruption; restart only upgraded writers.');
    return;
  }
  const options = parse(process.argv.slice(2));
  const uri = process.env.MONGO_URL;
  if (!uri || !new URL(uri).pathname || new URL(uri).pathname === '/') throw Error('database required');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const storage = { ...options, gates: client.db().collection('historyWriterGates') };
    const assertOffline = async () => { if (!options.offline) throw Error('offline required'); };
    const result = options.migrate ? await migrateHistoryChain({ ...storage,
      heads: client.db().collection('historyChainHeads'), history: client.db().collection('changeHistory'),
      assertDeploymentExclusive: assertOffline }) : options.writerId
      ? await retireHistoryWriter({ ...storage, assertOffline }) : await inspectHistoryWriters(storage);
    console.log(JSON.stringify(result));
  } finally { await client.close(); }
}
if (require.main === module) main().catch(() => {
  console.error('History writer recovery failed. Check arguments, named database and stored gate state; keep writers stopped and inspect before retrying.');
  process.exitCode = 1;
});
module.exports = { parse };

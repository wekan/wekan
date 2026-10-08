#!/usr/bin/env node
'use strict';
// Offline resolution of a Scrum History undo or redo that stopped on a
// conflict (server/lib/scrumHistoryRecovery.js), for when WeKan cannot start
// or every writer has to be stopped first. Online, a board administrator does
// the same from the Scrum History notice on the board.
// docs/Features/Right-Sidebar/Board-Settings/Board-View/Scrum-History-Recovery.md
const { MongoClient } = require('mongodb');
const { inspectScrumHistoryCheckpoint, resolveScrumHistoryCheckpoint, describeResolution,
  ScrumHistoryRecoveryError } = require('../server/lib/scrumHistoryRecovery');

const USAGE = 'Usage: MONGO_URL=<database URI> node releases/recover-scrum-history.cjs --board <id> ' +
  '[--rollback | --discard] [--checkpoint <key> --apply --offline]';

function parse(args) {
  const options = { apply: false, offline: false, action: null };
  const value = index => {
    if (!args[index] || args[index].startsWith('--')) throw new ScrumHistoryRecoveryError('A command option is missing its value.');
    return args[index];
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--board' && !options.boardId) options.boardId = value(++i);
    else if (args[i] === '--checkpoint' && !options.key) options.key = value(++i);
    else if (args[i] === '--apply' && !options.apply) options.apply = true;
    else if (args[i] === '--offline' && !options.offline) options.offline = true;
    else if ((args[i] === '--rollback' || args[i] === '--discard') && !options.action) options.action = args[i].slice(2);
    else throw new ScrumHistoryRecoveryError('Unknown or repeated command argument.');
  }
  if (!options.boardId || options.boardId.length > 200) throw new ScrumHistoryRecoveryError('Specify one board.');
  if (options.apply && (!options.action || !options.key)) {
    throw new ScrumHistoryRecoveryError('Applying needs --rollback or --discard and the --checkpoint key the inspection reported.');
  }
  if (options.apply && !options.offline) throw new ScrumHistoryRecoveryError('Applying requires --offline after stopping every writer.');
  if (!options.apply && (options.key || options.offline)) throw new ScrumHistoryRecoveryError('--checkpoint and --offline only go with --apply.');
  return options;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log(USAGE);
    console.log('Default: read-only inspection of the board\'s Scrum History checkpoint, without record contents.');
    console.log('--rollback restores every record the undo or redo wrote to its value before it;');
    console.log('--discard removes the checkpoint and leaves every record as it is.');
    console.log('--offline confirms ALL WeKan and other database writers have stopped.');
    return;
  }
  const options = parse(args);
  if (!process.env.MONGO_URL) throw new ScrumHistoryRecoveryError('MONGO_URL must name the WeKan database.');
  const url = new URL(process.env.MONGO_URL);
  if (!url.pathname || url.pathname === '/') throw new ScrumHistoryRecoveryError('MONGO_URL must explicitly name the WeKan database.');
  const client = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    if (!options.apply) {
      console.log(JSON.stringify(await inspectScrumHistoryCheckpoint(db, options.boardId)));
      return;
    }
    const result = await resolveScrumHistoryCheckpoint(db, options.boardId,
      { action: options.action, key: options.key, offline: true });
    if (result.changed) {
      // Admin Panel -> Problems -> Recovery, as the online resolution records it.
      // Best effort: the resolution is done and the line below reports it.
      await db.collection('recoveryEvents').insertOne({ type: 'scrum-history-checkpoint-resolved',
        detail: describeResolution(result, 'The offline command releases/recover-scrum-history.cjs'),
        severity: 'warning', source: 'offline-tool', done: true, deletedData: result.removedRecords > 0,
        boardIds: [options.boardId], ...(result.boardTitle ? { boardTitles: [String(result.boardTitle)] } : {}),
        createdAt: new Date() }).catch(() => {});
    }
    console.log(JSON.stringify(result));
  } finally { await client.close(); }
}
if (require.main === module) main().catch(error => {
  // Driver errors can contain connection credentials or document contents.
  console.error(error instanceof ScrumHistoryRecoveryError ? error.message
    : 'Scrum History recovery failed; the checkpoint was retained.');
  process.exitCode = 1;
});
module.exports = { parse };

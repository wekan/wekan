#!/usr/bin/env node
'use strict';
const { MongoClient } = require('mongodb');
const { recoverImport, clearRecoveryClaim, ScrumRecoveryError } = require('../server/lib/scrumImportRecovery');

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: MONGO_URL=<database URI> node releases/recover-scrum-import.cjs --board <id> [--rollback] [--apply --offline | --clear-claim <token> --offline]');
    console.log('Default: read-only inspection. --offline confirms ALL WeKan, recovery and other database writers have stopped.');
    console.log('Recovers the Scrum segment only; other native board-import stages are not replayed.');
    console.log('--rollback inspects undo instead of resume; add --apply --offline to undo stored Scrum writes.');
    return;
  }
  let boardId, claimToken, apply = false, offline = false, rollback = false;
  const value = index => {
    if (!args[index] || args[index].startsWith('--')) throw new ScrumRecoveryError('A command option is missing its value.');
    return args[index];
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--board' && !boardId) boardId = value(++i);
    else if (args[i] === '--clear-claim' && !claimToken) claimToken = value(++i);
    else if (args[i] === '--apply' && !apply) apply = true;
    else if (args[i] === '--offline' && !offline) offline = true;
    else if (args[i] === '--rollback' && !rollback) rollback = true;
    else throw new ScrumRecoveryError('Unknown or repeated command argument.');
  }
  if (!boardId || boardId.startsWith('--') || boardId.length > 200 || ((apply || rollback) && claimToken) ||
      (claimToken && claimToken.startsWith('--'))) throw new ScrumRecoveryError('Specify one board and one recovery action.');
  if ((apply || claimToken) && !offline) throw new ScrumRecoveryError('Mutating recovery requires --offline after stopping every writer.');
  if (!process.env.MONGO_URL) throw new ScrumRecoveryError('MONGO_URL must name the destination database.');
  const url = new URL(process.env.MONGO_URL);
  if (!url.pathname || url.pathname === '/') throw new ScrumRecoveryError('MONGO_URL must explicitly name the destination database.');
  const client = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const result = claimToken ? await clearRecoveryClaim(client.db(), boardId, claimToken, { offline })
      : await recoverImport(client.db(), boardId, { apply, offline, rollback });
    console.log(JSON.stringify(result));
  } finally { await client.close(); }
}
if (require.main === module) main().catch(error => {
  // Driver errors can contain connection credentials or document contents.
  console.error(error instanceof ScrumRecoveryError ? error.message : 'Scrum import recovery failed; the checkpoint and any acquired recovery claim are retained.');
  process.exitCode = 1;
});

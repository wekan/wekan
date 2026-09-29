#!/usr/bin/env node
'use strict';
const { MongoClient } = require('mongodb');
const { confirmAcceptedRuleEmail } = require('../server/lib/syncRuleEmailRecovery');
function parse(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (!['--command', '--attempt', '--operator', '--evidence', '--offline', '--confirm-accepted'].includes(key) || Object.hasOwn(options, key)) throw Error('arguments');
    options[key] = ['--offline', '--confirm-accepted'].includes(key) ? true : args[++i];
    if (!options[key] || (typeof options[key] === 'string' && options[key].startsWith('--'))) throw Error('arguments');
  }
  if (Object.keys(options).length !== 6 || !options['--offline'] || !options['--confirm-accepted']) throw Error('arguments');
  return { commandId: options['--command'], attemptId: options['--attempt'], operator: options['--operator'], evidence: options['--evidence'] };
}
async function main() {
  if (process.argv.includes('--help')) {
    console.log('Usage: MONGO_URL=<named database URI> node releases/recover-rule-email.cjs --command <hash> --attempt <UUID> --operator <name> --evidence <log reference> --offline --confirm-accepted');
    console.log('Stop ALL application, SMTP and recovery workers first and keep them stopped. Independently verify SMTP acceptance of ALL recipients. For partial or unknown acceptance use Admin Panel -> Problems -> Recovery, which can resend to unconfirmed recipients only, mark sent or drop.');
    console.log('Records an immutable operator decision and reconciles the exact receipt. Never sends, resets or edits mail. Reuse identical arguments after interruption. Evidence must be an opaque reference, not addresses, credentials or mail text.');
    return;
  }
  const options = parse(process.argv.slice(2));
  const uri = process.env.MONGO_URL;
  if (!uri || !new URL(uri).pathname || new URL(uri).pathname === '/') throw Error('database required');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db();
    const result = await confirmAcceptedRuleEmail({ ...options,
      attempts: db.collection('listSyncRuleEmailAttempts'), commands: db.collection('listSyncRuleEmailCommands'),
      resolutions: db.collection('listSyncRuleEmailResolutions'), assertOffline: async () => {} });
    console.log(JSON.stringify(result));
  } finally { await client.close(); }
}
if (require.main === module) main().catch(() => {
  console.error('Rule email recovery failed. Keep all writers stopped; check arguments, named database and exact stored attempt/decision before retrying.');
  process.exitCode = 1;
});
module.exports = { parse };

#!/usr/bin/env node
// Live test: the Microsoft To Do import against Microsoft Graph. Read-only:
// it lists the signed-in account's To Do lists, fetches all of them the way
// the import page does (models/lib/apiImport/mstodo.js) and reads the result
// with WeKan's parser (models/lib/mstodoApiFormat.js). Nothing is written to
// Microsoft. Human-run, from build.sh / build.bat → Tests → Live tests, or
// directly:
//
//   WEKAN_LIVE_MSTODO_TOKEN=... node releases/live-tests/mstodo-import.mjs
//
//   WEKAN_LIVE_MSTODO_TOKEN   a Microsoft Graph access token with Tasks.Read
//                             (Graph Explorer → sign in → Access token)
//
// Exit 0: passed, 1: failed, 2: skipped (no token).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// As the contract in models/lib/apiImportServices.js: parsed JSON, or an
// Error with .status. No redirects: the token stays with Graph.
async function request(url, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(url, { method, headers, body, redirect: 'error', signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`${method} ${new URL(url).pathname}: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : null;
}

export default async function run({ log = console.log } = {}) {
  const token = process.env.WEKAN_LIVE_MSTODO_TOKEN;
  if (!token) {
    log('SKIP mstodo-import: no WEKAN_LIVE_MSTODO_TOKEN (a Microsoft Graph token with Tasks.Read)');
    return 'skipped';
  }
  const client = await import(pathToFileURL(path.join(ROOT, 'models/lib/apiImport/mstodo.js')).href);
  const { parseMicrosoftTodoApi } = await import(pathToFileURL(path.join(ROOT, 'models/lib/mstodoApiFormat.js')).href);
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };

  log('mstodo-import: https://graph.microsoft.com/v1.0/me/todo');
  const lists = await client.list({ token }, request);
  check(lists[0] && lists[0].id === 'all', 'the listing offers all lists first');
  check(lists.length > 1, `the account has To Do lists (${lists.length - 1})`);
  const data = await client.fetch({ token }, 'all', request);
  check(data.mstodo === true && data.lists.length === lists.length - 1, 'every list is fetched');
  const board = parseMicrosoftTodoApi(data);
  check(board.columns.length === data.lists.length && board.columns.every(column => column.title),
    `each list is a WeKan list (${board.columns.map(column => column.title).join(', ')})`);
  const total = data.lists.reduce((sum, list) => sum + list.tasks.length, 0);
  check(board.tasks.length === total, `every task is a card (${total})`);
  check(board.tasks.every(task => board.columns.some(column => column.title === task.column_name)), 'every card is in a list that exists');
  log('PASS mstodo-import');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}

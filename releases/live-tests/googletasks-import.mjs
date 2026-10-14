#!/usr/bin/env node
// Live test: the Google Tasks API import against Google, read-only. Human-run,
// from build.sh / build.bat → Tests → Live tests, or directly:
//
//   WEKAN_LIVE_GOOGLE_TASKS_TOKEN=ya29... node releases/live-tests/googletasks-import.mjs
//
// WEKAN_LIVE_GOOGLE_TASKS_TOKEN is an OAuth 2 access token with the scope
// https://www.googleapis.com/auth/tasks.readonly, from the OAuth 2.0
// Playground. It lists the task lists, fetches them all with WeKan's client
// (models/lib/apiImport/googletasks.js) and reads them with WeKan's parser
// (models/lib/googletasksApiFormat.js). Nothing is written to Google.
// Exit 0: passed, 1: failed, 2: skipped (no token).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// As the contract in models/lib/apiImportServices.js: parsed JSON, or an
// Error with .status. No redirects, 30 s timeout.
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
  const token = process.env.WEKAN_LIVE_GOOGLE_TASKS_TOKEN;
  if (!token) {
    log('SKIP googletasks-import: no WEKAN_LIVE_GOOGLE_TASKS_TOKEN (an access token with the tasks.readonly scope)');
    return 'skipped';
  }
  const client = await import(pathToFileURL(path.join(ROOT, 'models/lib/apiImport/googletasks.js')).href);
  const { parseGoogleTasksApi } = await import(pathToFileURL(path.join(ROOT, 'models/lib/googletasksApiFormat.js')).href);
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };
  const credentials = { token };

  log('googletasks-import: https://tasks.googleapis.com');
  const choices = await client.list(credentials, request);
  check(choices[0] && choices[0].id === 'all', '"all lists" is offered first');
  check(choices.length >= 2, `the account has task lists (${choices.length - 1})`);
  const data = await client.fetch(credentials, 'all', request);
  check(data.googletasks === true && data.lists.length === choices.length - 1, 'every list is fetched');
  const board = parseGoogleTasksApi(data);
  check(board.columns.length === data.lists.length, 'each task list is a list');
  const topLevel = data.lists.reduce((sum, l) => sum + l.tasks.filter(t => !t.deleted && !(t.parent && l.tasks.some(p => p.id === t.parent && !p.deleted))).length, 0);
  check(board.tasks.length === topLevel, `each top-level task is a card (${board.tasks.length})`);
  const one = await client.fetch(credentials, choices[1].id, request);
  const single = parseGoogleTasksApi(one);
  check(one.lists.length === 1 && single.columns.length === 1 && single.board.name === single.columns[0].title,
    'one list fetches alone and names the board');
  log('PASS googletasks-import');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}

#!/usr/bin/env node
// Live test: the Basecamp import against the real Basecamp API, read-only.
// Human-run, from build.sh / build.bat → Tests → Live tests, or directly:
//
//   node releases/live-tests/basecamp-import.mjs
//
// It lists the account's projects with WeKan's own client
// (models/lib/apiImport/basecamp.js), fetches the first one and reads it with
// WeKan's parser (models/lib/basecampApiFormat.js). Nothing is written.
//
//   WEKAN_LIVE_BASECAMP_ACCOUNT   the account id (the number in the Basecamp address)
//   WEKAN_LIVE_BASECAMP_TOKEN     an OAuth 2 access token for that account
//
// Exit 0: passed, 1: failed, 2: skipped (no account or token here).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// As the import page's request contract: the parsed JSON, or an Error with
// `.status`. No redirects, so the token never follows one elsewhere.
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
  const account = (process.env.WEKAN_LIVE_BASECAMP_ACCOUNT || '').trim();
  const token = process.env.WEKAN_LIVE_BASECAMP_TOKEN || '';
  if (!account || !token) {
    log('SKIP basecamp-import: set WEKAN_LIVE_BASECAMP_ACCOUNT and WEKAN_LIVE_BASECAMP_TOKEN');
    return 'skipped';
  }
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };
  const client = await import(pathToFileURL(path.join(ROOT, 'models/lib/apiImport/basecamp.js')).href);
  const { parseBasecampApi } = await import(pathToFileURL(path.join(ROOT, 'models/lib/basecampApiFormat.js')).href);
  const credentials = { account, token };

  log(`basecamp-import: account ${account}`);
  const projects = await client.list(credentials, request);
  check(Array.isArray(projects) && projects.length > 0, `the account lists projects (${projects.length})`);
  const first = projects[0];
  const data = await client.fetch(credentials, first.id, request);
  check(data.basecamp === true && String(data.project.id) === String(first.id), `project "${first.name}" is fetched`);
  let board;
  try {
    board = parseBasecampApi(data);
  } catch (error) {
    // A project with neither a card table nor to-do lists has nothing to import.
    check(/no card table and no to-do lists/.test(error.message), `an empty project is refused clearly (${error.message})`);
    log('PASS basecamp-import');
    return 'passed';
  }
  check(board.board.name === (String(data.project.name || '').trim() || 'Imported Basecamp project'), 'the board is named after the project');
  check(board.swimlanes.length >= 1, `${board.swimlanes.length} swimlanes, ${board.columns.length} lists, ${board.tasks.length} cards`);
  check(board.tasks.every(task => board.columns.some(column => column.title === task.column_name)), 'every card has its list');
  log('PASS basecamp-import');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}

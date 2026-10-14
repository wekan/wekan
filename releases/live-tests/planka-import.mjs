#!/usr/bin/env node
// Live test: the Planka API importer against a real Planka. Human-run, from
// build.sh / build.bat → Tests → Live tests, or directly:
//
//   node releases/live-tests/planka-import.mjs
//
// It logs in with WeKan's own client (models/lib/apiImport/planka.js), lists
// the boards, fetches the first one with its comments and reads it with
// WeKan's parser (models/lib/plankaApiFormat.js). Read-only: the only writes
// are the login token Planka creates and the logout that deletes it.
//
//   WEKAN_LIVE_PLANKA_URL        the Planka address, e.g. https://planka.example.com
//   WEKAN_LIVE_PLANKA_USERNAME   a username or e-mail address
//   WEKAN_LIVE_PLANKA_PASSWORD   its password
//
// Exit 0: passed, 1: failed, 2: skipped (no Planka login given).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// As server/lib/apiImportRequest.js, without the SSRF guard: JSON in and
// out, no redirects, 30 s. The error names only the origin and the status.
async function request(url, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(url, {
    method, redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Accept: 'application/json', ...headers, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    const error = new Error(`${new URL(url).origin} answered HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export default async function run({ log = console.log } = {}) {
  const url = process.env.WEKAN_LIVE_PLANKA_URL;
  const username = process.env.WEKAN_LIVE_PLANKA_USERNAME;
  const password = process.env.WEKAN_LIVE_PLANKA_PASSWORD;
  if (!url || !username || !password) {
    log('SKIP planka-import: set WEKAN_LIVE_PLANKA_URL, WEKAN_LIVE_PLANKA_USERNAME and WEKAN_LIVE_PLANKA_PASSWORD');
    return 'skipped';
  }
  const client = await import(pathToFileURL(path.join(ROOT, 'models/lib/apiImport/planka.js')).href);
  const { parsePlankaApi } = await import(pathToFileURL(path.join(ROOT, 'models/lib/plankaApiFormat.js')).href);
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };
  const credentials = { url: url.replace(/\/+$/, ''), username, password };

  log(`planka-import: ${new URL(credentials.url).origin}`);
  const boards = await client.list(credentials, request);
  check(Array.isArray(boards) && boards.length > 0, `the account sees ${boards.length} board(s)`);
  check(boards.every(board => board.id && board.name), 'every board has an id and a name');

  const data = await client.fetch(credentials, boards[0].id, request);
  check(data && data.planka && data.planka.item, `"${boards[0].name}" is fetched`);
  const parsed = parsePlankaApi(data);
  check(Boolean(parsed.board.name), `the board is named "${parsed.board.name}"`);
  check(parsed.columns.length > 0, `it has ${parsed.columns.length} list(s)`);
  const comments = parsed.tasks.reduce((sum, task) => sum + (task.comments ? task.comments.length : 0), 0);
  log(`  ${parsed.tasks.length} card(s), ${comments} comment(s), ${parsed.unsupported.length} loss report line(s)`);
  check(!JSON.stringify(data).includes(password), 'the password is nowhere in the fetched data');

  log('PASS planka-import');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}

#!/usr/bin/env node
// Live test: the KanbanFlow API import against kanbanflow.com, READ-ONLY.
// Human-run, from build.sh / build.bat → Tests → Live tests, or directly:
//
//   WEKAN_LIVE_KANBANFLOW_TOKEN=... node releases/live-tests/kanbanflow-import.mjs
//
// WEKAN_LIVE_KANBANFLOW_TOKEN is the API token of one KanbanFlow board (board
// menu → Settings → API & Webhooks). It lists and fetches that board with
// WeKan's own client (models/lib/apiImport/kanbanflow.js), the way the import
// page does, and reads it with WeKan's parser
// (models/lib/kanbanflowApiFormat.js). Only GET requests: nothing is written.
// Exit 0: passed, 1: failed, 2: skipped (no token).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// What the server's request does, with plain fetch: no redirects, 30 s.
async function request(url, { method = 'GET', headers = {}, body } = {}) {
  if (method !== 'GET') throw new Error(`the live test is read-only, refused ${method}`);
  const response = await fetch(url, { method, headers, body, redirect: 'error', signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  if (!response.ok) {
    // The path only: the token is in the header, never in the message.
    const error = new Error(`GET ${new URL(url).pathname}: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : null;
}

export default async function run({ log = console.log } = {}) {
  const token = process.env.WEKAN_LIVE_KANBANFLOW_TOKEN;
  if (!token) {
    log('SKIP kanbanflow-import: no WEKAN_LIVE_KANBANFLOW_TOKEN');
    return 'skipped';
  }
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };
  const client = await import(pathToFileURL(path.join(ROOT, 'models/lib/apiImport/kanbanflow.js')).href);
  const { parseKanbanflowApi } = await import(pathToFileURL(path.join(ROOT, 'models/lib/kanbanflowApiFormat.js')).href);

  const boards = await client.list({ token }, request);
  check(boards.length === 1 && boards[0].id, 'the token lists its one board');
  log(`kanbanflow-import: "${boards[0].name}"`);
  const data = await client.fetch({ token }, boards[0].id, request);
  check(data.kanbanflow === true && Array.isArray(data.tasks), `fetched ${data.tasks.length} tasks`);
  const parsed = parseKanbanflowApi(data);
  check(parsed.columns.length === data.board.columns.length, `${parsed.columns.length} columns, in order`);
  check(parsed.columns.every((c, i) => c.title.startsWith(String(data.board.columns[i].name || 'Untitled').trim())), 'the column titles are the board\'s');
  check(parsed.swimlanes.length >= 1, `${parsed.swimlanes.length} swimlanes`);
  check(parsed.tasks.every(t => parsed.columns.some(c => c.title === t.column_name)), 'every task is in a column');
  check(JSON.stringify(parsed).indexOf(token) === -1, 'the token is not in the imported data');
  if (parsed.unsupported.length) log(`  reported: ${parsed.unsupported.length} losses`);

  // Negative: a wrong token is refused by KanbanFlow, not imported as empty.
  let refused = null;
  try { await client.list({ token: `${token}-not-valid` }, request); } catch (error) { refused = error; }
  check(refused && refused.status >= 400 && refused.status < 500, 'a wrong token is refused');

  log('PASS kanbanflow-import');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}

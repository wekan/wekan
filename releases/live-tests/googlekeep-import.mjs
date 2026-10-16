#!/usr/bin/env node
// Live test: the Google Keep API import against Google, read only. Human-run,
// from build.sh / build.bat → Tests → Live tests, or directly:
//
//   WEKAN_LIVE_GOOGLE_KEEP_TOKEN=ya29... node releases/live-tests/googlekeep-import.mjs
//
// WEKAN_LIVE_GOOGLE_KEEP_TOKEN is an OAuth 2 access token with the scope
// https://www.googleapis.com/auth/keep.readonly, of a Google Workspace account
// (see docs/Features/Board-Sidebar/Board-Settings/Import-Export/Google-Keep/Google-Keep.md). It lists and
// fetches the notes with WeKan's own client (models/lib/apiImport/googlekeep.js)
// and reads them with WeKan's parser. Nothing is written to Google Keep.
// Exit 0: passed, 1: failed, 2: skipped (no token).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// As the contract asks: parsed JSON, an Error with .status on non-2xx.
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
  const token = process.env.WEKAN_LIVE_GOOGLE_KEEP_TOKEN;
  if (!token) {
    log('SKIP googlekeep-import: no WEKAN_LIVE_GOOGLE_KEEP_TOKEN (an access token with keep.readonly)');
    return 'skipped';
  }
  const client = await import(pathToFileURL(path.join(ROOT, 'models/lib/apiImport/googlekeep.js')).href);
  const { parseGoogleKeepApi } = await import(pathToFileURL(path.join(ROOT, 'models/lib/googlekeepApiFormat.js')).href);
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };

  log('googlekeep-import: https://keep.googleapis.com');
  const credentials = { token };
  const sources = await client.list(credentials, request);
  check(sources.length === 1 && sources[0].id === 'all', 'list offers all notes');
  const data = await client.fetch(credentials, sources[0].id, request);
  check(data.googlekeep === true && Array.isArray(data.notes), `fetch returns the notes (${data.notes.length})`);
  const board = parseGoogleKeepApi(data);
  check(board.board.name === 'Google Keep' && board.columns.length >= 1, 'the parser makes a board with lists');
  const live = data.notes.filter(note => note && note.trashed !== true && !note.trashTime).length;
  check(board.tasks.length === live, `every note that is not trashed is a card (${board.tasks.length})`);
  check(board.tasks.every(task => task.title && board.columns.some(column => column.title === task.column_name)),
    'every card has a title and a list');
  check(!JSON.stringify(board).includes(token), 'the token is not in the parsed board');
  log(`  ${board.unsupported.length} item(s) on the loss report`);
  log('PASS googlekeep-import');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}

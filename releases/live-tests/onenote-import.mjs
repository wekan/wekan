#!/usr/bin/env node
// Live test: the Microsoft OneNote import against Microsoft Graph. Read-only: it
// lists what the signed-in account can import, fetches the first item the way
// the import page does (models/lib/apiImport/onenote.js) and reads the result
// with WeKan's parser (models/lib/onenoteApiFormat.js). Nothing is written to
// Microsoft. Human-run, from build.sh / build.bat → Tests → Live tests, or
// directly:
//
//   WEKAN_LIVE_ONENOTE_TOKEN=... node releases/live-tests/onenote-import.mjs
//
//   WEKAN_LIVE_ONENOTE_TOKEN   a Microsoft Graph access token with Notes.Read
//                           (Graph Explorer → sign in → Access token)
//
// Exit 0: passed, 1: failed, 2: skipped (no token).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// As the contract in models/lib/apiImportServices.js: parsed JSON (the text
// itself when a text type was asked for), or an Error with .status. No
// redirects: the token stays with Graph.
async function request(url, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(url, { method, headers, body, redirect: 'error', signal: AbortSignal.timeout(30000) });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`${method} ${new URL(url).pathname}: HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (/^text\//i.test(String(headers.Accept || ''))) return text;
  return text ? JSON.parse(text) : null;
}

export default async function run({ log = console.log } = {}) {
  const token = process.env.WEKAN_LIVE_ONENOTE_TOKEN;
  if (!token) {
    log('SKIP onenote-import: no WEKAN_LIVE_ONENOTE_TOKEN (a Microsoft Graph token with Notes.Read)');
    return 'skipped';
  }
  const client = await import(pathToFileURL(path.join(ROOT, 'models/lib/apiImport/onenote.js')).href);
  const { parseOnenoteApi } = await import(pathToFileURL(path.join(ROOT, 'models/lib/onenoteApiFormat.js')).href);
  const check = (ok, what) => {
    if (!ok) throw new Error(`FAILED: ${what}`);
    log(`  ok - ${what}`);
  };

  log('onenote-import: https://graph.microsoft.com/v1.0');
  const items = await client.list({ token }, request);
  check(items.length > 0, `the account has something to import (${items.length})`);
  const data = await client.fetch({ token }, items[0].id, request);
  const board = parseOnenoteApi(data);
  check(board.columns.length > 0 && board.tasks.length > 0, `"${items[0].name}" reads as a board (${board.tasks.length} cards)`);
  check(board.tasks.every(task => board.columns.some(column => column.title === task.column_name)), 'every card is in a list that exists');
  log('PASS onenote-import');
  return 'passed';
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  run().then(result => process.exit(result === 'skipped' ? 2 : 0), error => { console.error(error.message || error); process.exit(1); });
}

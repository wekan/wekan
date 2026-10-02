'use strict';

// Guard: RelayBleed. The live Trello import downloads attachments, the board
// background and member avatars server-side, and sent the importing user's
// Trello API key and token (`Authorization: OAuth oauth_consumer_key=...,
// oauth_token=...`) with every download - to whatever URL the board held. A
// link attachment is a URL anyone who can edit the board chooses, and one
// renamed to look like a file ("Spec.pdf" -> https://attacker.example/x) was
// downloaded like an uploaded one, handing the importer's token to that host.
// Run: node tests/relayBleed.test.cjs
//
// The test runs the real server/lib/trelloApiImport.js with the network
// stubbed and records which hosts received the credential. The negative test
// pins the shape: the credential header is built in one place, behind the
// Trello-host check, and nothing else in the server builds an OAuth header.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const KEY = 'victim-key', TOKEN = 'victim-token';

function harness({ respond = () => ({ ok: true, status: 200 }) } = {}) {
  const requests = [];
  const ok = (url, options) => {
    requests.push({ url, auth: (options && options.headers && options.headers.Authorization) || null });
    const r = respond(url, options);
    return { headers: new Headers({ 'content-type': 'image/png' }), arrayBuffer: async () => new ArrayBuffer(4), ...r };
  };
  const context = {
    URL, Buffer, Headers, console, process: { env: {}, pid: 1 }, Map, Set, Promise, Date, Math, JSON, AbortSignal,
    setTimeout, clearTimeout,
    Meteor: { methods() {}, startup() {}, setTimeout: (fn, ms) => setTimeout(fn, 0), Error: class extends Error {} },
    Mongo: { Collection: class {} }, EJSON: {}, Random: { id: () => 'x' }, ReactiveCache: {}, TrelloCreator: class {},
    Users: { findOneAsync: async () => ({ profile: {} }), updateAsync: async () => 1 }, Boards: {}, Activities: {},
    Avatars: { writeAsync: async () => ({ _id: 'a' }) }, TrelloImportJobs: {}, generateUniversalAvatarUrl: () => '/a',
    validateAttachmentUrl: async () => ({ valid: true }),
    fetchSafe: async (url, options) => ok(url, options),
    fetch: async (url, options) => ok(url, options),
    require: name => {
      if (name === '/models/lib/importExportSecurity') return { getImportExportSecuritySettings: async () => ({}) };
      if (name === '/server/lib/securityLog') return { record() {} };
      return {};
    },
  };
  vm.createContext(context);
  const src = read('server/trelloApiImport.js').replace(/^import [^\n]*\n/gm, '').replace(/^export /gm, '');
  vm.runInContext(src, context);
  return { context, requests };
}
const credentialHosts = requests => requests.filter(r => r.auth).map(r => new URL(r.url).host);

test('the reporter-style attack: a renamed link attachment no longer receives the importer\'s token', async () => {
  const { context, requests } = harness();
  const board = { cards: [{ attachments: [
    // An uploaded file, on Trello: it needs the credential.
    { id: 'u', name: 'photo.png', url: 'https://trello.com/1/cards/c/attachments/u/download/photo.png' },
    // A link renamed to look like a file, on somebody else's host.
    { id: 'l', name: 'Spec.pdf', url: 'https://attacker.example/collect' },
    // Lookalikes of Trello must not pass either.
    { id: 'p', name: 'a.png', url: 'https://trello.com.attacker.example/x' },
    { id: 'h', name: 'b.png', url: 'http://trello.com/1/cards/c/attachments/h/download/b.png' },
    { id: 'o', name: 'c.png', url: 'https://trello.com:8443/x' },
    { id: 's', name: 'd.png', url: 'https://evil.trello.com.example/x' },
  ] }] };
  await context.inlineAttachments(board, KEY, TOKEN);
  assert.equal(requests.length, 6, 'every attachment is still downloaded');
  assert.deepEqual(credentialHosts(requests), ['trello.com']);
  for (const r of requests.filter(r => !r.auth)) assert.doesNotMatch(JSON.stringify(r), /victim-token/);
  const sent = requests.find(r => r.auth);
  assert.equal(sent.auth, 'OAuth oauth_consumer_key="victim-key", oauth_token="victim-token"');
});

test('the background and avatar credential retries go only to Trello', async () => {
  // A public download fails, so the old code retried WITH the credential.
  for (const [url, expected] of [['https://images.example/bg.jpg', []], ['https://trello.com/b/bg.jpg', ['trello.com']]]) {
    const { context, requests } = harness({ respond: (u, o) => ({ ok: !!(o && o.headers && o.headers.Authorization), status: 403 }) });
    await context.inlineBoardBackground({ prefs: { backgroundImage: url } }, KEY, TOKEN);
    assert.deepEqual(credentialHosts(requests), expected, url);
  }
  for (const [url, expected] of [['https://avatars.example/a.png', []], ['https://api.trello.com/1/members/m/avatar.png', ['api.trello.com']]]) {
    const { context, requests } = harness({ respond: () => ({ ok: false, status: 403 }) });
    await context.inlineMemberAvatars({ members: [{ id: 'm', avatarUrl: url }] }, { m: 'wekan-user' }, KEY, TOKEN);
    assert.deepEqual(credentialHosts(requests), expected, url);
  }
});

test('isTrelloCredentialHost accepts only Trello\'s own HTTPS hosts', () => {
  const { context } = harness();
  for (const url of ['https://trello.com/x', 'https://api.trello.com/1/x', 'https://TRELLO.com/x']) {
    assert.equal(context.isTrelloCredentialHost(url), true, url);
  }
  for (const url of ['http://trello.com/x', 'https://trello.com:444/x', 'https://u:p@trello.com/x', 'https://trello.com.evil/x',
    'https://eviltrello.com/x', 'https://x.trello.com.evil/x', 'not a url', '', 'https://trello-attachments.s3.amazonaws.com/x']) {
    assert.equal(context.isTrelloCredentialHost(url), false, url);
  }
});

// Server-side app sources, never generated bundles.
function sourceFiles() {
  const out = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'tests' || entry.name.startsWith('_build') || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(c|m)?js$/.test(entry.name)) out.push(full);
    }
  };
  for (const dir of ['server', 'models', 'imports']) walk(path.join(ROOT, dir));
  return out;
}

test('the credential header is built in one place, behind the host check (negative)', () => {
  const src = read('server/trelloApiImport.js');
  const uses = src.match(/authHeader\(/g) || [];
  assert.equal(uses.length, 2, 'the definition and its one caller');
  assert.match(src, /return isTrelloCredentialHost\(url\) \? \{ Authorization: authHeader\(key, token\) \} : \{\};/);
  assert.doesNotMatch(src, /headers: \{ Authorization: authHeader/);
  // Nowhere else in the server builds an OAuth credential header for an outbound request.
  const others = sourceFiles().filter(file => !file.endsWith(path.join('server', 'trelloApiImport.js')))
    .filter(file => /oauth_token="\$\{/.test(fs.readFileSync(file, 'utf8')))
    .map(file => path.relative(ROOT, file));
  assert.deepEqual(others, []);
});

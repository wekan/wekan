// Outbound HTTP from a Sandstorm grain through the Powerbox: the Trello
// import and export reach api.trello.com the way the Sandstorm WordPress app
// reaches wordpress.org. imports/sandstorm/egress.mjs is run against a fake
// sandstorm-http-bridge proxy; the descriptor the client embeds is rebuilt
// with the real Cap'n Proto schemas.
//
// Run: node --test tests/sandstormApiEgress.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const egress = await import(path.join(ROOT, 'imports/sandstorm/egress.mjs'));
const bridge = await import(path.join(ROOT, 'imports/sandstorm/bridgeClient.mjs'));

// A stand-in for the bridge's proxy: records each request, answers per route.
async function fakeProxy(handler) {
  const seen = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const entry = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks) };
      seen.push(entry);
      handler(entry, res);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const env = { HTTP_PROXY: `http://127.0.0.1:${server.address().port}` };
  return { seen, env, close: () => new Promise(resolve => server.close(resolve)) };
}

const grant = { cap: 'CAPTOKEN', canonicalUrl: 'https://api.trello.com/1' };

test('the descriptor the client embeds asks for exactly the Trello API', () => {
  // Every service the server knows has its descriptor in the client, built
  // from the same canonicalUrl.
  for (const [service, { canonicalUrl }] of Object.entries(egress.EXTERNAL_APIS)) {
    const embedded = new RegExp(`\\b${service}: '([^']+)'`).exec(read('sandstorm.js'));
    assert.ok(embedded, `sandstorm.js embeds a ${service} descriptor`);
    assert.equal(embedded[1], bridge.apiSessionDescriptor(canonicalUrl), service);
  }
  const embedded = /trello: '([^']+)'/.exec(read('sandstorm.js'));
  const parsed = bridge.parseApiSessionDescriptor(embedded[1]);
  assert.equal(parsed.canonicalUrl, 'https://api.trello.com/1');
  assert.equal(parsed.tagId, 0xc879e379c625cdc7n, 'the tag is ApiSession');
  // The generator reproduces the Sandstorm documentation's own example.
  assert.equal(bridge.apiSessionDescriptor('https://apidata.googleusercontent.com/caldav/v2'),
    'EA9QAQEAABEBF1EEAQH_x80lxnnjecgAQAMxCYIBAAH_aHR0cHM6Ly8FYXBpZGF0YS5nb29nbGV1c2VyY29udGVudC5jb20vY2FsZGF2L3YyAA==');
  assert.throws(() => bridge.apiSessionDescriptor('https://api.trello.com/1/'), /trailing slash/);
});

test('only URLs under a granted API belong to it (negative)', () => {
  assert.equal(egress.serviceForUrl('https://api.trello.com/1'), 'trello');
  assert.equal(egress.serviceForUrl('https://api.trello.com/1/boards/x?key=k'), 'trello');
  assert.equal(egress.serviceForUrl('https://api.trello.com/1?x=1'), 'trello');
  for (const url of ['https://api.trello.com/1evil.example', 'https://api.trello.com/2/boards',
    'http://api.trello.com/1/boards', 'https://trello.com/1/cards/c/attachments/a/download/f',
    'https://api.trello.com.evil.example/1/x', 'https://attacker.example/']) {
    assert.equal(egress.serviceForUrl(url), null, url);
  }
  assert.equal(egress.externalApi('constructor'), null, 'no prototype names');
  assert.equal(egress.proxyTarget(grant.canonicalUrl, 'https://api.trello.com/1/boards/x?key=k'),
    'http://api.trello.com/boards/x?key=k');
  assert.equal(egress.proxyTarget(grant.canonicalUrl, 'https://api.trello.com/1?a=b'), 'http://api.trello.com/?a=b');
  assert.equal(egress.isSessionId('abc_DEF-123'), true);
  for (const bad of ['../x', 'a/b', 'a?b', '', 'x'.repeat(129), 7]) assert.equal(egress.isSessionId(bad), false, String(bad));
});

test('a request goes to the bridge proxy with the grant as Bearer, the path and query kept', async () => {
  const proxy = await fakeProxy((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ id: 'b1', name: 'Board' }));
  });
  try {
    const res = await egress.proxyFetch('https://api.trello.com/1/boards/b1?key=K&token=T',
      { grant, headers: { Authorization: 'OAuth caller', Accept: 'application/json' } }, { env: proxy.env });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { id: 'b1', name: 'Board' });
    const [req] = proxy.seen;
    assert.equal(req.url, 'http://api.trello.com/boards/b1?key=K&token=T', 'absolute-form target, path after canonicalUrl');
    assert.equal(req.headers.authorization, 'Bearer CAPTOKEN', "the caller's Authorization never replaces the grant");
    assert.equal(req.headers.accept, 'application/json');
  } finally { await proxy.close(); }
});

test('an upload is sent as multipart, and a stream request hands back a Node stream', async () => {
  const proxy = await fakeProxy((req, res) => { res.writeHead(200); res.end('{"id":"a1"}'); });
  try {
    const form = new FormData();
    form.append('file', new Blob([Buffer.from('hello')], { type: 'text/plain' }), 'hello.txt');
    form.append('name', 'hello.txt');
    const res = await egress.proxyFetch('https://api.trello.com/1/cards/c1/attachments?key=K&token=T',
      { grant, method: 'POST', body: form }, { env: proxy.env });
    assert.equal(res.status, 200);
    const [req] = proxy.seen;
    assert.equal(req.method, 'POST');
    assert.match(req.headers['content-type'], /^multipart\/form-data; boundary=/);
    assert.match(req.body.toString(), /filename="hello\.txt"[\s\S]*hello/);
    const streamed = await egress.proxyFetch('https://api.trello.com/1/boards/b1?key=K&token=T',
      { grant, stream: true }, { env: proxy.env });
    assert.equal(streamed.ok, true);
    assert.equal(typeof streamed.body.pipe, 'function');
    streamed.body.resume();
  } finally { await proxy.close(); }
});

test('a request outside its grant, or without one, is refused before it is sent (negative)', async () => {
  const proxy = await fakeProxy((req, res) => { res.writeHead(200); res.end('{}'); });
  try {
    await assert.rejects(egress.proxyFetch('https://attacker.example/x', { grant }, { env: proxy.env }), /not-granted/);
    await assert.rejects(egress.proxyFetch('https://api.trello.com/1/x', { grant: null }, { env: proxy.env }), /not-granted/);
    await assert.rejects(egress.proxyFetch('https://api.trello.com/1/x', { grant }, { env: {} }), /no-http-proxy/);
    assert.equal(proxy.seen.length, 0);
  } finally { await proxy.close(); }
});

test('a claim token is redeemed at the bridge for the permanent access token', async () => {
  const proxy = await fakeProxy((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ cap: 'PERMANENT' }));
  });
  try {
    assert.equal(await egress.claimApiGrant('sess_1', 'CLAIM', { env: proxy.env }), 'PERMANENT');
    const [req] = proxy.seen;
    assert.equal(req.method, 'POST');
    assert.equal(req.url, 'http://http-bridge/session/sess_1/claim');
    assert.deepEqual(JSON.parse(req.body), { requestToken: 'CLAIM', requiredPermissions: ['participate'] });
    // Negative: a session id that would change the path, or an empty claim.
    await assert.rejects(egress.claimApiGrant('../evil', 'CLAIM', { env: proxy.env }), /invalid-session/);
    await assert.rejects(egress.claimApiGrant('sess_1', '', { env: proxy.env }), /invalid-claim/);
    assert.equal(proxy.seen.length, 1);
  } finally { await proxy.close(); }
  const refused = await fakeProxy((req, res) => { res.writeHead(403); res.end('no'); });
  try {
    await assert.rejects(egress.claimApiGrant('sess_1', 'CLAIM', { env: refused.env }), /claim-failed: HTTP 403/);
  } finally { await refused.close(); }
});

test('the access token stays on the server, per user, and only a signed-in user may grant (negative)', () => {
  const server = read('server/sandstormEgress.js');
  assert.match(server, /new Mongo\.Collection\('sandstorm_api_grants'\)/);
  const methods = server.slice(server.indexOf('Meteor.methods({'));
  assert.equal((methods.match(/if \(!this\.userId\) throw new Meteor\.Error\('error-notAuthorized'\);/g) || []).length, 3);
  assert.match(server, /findOneAsync\(grantId\(userId, service\)\)/, 'a request uses the acting user\'s own grant');
  // Nothing publishes the grants or sends the token to a client.
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : /\.(js|mjs)$/.test(e.name) ? [path.join(dir, e.name)] : []);
  for (const file of [...walk('server'), ...walk('models'), ...walk('client')]) {
    const src = read(file);
    assert.doesNotMatch(src, /Meteor\.publish\([^)]*sandstorm_api_grants|SandstormApiGrants\.find\(/, file);
  }
  assert.doesNotMatch(methods, /return [^;]*\bcap\b/, 'no method returns the token');
});

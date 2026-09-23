'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { parseOAuthHeader, MAX_HEADER_LENGTH } = require('./integration/login-providers/oauth-header.cjs');
const { startProvider } = require('./integration/login-providers/provider.cjs');
const root = path.resolve(__dirname, '..');

test('OAuth header parses encoded values and ignores realm in signatures', () => {
  assert.deepEqual({ ...parseOAuthHeader('OAuth realm="local", oauth_nonce="abc", oauth_callback="http%3A%2F%2Flocalhost%2Fa%2Cb", oauth_signature="x%2By%3D"') },
    { oauth_nonce: 'abc', oauth_callback: 'http://localhost/a,b', oauth_signature: 'x+y=' });
});

test('OAuth header rejects adversarial prefixes, oversize, duplicates and malformed encodings', () => {
  for (const value of [undefined, '', 'Bearer token', 'OAuth ' + 'oauth_'.repeat(1500),
    'OAuth ' + 'oauth_'.repeat(MAX_HEADER_LENGTH), 'OAuth oauth_nonce="%ZZ"',
    'OAuth oauth_nonce="a",oauth_nonce="b"', 'OAuth oauth_nonce="a"junk',
    'OAuth junkoauth_nonce="a"', 'OAuth oauth_nonce="unterminated']) {
    assert.throws(() => parseOAuthHeader(value));
  }
});

test('fixture HTTP server accepts real OAuth signatures and contains malformed requests', async t => {
  const fixture = await startProvider({ privateKey: '', certificate: '' });
  t.after(() => fixture.close());
  const encode = value => encodeURIComponent(value).replace(/[!'()*]/g,
    c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  const values = { oauth_consumer_key: 'fixture-client', oauth_nonce: 'test-nonce',
    oauth_signature_method: 'HMAC-SHA1', oauth_timestamp: '1', oauth_version: '1.0' };
  const normalized = Object.entries(values).sort().map(([k,v]) => `${encode(k)}=${encode(v)}`).join('&');
  const base = ['POST', 'https://api.twitter.com/oauth/request_token', normalized].map(encode).join('&');
  values.oauth_signature = crypto.createHmac('sha1', 'fixture-secret&').update(base).digest('base64');
  const authorization = 'OAuth ' + Object.entries(values).map(([k,v]) => `${k}="${encode(v)}"`).join(', ');
  const endpoint = fixture.url + '/social/api.twitter.com/oauth/request_token';
  const ok = await fetch(endpoint, { method: 'POST', headers: { authorization } });
  assert.equal(ok.status, 200);
  assert.match(await ok.text(), /oauth_token=fixture-request-token/);
  assert.equal(fixture.state.events.at(-1).accepted, true);
  const denied = await fetch(endpoint, { method: 'POST', headers: { authorization: authorization.replace('test-nonce', 'wrong-nonce') } });
  assert.equal(denied.status, 401);
  assert.deepEqual(await denied.json(), { error: 'invalid_signature' });
  for (const header of ['OAuth ' + 'oauth_'.repeat(1500), 'OAuth oauth_nonce="%ZZ"']) {
    const bad = await fetch(endpoint, { headers: { authorization: header } });
    assert.equal(bad.status, 400);
    assert.deepEqual(await bad.json(), { error: 'invalid_oauth_header' });
  }
  const malformed = await fetch(fixture.url + '/__control', { method: 'POST', body: 'private-request-marker' });
  assert.equal(malformed.status, 500);
  assert.equal(await malformed.text(), 'Identity fixture request failed');
  const healthy = await fetch(fixture.url + '/__events');
  assert.equal(healthy.status, 200);
  assert.ok(Array.isArray(await healthy.json()));
});

test('Sandstorm handler preserves successful proxy login and hides every failure response', async () => {
  const source = fs.readFileSync(path.join(root, 'packages/wekan-accounts-sandstorm/server.js'), 'utf8');
  const handlerSource = source.slice(source.indexOf('var handlePostToken ='), source.lastIndexOf('\n}'));
  let resolved;
  const context = vm.createContext({
    readAll: async req => req.body,
    logins: { pending: { resolve: value => { resolved = value; } } },
    Package: { 'accounts-base': { Accounts: {
      async updateOrCreateUserFromExternalService() { return { userId: 'local-user' }; },
    } } },
  });
  vm.runInContext(handlerSource, context);
  async function request(headers, body) {
    const result = {};
    await context.handlePostToken({ headers, body }, {
      writeHead(status) { result.status = status; }, end(value) { result.body = value; },
    });
    return result;
  }
  const headers = { 'content-type': 'application/x-sandstorm-login-token',
    'x-sandstorm-user-id': 'dummy', 'x-sandstorm-username': 'Test%20User' };
  assert.equal((await request(headers, 'pending')).status, 204);
  assert.equal(resolved.userId, 'local-user');
  for (const [h, token] of [[{}, 'pending'], [{ ...headers, 'content-type': 'private-marker' }, 'pending'],
    [headers, 'unmatched'], [{ ...headers, 'x-sandstorm-username': '%ZZ' }, 'pending']]) {
    resolved = null;
    assert.deepEqual(await request(h, token), { status: 500, body: 'Sandstorm login failed' });
    assert.equal(resolved, null);
  }
  context.Package['accounts-base'].Accounts.updateOrCreateUserFromExternalService = async () => {
    throw new Error('private server path /sensitive/database');
  };
  assert.deepEqual(await request(headers, 'pending'), { status: 500, body: 'Sandstorm login failed' });
});

test('tracked source contains no direct HTTP stack-trace sinks or the unanchored OAuth scanner', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0');
  for (const file of files.filter(name => /\.(?:[cm]?js|ts)$/.test(name) && !name.startsWith('_build/'))) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(source, /\.(?:end|send|json)\(\s*(?:String\()?\w+\.stack\b/, file);
    assert.ok(!source.includes('matchAll(/' + '(oauth_\\w+)'), file);
  }
});

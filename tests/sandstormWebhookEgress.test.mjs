// Outgoing webhooks from a Sandstorm grain (the Planned Sandstorm item,
// docs/Platforms/FOSS/Container/Sandstorm/Powerbox-External-APIs.md). A grain
// has no network but the bridge proxy, so a webhook leaves only through an API
// a board admin approved in the Powerbox for that webhook's own address.
// imports/sandstorm/egress.mjs is run against a fake bridge proxy; the Meteor
// half (server/sandstormEgress.js) and the client half are checked from their
// source. Run: node tests/sandstormWebhookEgress.test.cjs

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

test('a webhook is granted as its parent path, so its own URL arrives exactly', () => {
  assert.deepEqual(egress.webhookGrantFor('https://hooks.example.com/services/T1/B2/X3'),
    { canonicalUrl: 'https://hooks.example.com/services/T1/B2', url: 'https://hooks.example.com/services/T1/B2/X3' });
  assert.deepEqual(egress.webhookGrantFor('https://chat.example.org/hooks/abc?channel=wekan'),
    { canonicalUrl: 'https://chat.example.org/hooks', url: 'https://chat.example.org/hooks/abc?channel=wekan' });
  assert.deepEqual(egress.webhookGrantFor('http://nodered.example.com'),
    { canonicalUrl: 'http://nodered.example.com', url: 'http://nodered.example.com' });
  // The Powerbox query asks for exactly that API.
  const { canonicalUrl } = egress.webhookGrantFor('https://hooks.example.com/services/T1/B2/X3');
  assert.equal(bridge.parseApiSessionDescriptor(bridge.apiSessionDescriptor(canonicalUrl)).canonicalUrl, canonicalUrl);
});

test('negative: what cannot be granted is refused', () => {
  for (const url of ['ftp://files.example.com/x', 'https://user:pass@hooks.example.com/x', 'https://hooks.example.com/x#frag', 'not a url', '']) {
    assert.equal(egress.webhookGrantFor(url), null, url);
  }
});

test('a grant covers its own URLs only, not a host that merely starts the same', () => {
  const grant = { canonicalUrl: 'https://hooks.example.com/services/T1/B2' };
  assert.ok(egress.grantCovers(grant, 'https://hooks.example.com/services/T1/B2/X3'));
  assert.ok(egress.grantCovers(grant, 'https://hooks.example.com/services/T1/B2?x=1'));
  assert.ok(!egress.grantCovers(grant, 'https://hooks.example.com/services/T1/B22/X3'));
  assert.ok(!egress.grantCovers({ canonicalUrl: 'https://hooks.example.com' }, 'https://hooks.example.com.evil.net/x'));
  assert.ok(!egress.grantCovers(null, 'https://hooks.example.com/x'));
});

test('a webhook goes to the bridge proxy with its grant, and a URL outside it never does', async () => {
  const proxy = await fakeProxy((req, res) => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); });
  try {
    const target = egress.webhookGrantFor('https://hooks.example.com/services/T1/B2/X3');
    const grant = { cap: 'WEBHOOKCAP', canonicalUrl: target.canonicalUrl };
    const res = await egress.proxyFetch(target.url, {
      grant, method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"text":"hi"}',
    }, { env: proxy.env });
    assert.equal(res.status, 200);
    const [req] = proxy.seen;
    assert.equal(req.method, 'POST');
    assert.equal(req.url, 'http://hooks.example.com/X3', 'the last segment, joined to the grant by the bridge');
    assert.equal(req.headers.authorization, 'Bearer WEBHOOKCAP');
    assert.equal(req.body.toString(), '{"text":"hi"}');
    // Negative: the same grant does not reach another address.
    await assert.rejects(egress.proxyFetch('https://other.example.com/X3', { grant }, { env: proxy.env }), /not-granted/);
    assert.equal(proxy.seen.length, 1);
  } finally { await proxy.close(); }
});

test('every webhook sender goes through webhookFetch, which is fetchSafe off Sandstorm', () => {
  for (const file of ['server/notifications/outgoing.js', 'server/notifications/webhookQueue.js', 'server/notifications/storedWebhookHttp.js']) {
    const src = read(file);
    assert.match(src, /import \{ webhookFetch \} from '\/server\/sandstormEgress';/, file);
    assert.doesNotMatch(src, /import \{[^}]*fetchSafe[^}]*\} from '\/server\/lib\/ssrfGuard'/, `${file} must not bypass it`);
  }
  const server = read('server/sandstormEgress.js');
  const body = server.slice(server.indexOf('export async function webhookFetch('));
  // Off Sandstorm: fetchSafe, except a host the site admin listed under
  // Internal destinations (b4d2604e61; that branch is pinned in
  // internalWebhookHosts.test.cjs) - and the fetchSafe call ends the branch.
  assert.match(body, /if \(!isSandstorm\) \{[\s\S]*?webhookHostIsInternalAllowed\(url\)\) \{[\s\S]*?\}\s*return fetchSafe\(url, options\);\s*\}/);
  assert.match(body, /if \(!grant \|\| !api\.grantCovers\(grant, target\.url\)\) return fetchSafe\(url, options\);/);
  // Found by the URL being sent to - never a search of the grants.
  assert.match(body, /findOneAsync\(webhookGrantId\(target\.canonicalUrl\)\)/);
});

test('only a board admin (or site admin) may grant a webhook, and no method returns the token', () => {
  const server = read('server/sandstormEgress.js');
  for (const name of ['sandstormWebhookDescriptor', 'sandstormClaimWebhookGrant', 'sandstormWebhookGrantStatus']) {
    const at = server.indexOf(`async ${name}(`);
    assert.ok(at > 0, name);
    const body = server.slice(at, server.indexOf('\n    },', at));
    assert.match(body, /await mayManageWebhook\(this\.userId, integrationId\)/, name);
    assert.doesNotMatch(body, /return [^;]*\bcap\b/, `${name} returns the token`);
  }
  assert.match(server, /\(user && user\.isAdmin\) \|\| allowIsBoardAdmin\(userId, board\)/);
});

test('the board admin asks for it in the webhook form, on Sandstorm only', () => {
  const jade = read('client/components/sidebar/sidebar.jade');
  const popup = jade.slice(jade.indexOf('template(name="outgoingWebhooksPopup")'));
  assert.match(popup, /if isSandstorm\n\s+if webhookGranted _id[\s\S]*a\.button\.wide\.js-sandstorm-webhook-grant/);
  assert.match(read('client/components/sidebar/sidebar.js'), /window\.sandstormRequestWebhook\(integration\._id, integration\.title \|\| integration\.url\)/);
  const client = read('sandstorm.js');
  assert.match(client, /Meteor\.callAsync\('sandstormWebhookDescriptor', integrationId\)/);
  assert.match(client, /Meteor\.callAsync\('sandstormClaimWebhookGrant', integrationId, response\.token\)/);
});

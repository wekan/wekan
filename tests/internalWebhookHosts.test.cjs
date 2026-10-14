'use strict';

// Guard: outgoing webhooks to internal addresses - only the hosts a site
// administrator lists (Admin Panel / Settings / Global Webhooks / Internal
// destinations), empty by default; the SSRF guard for everything else.
// Run: node tests/internalWebhookHosts.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const h = require('../models/lib/internalWebhookHosts.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('the list: hosts and addresses, one per entry, cleaned', () => {
  const { hosts, rejected } = h.cleanInternalHosts('NodeRed.LAN\n10.0.0.5:1880, [fd00::5]:8080\nnodered.lan\nhttp://x.lan\n*.lan\nuser@host\nhost/path\nhost:99999');
  assert.deepStrictEqual(hosts, ['nodered.lan', '10.0.0.5:1880', '[fd00::5]:8080']);
  assert.deepStrictEqual(rejected, ['http://x.lan', '*.lan', 'user@host', 'host/path', 'host:99999']);
  assert.strictEqual(h.cleanInternalHosts(Array.from({ length: 80 }, (_, i) => `h${i}.lan`)).hosts.length, h.MAX_HOSTS);
});

test('a listed host is allowed - any port without one, only that port with one', () => {
  const hosts = ['nodered.lan', '10.0.0.5:1880'];
  assert.ok(h.isInternalHostAllowed('http://nodered.lan:1880/hook', hosts));
  assert.ok(h.isInternalHostAllowed('https://NodeRed.lan/hook', hosts));
  assert.ok(h.isInternalHostAllowed('http://10.0.0.5:1880/x', hosts));
  assert.ok(!h.isInternalHostAllowed('http://10.0.0.5:22/x', hosts), 'another port of a host listed with a port');
});

test('negative: empty by default, other hosts, schemes and credentials are never allowed', () => {
  assert.ok(!h.isInternalHostAllowed('http://169.254.169.254/latest/meta-data', []));
  assert.ok(!h.isInternalHostAllowed('http://169.254.169.254/', ['nodered.lan']));
  assert.ok(!h.isInternalHostAllowed('http://evil.nodered.lan/', ['nodered.lan']), 'no suffix matching');
  assert.ok(!h.isInternalHostAllowed('ftp://nodered.lan/', ['nodered.lan']));
  assert.ok(!h.isInternalHostAllowed('http://user:pw@nodered.lan/', ['nodered.lan']));
  assert.ok(!h.isInternalHostAllowed('not a url', ['nodered.lan']));
});

test('every webhook send checks it; everything else stays behind the SSRF guard; site admins only', () => {
  const egress = read('server/sandstormEgress.js');
  const at = egress.indexOf('export async function webhookFetch');
  const body = egress.slice(at, at + 900);
  assert.match(body, /webhookHostIsInternalAllowed\(url\)\) \{\s*return fetch\(url, \{[\s\S]*?redirect: 'error'/);
  assert.match(body, /return fetchSafe\(url, options\);/);
  const server = read('server/webhookInternalHosts.js');
  assert.strictEqual((server.match(/await requireSiteAdmin\(this\.userId\);/g) || []).length, 2);
  // never published
  assert.doesNotMatch(read('server/publications/settings.js'), /webhookInternalHosts/);
  // the REST create and edit accept a listed host too, and check the rest
  const rest = read('server/models/integrations.js');
  assert.strictEqual((rest.match(/webhookHostIsInternalAllowed\(req\.body\.url\)\)\s*\? \{ valid: true \} : await validateAttachmentUrl\(req\.body\.url\)/g) || []).length, 2);
});

console.log(`# ${passed} passed`);

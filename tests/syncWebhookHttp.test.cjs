'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { prepareWebhookPlan, deliveryId } = require('../server/lib/syncWebhookPlan');
function load(relative, dependencies, names) {
  const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8')
    .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  return new Function(...Object.keys(dependencies), `${source}\nreturn {${names.join(',')}};`)(...Object.values(dependencies));
}
function fixture({ addresses = ['93.184.216.34'], status = 200, body = '{"reply":true}', headers = {} } = {}) {
  const connections = [], rows = new Map(); let lookups = 0;
  const transport = { request(options, callback) {
    connections.push(options);
    const response = new Readable({ read() {} });
    response.statusCode = status; response.headers = headers;
    process.nextTick(() => { callback(response); process.nextTick(() => {
      if (!response.destroyed) { response.push(body); response.push(null); }
    }); });
    return { on() {}, write() {}, end() {}, setTimeout() {} };
  } };
  const { isIpBlocked } = load('models/lib/attachmentUrlValidation.js', { Meteor: { isServer: true }, require }, ['isIpBlocked']);
  const { fetchSafe } = load('server/lib/ssrfGuard.js', { dns: { promises: { lookup: async () => {
    lookups++; return addresses.map(address => ({ address, family: address.includes(':') ? 6 : 4 }));
  } } }, createOutboundDeadline: require('../server/lib/outboundDeadline').createOutboundDeadline, fs, net: require('node:net'), http: transport, https: transport, URL, isIpBlocked }, ['fetchSafe']);
  const { sendStoredWebhook } = load('server/notifications/storedWebhookHttp.js', {
    fetchSafe, require: id => require(`..${id}`),
  }, ['sendStoredWebhook']);
  const responses = { findOne: async ({ _id }) => rows.get(_id), insertOne: async row => rows.set(row._id, row) };
  return { sendStoredWebhook, connections, rows, responses, lookups: () => lookups };
}
async function item(url = 'http://public.example/hook', is2way = false) {
  const activity = { _id: 'event', boardId: 'board', cardId: 'card', userId: 'actor' };
  const plan = await prepareWebhookPlan({ activity,
    integrations: [{ _id: 'hook', boardId: 'board', enabled: true, url, type: is2way ? 'bidirectional-webhooks' : 'outgoing-webhooks' }],
    prepare: async () => ({ url, headers: { 'Content-Type': 'application/json' }, body: '{}', language: 'fi', is2way }) });
  const target = plan.targets[0], id = deliveryId('event', 'hook');
  return { activity, target, deliveryId: id, request: { ...target.request, headers: { ...target.request.headers, 'X-Wekan-Delivery-Id': id } } };
}
const guards = { assertCurrent: async () => {}, assertTarget: async () => true };
test('production adapter pins actual guard transport and resumes from saved acceptance without DNS or HTTP', async () => {
  const f = fixture(), captured = await item();
  const options = { ...guards, responses: f.responses, item: captured,
    requestHttp: async () => assert.fail('caller cannot override fetchSafe') };
  assert.equal(await f.sendStoredWebhook(options), captured.deliveryId);
  assert.equal(await f.sendStoredWebhook(options), captured.deliveryId);
  assert.equal(f.lookups(), 1); assert.equal(f.connections.length, 1);
  assert.equal(f.connections[0].hostname, '93.184.216.34');
  assert.equal(f.connections[0].headers['X-Wekan-Delivery-Id'], captured.deliveryId);
  assert.equal(f.rows.size, 1);
});
test('real guard rejects private DNS, literal loopback and redirects without response evidence', async () => {
  for (const [options, url, reason] of [[{ addresses: ['127.0.0.1'] }, undefined, /Blocked|blocked/],
    [{}, 'http://127.0.0.1/hook', /Blocked|blocked/],
    [{ status: 302, headers: { location: 'http://127.0.0.1/hook' } }, undefined, /Redirects are not allowed/]]) {
    const f = fixture(options);
    await assert.rejects(f.sendStoredWebhook({ ...guards, responses: f.responses, item: await item(url) }), reason);
    assert.equal(f.rows.size, 0); assert.ok(f.connections.length <= 1);
  }
});
test('request substitution, absent response adapter and revoked access fail before transport', async () => {
  const f = fixture(), captured = await item();
  captured.request.url = 'http://different.example/hook';
  await assert.rejects(f.sendStoredWebhook({ ...guards, responses: f.responses, item: captured }), /http-invalid/);
  await assert.rejects(f.sendStoredWebhook({ ...guards, responses: f.responses, item: await item(undefined, true) }), /http-invalid/);
  await assert.rejects(f.sendStoredWebhook({ ...guards, responses: f.responses, item: await item(), assertTarget: async () => false }), /target-denied/);
  assert.equal(f.connections.length, 0); assert.equal(f.rows.size, 0);
});

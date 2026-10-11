'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createHmac } = require('node:crypto');
const { installNextcloudTransport } = require('../server/lib/nextcloudTransport');
const env = { NEXTCLOUD_EXAPP: 'true', NEXTCLOUD_URL: 'http://cloud', WEKAN_NEXTCLOUD_PROXY_KEY: 'private' };
const data = Buffer.from(JSON.stringify({ issuer: env.NEXTCLOUD_URL, userId: 'alice' })).toString('base64url');
const headers = { 'x-wekan-nextcloud-user': data,
  'x-wekan-nextcloud-signature': createHmac('sha256', 'private').update(data).digest('hex') };

test('verified upgrade identity survives SockJS header filtering on only its own socket', () => {
  const server = new EventEmitter(); let connected;
  installNextcloudTransport(server, { register(fn) { connected = fn; } }, env);
  const raw = {};
  server.emit('upgrade', { headers }, raw);
  const filtered = { headers: { host: 'cloud' }, _session: { recv: { connection: raw } } };
  connected(filtered);
  assert.equal(filtered.headers['x-wekan-nextcloud-user'], data);
  const other = { headers: {}, _session: { recv: { connection: {} } } };
  connected(other); assert.deepEqual(other.headers, {});
  server.emit('upgrade', { headers: { ...headers, 'x-wekan-nextcloud-signature': '0'.repeat(64) } }, raw);
  const forged = { headers: {}, _session: { recv: { connection: raw } } };
  connected(forged); assert.deepEqual(forged.headers, {});
});

test('ordinary deployments do not install Nextcloud transport hooks', () => {
  const server = new EventEmitter();
  installNextcloudTransport(server, { register() { assert.fail('unexpected hook'); } }, {});
  assert.equal(server.listenerCount('upgrade'), 0);
});

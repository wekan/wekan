'use strict';
// A list-sync spec's mock Jira/GitLab listens where WeKan can reach it: on any
// port when they share a loopback, and on a port build.sh forwards from the
// host when the browsers run in Docker on macOS (WEKAN_TEST_REVERSE_PORTS).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const net = require('node:net');
const { listenReachable, reversePorts } = require('./playwright/helpers/reachable-server.cjs');

const close = server => new Promise(resolve => server.close(resolve));
async function freePorts(n) {
  const servers = [];
  for (let i = 0; i < n; i++) {
    const server = net.createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    servers.push(server);
  }
  const ports = servers.map(server => server.address().port);
  await Promise.all(servers.map(close));
  return ports;
}

test('the pool is read from the environment, and nothing else counts as a port', () => {
  assert.deepEqual(reversePorts({ WEKAN_TEST_REVERSE_PORTS: '39101 39102,39103' }), [39101, 39102, 39103]);
  assert.deepEqual(reversePorts({ WEKAN_TEST_REVERSE_PORTS: 'x 0 70000 -1 39104' }), [39104]);
  assert.deepEqual(reversePorts({}), []);
});

test('with no pool the server listens on any free port, as before', async () => {
  const server = http.createServer();
  const base = await listenReachable(server, {});
  try { assert.match(base, /^http:\/\/127\.0\.0\.1:\d+$/); } finally { await close(server); }
});

test('with a pool the server takes its first free port, skipping one in use', async () => {
  const [busy, free] = await freePorts(2);
  const holder = net.createServer();
  await new Promise(resolve => holder.listen(busy, '127.0.0.1', resolve));
  const server = http.createServer((req, res) => res.end('mock'));
  try {
    const base = await listenReachable(server, { WEKAN_TEST_REVERSE_PORTS: `${busy} ${free}` });
    assert.equal(base, `http://127.0.0.1:${free}`);
    assert.equal(await (await fetch(base)).text(), 'mock');
  } finally { await close(server); await close(holder); }
});

test('negative: when every forwarded port is taken it says so, and never falls back to one WeKan cannot reach', async () => {
  const [busy] = await freePorts(1);
  const holder = net.createServer();
  await new Promise(resolve => holder.listen(busy, '127.0.0.1', resolve));
  const server = http.createServer();
  try {
    await assert.rejects(listenReachable(server, { WEKAN_TEST_REVERSE_PORTS: String(busy) }), /Every forwarded test port is in use/);
    assert.equal(server.listening, false);
  } finally { await close(holder); }
});

'use strict';
// The Docker test container's proxy to the host WeKan. Docker Desktop's gateway
// now and then never answers one connect (a SYN left unanswered through nine
// retransmits, during EVERYTHING's Firefox stage), and a page waited 30-60 s
// for a document that never came. A dial that has not connected in time is
// dropped and made again, and the browser's request still arrives once.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { once } = require('node:events');
const { createProxy, CONNECT_TIMEOUT_MS, ATTEMPTS } = require('./playwright/helpers/docker-host-proxy.cjs');

// A connect the gateway never answers: a socket that is never connected.
const blackHole = () => new net.Socket();

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

// Send one request through the proxy, as a browser does (no half-close), and
// collect everything answered until the connection closes - by the upstream
// after its answer, or by the proxy with a reset when it gives up.
async function request(port, body) {
  const socket = net.connect(port, '127.0.0.1');
  const chunks = [];
  socket.on('data', chunk => chunks.push(chunk));
  const closed = new Promise(resolve => socket.on('close', resolve));
  socket.on('error', () => {});
  await once(socket, 'connect');
  socket.write(body);
  await closed;
  return Buffer.concat(chunks).toString();
}

test('a connect the gateway never answers is dropped and dialled again', async () => {
  const received = [];
  const upstream = net.createServer(socket => {
    socket.on('data', chunk => { received.push(String(chunk)); socket.end(`answer to ${chunk}`); });
  });
  const upstreamPort = await listen(upstream);
  const dials = [];
  const proxy = createProxy({
    port: upstreamPort,
    connectTimeoutMs: 100,
    dial: () => {
      const socket = dials.length < 2 ? blackHole() : net.connect(upstreamPort, '127.0.0.1');
      dials.push(socket);
      return socket;
    },
  });
  const proxyPort = await listen(proxy);
  try {
    assert.equal(await request(proxyPort, 'GET /sign-in'), 'answer to GET /sign-in');
    assert.equal(dials.length, 3, 'two unanswered dials, then one that connects');
    assert.ok(dials[0].destroyed && dials[1].destroyed, 'the unanswered dials are dropped');
    assert.deepEqual(received, ['GET /sign-in'], 'the request arrives once, whole');
  } finally {
    proxy.close();
    upstream.close();
  }
});

test('negative: when no dial connects, the browser is told so instead of waiting', async () => {
  let dials = 0;
  const proxy = createProxy({ port: 1, connectTimeoutMs: 50, attempts: 3,
    dial: () => { dials += 1; return blackHole(); } });
  const proxyPort = await listen(proxy);
  try {
    const started = Date.now();
    assert.equal(await request(proxyPort, 'GET /'), '', 'closed with no answer');
    assert.equal(dials, 3, 'every attempt is made, and no more');
    assert.ok(Date.now() - started < 2000, 'closed after the attempts, not left open');
  } finally {
    proxy.close();
  }
});

test('the real timeout is far above a normal connect and the attempts outlast a lost one', () => {
  assert.ok(CONNECT_TIMEOUT_MS >= 1000 && CONNECT_TIMEOUT_MS <= 3000);
  assert.ok(ATTEMPTS >= 3);
});

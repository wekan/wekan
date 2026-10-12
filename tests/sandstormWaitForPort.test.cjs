'use strict';
const assert = require('node:assert/strict');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const waitForPort = require('../sandstorm-src/wait-for-port');
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const close = server => new Promise(resolve => server.close(resolve));

(async () => {
  const server = net.createServer(socket => socket.end());
  await listen(server);
  const port = server.address().port;
  try {
    const before = performance.now();
    await waitForPort(port);
    assert.ok(performance.now() - before < 1000, 'already-listening DB needs no 1.5s delay');
  } finally { await close(server); }

  let listening = false;
  const later = setTimeout(() => server.listen(port, '127.0.0.1', () => { listening = true; }), 1600);
  try {
    await waitForPort(port, { timeoutMs: 5000, retryMs: 20 });
    assert.ok(listening, 'waits even when database takes longer than the old 1.5s sleep');
  } finally {
    clearTimeout(later);
    if (server.listening) await close(server);
  }
  await assert.rejects(waitForPort(port, { timeoutMs: 80, retryMs: 10 }), /Timed out waiting/);
  // If a failed attempt schedules another retry after timeout, this process
  // cannot exit normally; run this test with the suite's usual timeout.
  const root = path.resolve(__dirname, '..');
  assert.match(fs.readFileSync(path.join(root, 'sandstorm-src/build-deps.sh'), 'utf8'),
    /cp -f "\$REPO\/sandstorm-src\/wait-for-port.js"\s+"\$DEPS\/wait-for-port.js"/);
  console.log('ok - immediate, slow and unavailable database listeners; helper packaged');
})().catch(error => { console.error(error); process.exitCode = 1; });

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const { startProxy } = require('./playwright/helpers/docker-smtp-proxy.cjs');

test('SMTP bridge forwards socket bytes and cleans up without logging mail', async () => {
  const temp = fs.mkdtempSync(path.join(__dirname, '../.tools/tmp/smtp-proxy-test-'));
  const reservation = net.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const { port } = reservation.address();
  await new Promise(resolve => reservation.close(resolve));
  let child;
  const proxy = startProxy({ container: 'wekan-playwright-firefox-123', port,
    readyFile: path.join(temp, 'ready'),
    spawnProcess(command, args, options) {
      assert.equal(command, 'docker');
      assert.deepEqual(args.slice(0, 5), ['exec', '-i', 'wekan-playwright-firefox-123', 'node', '-e']);
      assert.match(args[5], /127\.0\.0\.1/);
      child = spawn(process.execPath, ['-e', 'process.stdin.pipe(process.stdout)'], options);
      return child;
    },
  });
  let socket;
  try {
    await once(proxy.server, 'listening');
    assert.equal(proxy.server.address().address, '127.0.0.1');
    assert.equal(fs.readFileSync(path.join(temp, 'ready'), 'utf8'), 'ready\n');
    socket = net.connect(port, '127.0.0.1');
    await once(socket, 'connect');
    const response = once(socket, 'data');
    socket.write('EHLO local-fixture\r\n');
    assert.equal(String((await response)[0]), 'EHLO local-fixture\r\n');
    const exited = once(child, 'exit');
    socket.destroy();
    await exited;
  } finally {
    socket?.destroy();
    proxy.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('SMTP bridge rejects invalid ports and non-test container names', () => {
  for (const args of [{ container: 'production', port: 2525 },
    { container: 'wekan-playwright-firefox-123', port: 0 },
    { container: 'wekan-playwright-firefox-123', port: 65536 }]) {
    assert.throws(() => startProxy(args), /Invalid SMTP test proxy target/);
  }
});

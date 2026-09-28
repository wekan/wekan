'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { createOutboundDeadline } = require('../../server/lib/outboundDeadline');
const enabled = process.env.WEKAN_HTTP_TEST === '1';
function load(file, dependencies, names) {
  const source = fs.readFileSync(path.join(__dirname, '../..', file), 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  return new Function(...Object.keys(dependencies), `${source}\nreturn {${names.join(',')}};`)(...Object.values(dependencies));
}
for (const phase of ['headers', 'dripping body']) {
  test(`real socket is closed at the total deadline while waiting for ${phase}`, { skip: !enabled, timeout: 5000 }, async t => {
    let closed, received, interval;
    const disconnected = new Promise(resolve => { closed = resolve; });
    const accepted = new Promise(resolve => { received = resolve; });
    const server = http.createServer((req, res) => {
      received();
      res.on('close', () => { clearInterval(interval); closed(); });
      if (phase === 'dripping body') {
        res.writeHead(200); res.write('first');
        interval = setInterval(() => res.write('more'), 5);
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(async () => { clearInterval(interval); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
    // DNS and routing are isolated test fixtures. The actual guard must first
    // pin this public IP; only the test transport routes it to our owned server.
    const transport = { request(options, callback) {
      assert.equal(options.hostname, '93.184.216.34');
      return http.request({ ...options, hostname: '127.0.0.1', port: server.address().port }, callback);
    } };
    const { isIpBlocked } = load('models/lib/attachmentUrlValidation.js', { Meteor: { isServer: true }, require }, ['isIpBlocked']);
    const { fetchSafe } = load('server/lib/ssrfGuard.js', { dns: { promises: { lookup: async () => [{ address: '93.184.216.34', family: 4 }] } },
      fs, net: require('node:net'), http: transport, https: transport, URL, isIpBlocked, createOutboundDeadline, console: { info() {} } }, ['fetchSafe']);
    const result = fetchSafe('http://public.example/webhook', { totalTimeoutMs: 150, timeoutMs: 1000 });
    const rejected = assert.rejects(result, { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
    await accepted; await rejected; await disconnected;
  });
}

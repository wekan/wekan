'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const path = require('node:path');
const { sendDeadlineSmtp } = require('../../server/lib/smtpDeadline');
const enabled = process.env.WEKAN_SMTP_TEST === '1';
// Use the dependency actually shipped by Meteor, not a test-only substitute.
const nodemailer = enabled && require(process.env.WEKAN_NODEMAILER_PATH || path.resolve(
  '.meteor/local/build/programs/server/npm/node_modules/meteor/email/node_modules/nodemailer'));
const message = { from: 'sender@example.test', to: 'recipient@example.test', subject: 'deadline', text: 'test' };
async function fixture(t, onSocket, createServer = net.createServer) {
  const sockets = new Set();
  const server = createServer(socket => {
    sockets.add(socket); socket.on('error', () => {});
    socket.on('close', () => sockets.delete(socket));
    onSocket(socket);
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); });
  return { host: '127.0.0.1', port: server.address().port, connectionTimeout: 1000,
    greetingTimeout: 1000, socketTimeout: 1000, dnsTimeout: 1000 };
}
for (const drip of [false, true]) {
  test(`SMTP deadline closes a real socket with ${drip ? 'continuous response bytes' : 'no greeting'}`,
    { skip: !enabled, timeout: 5000 }, async t => {
      let disconnected;
      const closed = new Promise(resolve => { disconnected = resolve; });
      const options = await fixture(t, socket => {
        const timer = drip && setInterval(() => socket.write('220-still waiting\r\n'), 5);
        socket.on('close', () => { clearInterval(timer); disconnected(); });
      });
      await assert.rejects(sendDeadlineSmtp({ nodemailer, options, message, timeoutMs: 200 }),
        { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
      await closed;
    });
}
test('DNS completing after expiration cannot connect to the SMTP server', { skip: !enabled, timeout: 5000 }, async t => {
  let accepted = 0, resolveDns;
  const options = await fixture(t, () => { accepted++; });
  const pending = sendDeadlineSmtp({ nodemailer, options: { ...options, host: 'delayed.test' }, message,
    timeoutMs: 50, lookup: (host, opts, callback) => { resolveDns = () => callback(null,
      ...(opts.all ? [[{ address: '127.0.0.1', family: 4 }]] : ['127.0.0.1', 4])); } });
  await assert.rejects(pending, { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
  assert.equal(typeof resolveDns, 'function'); resolveDns();
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(accepted, 0);
});
test('one expired send does not cancel another recipient and successful sockets close',
  { skip: !enabled, timeout: 5000 }, async t => {
    let connections = 0, disconnected = 0;
    const options = await fixture(t, socket => {
      connections++; socket.on('close', () => disconnected++);
      if (connections === 1) return; // only this recipient stalls
      socket.write('220 localhost\r\n');
      let buffer = '', data = false;
      socket.on('data', chunk => {
        buffer += chunk;
        let end;
        while ((end = buffer.indexOf('\r\n')) !== -1) {
          const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
          if (data) { if (line === '.') { data = false; socket.write('250 accepted\r\n'); } }
          else if (line === 'DATA') { data = true; socket.write('354 send body\r\n'); }
          else socket.write('250 OK\r\n');
        }
      });
    });
    const failed = assert.rejects(sendDeadlineSmtp({ nodemailer, options, message, timeoutMs: 200 }),
      { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
    while (!connections) await new Promise(resolve => setTimeout(resolve, 5));
    const result = await sendDeadlineSmtp({ nodemailer, options, message, timeoutMs: 1000 });
    assert.deepEqual(result.accepted, ['recipient@example.test']);
    await failed;
    while (disconnected < 2) await new Promise(resolve => setTimeout(resolve, 5));
  });
test('implicit TLS retains certificate verification and cancels the encrypted connection',
  { skip: !enabled, timeout: 10000 }, async t => {
    const fs = require('node:fs'), tls = require('node:tls');
    const directory = fs.mkdtempSync(path.join(process.env.TMPDIR, 'smtp-deadline-cert-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const key = path.join(directory, 'key.pem'), cert = path.join(directory, 'cert.pem');
    require('node:child_process').execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048',
      '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost',
      '-addext', 'subjectAltName=DNS:localhost'], { stdio: 'ignore' });
    const certificate = fs.readFileSync(cert);
    let secured = 0, disconnected;
    const closed = new Promise(resolve => { disconnected = resolve; });
    const options = await fixture(t, socket => {
      secured++;
      const timer = setInterval(() => socket.write('220-still waiting\r\n'), 5);
      socket.on('close', () => { clearInterval(timer); disconnected(); });
    }, callback => tls.createServer({ key: fs.readFileSync(key), cert: certificate }, callback));
    options.secure = true;
    options.tls = { ca: certificate, servername: 'localhost', rejectUnauthorized: true };
    await assert.rejects(sendDeadlineSmtp({ nodemailer, options, message, timeoutMs: 300 }),
      { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
    await closed;
    assert.equal(secured, 1);
    await assert.rejects(sendDeadlineSmtp({ nodemailer, options: { ...options,
      tls: { ...options.tls, servername: 'wrong.example.test' } }, message, timeoutMs: 1000 }),
      error => {
        assert.equal(error.code, 'ESOCKET');
        assert.match(error.message, /Hostname\/IP does not match certificate.s altnames/);
        return true;
      });
    assert.equal(secured, 1, 'wrong certificate never reaches SMTP greeting');
  });

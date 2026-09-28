import assert from 'node:assert/strict';
import net from 'node:net';
import { Meteor } from 'meteor/meteor';
import { Email, EmailInternals } from 'meteor/email';
import { installAdminMailTransport, installMailTransport } from '/server/lib/mailTransport';

// Exercise the actual Meteor send path and bundled Nodemailer. Fixtures only
// listen on loopback, never relay mail, and restore the global transport.
describe('SMTP total deadline in Meteor', function () {
  this.timeout(15000);
  for (const mode of ['admin', 'certificate override']) {
    it(`${mode} closes a continuously responding peer and permits a later send`, async function () {
      if (!Meteor.isAppTest) this.skip();
      const previous = Email.customTransport, sockets = new Set();
      let hold = true, closed = 0, received = 0;
      const server = net.createServer(socket => {
        sockets.add(socket);
        let buffer = '', data = false, timer;
        socket.on('error', () => {});
        socket.on('close', () => { clearInterval(timer); sockets.delete(socket); closed++; });
        socket.write('220 localhost test SMTP\r\n');
        socket.on('data', chunk => {
          buffer += chunk;
          let end;
          while ((end = buffer.indexOf('\r\n')) !== -1) {
            const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
            if (data) {
              if (line === '.') {
                data = false; received++;
                if (hold) timer = setInterval(() => socket.write('250-still processing\r\n'), 10);
                else socket.write('250 accepted\r\n');
              }
            } else if (line === 'DATA') { data = true; socket.write('354 send body\r\n'); }
            else socket.write('250 OK\r\n');
          }
        });
      });
      try {
        await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
        const port = server.address().port;
        const env = { MAIL_TOTAL_TIMEOUT_MS: '1000', MAIL_SOCKET_TIMEOUT_MS: '5000' };
        if (mode === 'admin') installAdminMailTransport({ Email, EmailInternals, env,
          mailServer: { enabled: true, service: 'SMTP', configurations: { SMTP: { host: '127.0.0.1', port } } } });
        else installMailTransport({ Email, EmailInternals,
          env: { ...env, MAIL_URL: `smtp://127.0.0.1:${port}/`, MAIL_TLS_SERVERNAME: 'localhost' } });
        const message = { from: 'sender@example.test', to: 'recipient@example.test', subject: 'total deadline', text: 'test only' };
        await assert.rejects(Email.sendAsync(message), { code: 'OUTBOUND_DEADLINE_EXCEEDED' });
        for (let i = 0; !closed && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 10));
        assert.equal(closed, 1);
        assert.equal(received, 1, 'server received the first body but never confirmed acceptance');
        hold = false;
        const result = await Email.sendAsync(message);
        assert.deepEqual(result.accepted, ['recipient@example.test']);
        assert.equal(received, 2);
      } finally {
        Email.customTransport = previous;
        for (const socket of sockets) socket.destroy();
        if (server.listening) await new Promise(resolve => server.close(resolve));
      }
    });
  }
});

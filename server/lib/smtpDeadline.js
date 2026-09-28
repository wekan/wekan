'use strict';
const net = require('node:net');
const dns = require('node:dns');
const { createOutboundDeadline } = require('./outboundDeadline');

function smtpTotalTimeout(env = process.env) {
  const value = Number(env.MAIL_TOTAL_TIMEOUT_MS || 120000);
  if (!Number.isSafeInteger(value) || value < 1000 || value > 300000) {
    throw new Error('MAIL_TOTAL_TIMEOUT_MS must be an integer from 1000 to 300000');
  }
  return value;
}

// Own one TCP socket per message. Nodemailer still performs SMTP, authentication
// and TLS (including implicit TLS on this supplied, initially plain connection).
// Pool.close() deliberately leaves busy connections alive, so it cannot provide
// cancellation. No other message shares the connection that we destroy here.
async function sendDeadlineSmtp({ nodemailer, options, message, timeoutMs,
  lookup = dns.lookup }) {
  const deadline = createOutboundDeadline(timeoutMs);
  let transport, socket, dnsTimer, connectTimer;
  try {
    transport = nodemailer.createTransport({ ...options, pool: false,
      getSocket(settings, callback) {
        let returned = false;
        const finish = (error, result) => {
          if (returned) return;
          returned = true;
          clearTimeout(dnsTimer);
          clearTimeout(connectTimer);
          callback(error && Object.assign(new Error(error.message), { code: error.code }), result);
        };
        try {
          deadline.assertActive();
          socket = new net.Socket();
          socket.on('error', error => finish(error));
          // Nodemailer annotates received Error objects with its own SMTP code.
          // Do not hand it the deadline's shared rejection object.
          deadline.watch({ destroy: () => socket.destroy() });
          const connectError = new Error('SMTP connection timed out');
          connectError.code = 'ETIMEDOUT';
          connectTimer = setTimeout(() => socket.destroy(connectError), settings.connectionTimeout || 30000);
          socket.connect({ host: settings.host || 'localhost',
            port: settings.port || (settings.secure ? 465 : 587),
            ...(settings.localAddress ? { localAddress: settings.localAddress } : {}),
            lookup(host, lookupOptions, done) {
              let completed = false;
              const resolve = (...args) => {
                if (completed) return;
                completed = true;
                clearTimeout(dnsTimer);
                try { deadline.assertActive(); } catch (error) { return done(Object.assign(new Error(error.message), { code: error.code })); }
                done(...args);
              };
              dnsTimer = setTimeout(() => {
                const error = new Error('SMTP DNS lookup timed out');
                error.code = 'EDNS';
                resolve(error);
              }, settings.dnsTimeout || 30000);
              lookup(host, lookupOptions, resolve);
            },
          }, () => {
            try {
              deadline.assertActive();
              socket.setKeepAlive(true);
              finish(null, { connection: socket, secured: false });
            } catch (error) { socket.destroy(error); finish(error); }
          });
        } catch (error) { finish(error); }
      },
    });
    return await deadline.wait(transport.sendMail(message));
  } catch (error) {
    deadline.cancel(error);
    throw error;
  } finally {
    clearTimeout(dnsTimer);
    clearTimeout(connectTimer);
    socket?.destroy();
    transport?.close?.();
    deadline.dispose();
  }
}

module.exports = { sendDeadlineSmtp, smtpTotalTimeout };

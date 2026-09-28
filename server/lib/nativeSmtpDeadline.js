'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const { sendDeadlineSmtp } = require('./smtpDeadline');
const installed = new WeakMap();

// Wrap marked SMTP URLs and the service profiles selected by Meteor. Leave
// non-SMTP transports and Meteor's customTransport routing alone.
function installNativeSmtpDeadline(nodemailer, policy) {
  if (installed.has(nodemailer)) { installed.set(nodemailer, policy); return; }
  const createTransport = nodemailer.createTransport.bind(nodemailer);
  nodemailer.createTransport = function (options, defaults) {
    const mailer = createTransport(options, defaults);
    const policy = installed.get(nodemailer);
    const nativeService = options && typeof options === 'object' && options.service && !options.getSocket;
    const marker = typeof options === 'string' && /^smtps?:/i.test(options)
      ? new URL(options).searchParams.get('wekanTotalTimeout') : null;
    if (marker === null && !nativeService) return mailer;
    const timeoutMs = marker === null ? policy.timeoutMs : Number(marker);
    const transport = mailer.transporter;
    if (!transport || !['SMTP', 'SMTP (pool)'].includes(transport.name)) {
      throw new Error('Unsupported native SMTP transport');
    }
    const sendMail = mailer.sendMail, context = new AsyncLocalStorage();
    // Keep the original Mailer, compile/stream plugins, defaults, DKIM and
    // metadata. Only its final SMTP send uses an isolated cancellable socket.
    transport.send = (mail, callback) => {
      try {
        const current = context.getStore();
        if (!current) throw new Error('Missing native SMTP deadline context');
        current.assertActive();
        current.mailer.transporter.mailer = mailer;
        current.mailer.transporter.send(mail, callback);
      } catch (error) { callback(error); }
    };
    mailer.sendMail = function (message, callback) {
      const result = sendDeadlineSmtp({ nodemailer: { createTransport },
        options: { ...transport.options, ...policy.timeouts }, timeoutMs,
        send: (isolated, assertActive) => context.run({ mailer: isolated, assertActive },
          () => new Promise((resolve, reject) => {
            sendMail.call(mailer, message, (error, info) => error ? reject(error) : resolve(info));
          })),
      });
      if (typeof callback === 'function') {
        result.then(info => callback(null, info), error => callback(error));
        return undefined;
      }
      return result;
    };
    return mailer;
  };
  installed.set(nodemailer, policy);
}
module.exports = { installNativeSmtpDeadline };

'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const scope = new AsyncLocalStorage();
function withSmtpCancellation(signal, work) {
  const parent = scope.getStore();
  return scope.run(parent && parent !== signal ? AbortSignal.any([parent, signal]) : signal, work);
}
function smtpCancellationSignal() { return scope.getStore(); }
module.exports = { withSmtpCancellation, smtpCancellationSignal };

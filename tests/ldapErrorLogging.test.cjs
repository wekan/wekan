'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../packages/wekan-ldap/server/logger.js'), 'utf8').replace(/^export .*;$/m, '');
function load(enabled) {
  const messages = [];
  const context = { Error, process: { env: { LDAP_LOG_ENABLED: String(enabled) } }, console: { log: text => messages.push(text) } };
  vm.createContext(context); vm.runInContext(source, context);
  return { context, messages };
}
const { context, messages } = load(true);
const error = new Error('certificate verification failed; password=secret-value');
error.code = 'CERT_HAS_EXPIRED'; error.password = 'hidden-password';
context.log_error(error);
assert.match(messages[0], /certificate verification failed/);
assert.match(messages[0], /CERT_HAS_EXPIRED/);
assert.doesNotMatch(messages[0], /secret-value|hidden-password/);
assert.doesNotMatch(messages[0], /^\[ERROR\] \{\}$/);
const invalid = new Error('Invalid credentials'); invalid.code = 49;
context.log_error(invalid);
assert.match(messages[1], /Invalid credentials/);
assert.match(messages[1], /49/);
const off = load(false); off.context.log_error(error); assert.equal(off.messages.length, 0);
console.log('ldapErrorLogging: bind/TLS errors stay actionable and redacted; disabled logging stays silent');

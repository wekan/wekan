'use strict';
// #6548: with LDAP logging on, a snap (production) shows what WeKan sends to
// and hears from the directory. Meteor's Log.debug never prints in production,
// so the details now go through the LDAP logger (LDAP_LOG_ENABLED), as
// objects rather than "[object Object]", with secrets redacted, and a failed
// bind says why. Run: node tests/ldapDiagnostics6548.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const ldap = fs.readFileSync(path.join(ROOT, 'packages/wekan-ldap/server/ldap.js'), 'utf8');
const loggerSrc = fs.readFileSync(path.join(ROOT, 'packages/wekan-ldap/server/logger.js'), 'utf8');

// Negative, file-wide: no detail is sent where production never prints it.
assert.ok(!/Log\.debug\(/.test(ldap), 'no Log.debug in ldap.js');
assert.ok(!/\$\{searchOptions\}/.test(ldap), 'no object interpolated into a string');
assert.match(ldap, /import \{ log_debug, log_info \} from '\.\/logger';/);
// A failed bind and a failed authentication say why.
assert.match(ldap, /async bind\(dn, password\) \{\s*try \{\s*await this\.client\.bind\(dn, password\);\s*\} catch \(error\) \{[\s\S]*?log_info\(`Bind failed for \$\{dn\}:`, error\);\s*throw error;/);
assert.match(ldap, /log_info\(`Not authenticated \$\{dn\}:`, error\);/);

// The logger, run as it is: prints only when enabled, objects as JSON, secrets redacted.
function loadLogger(enabled) {
  const lines = [];
  const code = loggerSrc.replace(/export \{[^}]*\};?\s*$/, 'module.exports = { log_debug, log_info };');
  const sandbox = { module: {}, process: { env: { LDAP_LOG_ENABLED: enabled } }, console: { log: line => lines.push(line) } };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  // An Error of the logger's own realm, as ldapts' errors are in WeKan.
  const makeError = (message, code) => vm.runInContext(`Object.assign(new Error(${JSON.stringify(message)}), { code: ${code} })`, sandbox);
  return { ...sandbox.module.exports, lines, makeError };
}
const on = loadLogger('true');
on.log_debug('searchOptions', { filter: '(sAMAccountName=alice)', scope: 'sub' });
assert.match(on.lines[0], /^\[DEBUG\] searchOptions \{/);
assert.match(on.lines[0], /"filter": "\(sAMAccountName=alice\)"/);
on.log_info('Bind failed for CN=svc,DC=example:', on.makeError('80090308: LdapErr: DSID-0C09044E, AcceptSecurityContext error, data 52e', 49));
assert.match(on.lines[1], /data 52e/, 'the directory\'s reason is visible');
assert.match(on.lines[1], /"code": "49"/);
on.log_debug('clientOptions', { url: 'ldap://dc', bindPassword: 'hunter2', tlsOptions: { ca: 'CERT' } });
assert.ok(!on.lines[2].includes('hunter2') && on.lines[2].includes('[REDACTED]'), 'secrets redacted');
// Negative: with LDAP logging off, nothing is printed.
const off = loadLogger('false');
off.log_debug('searchOptions', { filter: 'x' });
off.log_info('Bind failed', off.makeError('data 52e', 49));
assert.deepEqual(off.lines, []);
console.log('ldapDiagnostics6548: ok');

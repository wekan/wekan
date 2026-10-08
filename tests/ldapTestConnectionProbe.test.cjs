'use strict';
// Admin Panel / People / LDAP / Test connection without a service account
// (maintainer decision of 2026-10-08). ldapts opens its socket lazily, so the
// old test - connect, then bind only when LDAP_AUTHENTIFICATION is set -
// reported success for a host that does not even resolve. Now a test without
// credentials does an anonymous base search of LDAP_BASEDN and succeeds only
// when the directory answered.
//
// Run: node --test tests/ldapTestConnectionProbe.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const {connectionProbe, anonymousSearchOptions} = require('../packages/wekan-ldap/server/testConnectionProbe');

test('with a service account the bind is the proof', () => {
  assert.deepEqual(connectionProbe({Authentication: true, BaseDN: 'dc=example,dc=org'}), {kind: 'bind'});
  assert.deepEqual(connectionProbe({Authentication: true}), {kind: 'bind'});
});

test('without one, an anonymous base search of LDAP_BASEDN', () => {
  assert.deepEqual(connectionProbe({Authentication: false, BaseDN: ' dc=example,dc=org '}),
    {kind: 'anonymous-search', baseDN: 'dc=example,dc=org'});
  // 'true' as a string is not a configured service account: bindIfNecessary
  // compares with === true too, so the two must agree.
  assert.equal(connectionProbe({Authentication: 'true', BaseDN: 'o=x'}).kind, 'anonymous-search');
  assert.deepEqual(anonymousSearchOptions(),
    {scope: 'base', filter: '(objectClass=*)', attributes: ['1.1'], sizeLimit: 1},
    'the base entry only, and no attributes of anybody');
});

test('negative: no service account and no base DN is an error, never success', () => {
  for (const options of [{}, {BaseDN: ''}, {BaseDN: '   '}, {Authentication: false, BaseDN: undefined}, undefined]) {
    const probe = connectionProbe(options);
    assert.ok(probe.error, JSON.stringify(options));
    assert.equal(probe.kind, undefined);
  }
});

test('the method runs the probe before it can answer success', () => {
  const src = read('packages/wekan-ldap/server/testConnection.js');
  const probeAt = src.indexOf('connectionProbe(ldap.options)');
  const successAt = src.indexOf("message: 'Connection_success'");
  assert.ok(probeAt !== -1 && probeAt < successAt);
  assert.match(src, /if \(probe\.error\) \{\s*throw new Meteor\.Error\('LDAP_not_tested'/);
  assert.match(src, /await ldap\.client\.search\(probe\.baseDN, anonymousSearchOptions\(\)\)/);
  // The directory's own message reaches the Admin Panel as the reason.
  assert.match(src, /throw new Meteor\.Error\(error\.name \|\| error\.message, error\.message\)/);
});

// The reported case, against the library WeKan ships: no directory listening.
// The old flow did no operation at all here; the anonymous search fails.
const LDAPTS = path.join(ROOT, 'packages/wekan-ldap/.npm/package/node_modules/ldapts');
test('negative, real ldapts: the anonymous search fails when nothing answers', {skip: !fs.existsSync(LDAPTS) && 'ldapts not installed (run a Meteor build first)'}, async () => {
  const {Client} = require(LDAPTS);
  // A port that was just free: bind it, close it, connect to it.
  const port = await new Promise(resolve => {
    const server = net.createServer().listen(0, '127.0.0.1', () => {
      const {port: free} = server.address();
      server.close(() => resolve(free));
    });
  });
  const client = new Client({url: `ldap://127.0.0.1:${port}`, connectTimeout: 2000, timeout: 2000});
  await assert.rejects(client.search('dc=example,dc=org', anonymousSearchOptions()));
  await client.unbind().catch(() => {});
});

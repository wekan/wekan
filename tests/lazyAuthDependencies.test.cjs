'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const read = file => fs.readFileSync(file, 'utf8');
function executable(file) {
  const source = read(file);
  assert.doesNotMatch(source, /^import .*from ['"](?:ldapts|limax|@node-saml\/node-saml)['"]/m);
  return source.replace(/^import[\s\S]*?;\n/gm, '').replace(/export default class /g, 'class ').replace(/export (async )?function /g, '$1function ');
}
const ldapDir = '../packages/wekan-ldap/server/';
(async () => {
  const loads = [];
  let config = null;
  class SAML { constructor(options) { this.options = options; } }
  const saml = vm.createContext({
    require(name) { loads.push(name); assert.equal(name, '@node-saml/node-saml'); return { SAML }; },
    ...require('../packages/wekan-accounts-saml/responseReplay'),
    bodyParser: { urlencoded: () => () => {} },
    ServiceConfiguration: { configurations: { findOneAsync: async () => config } },
    WebApp: { connectHandlers: { use() {} } },
    Accounts: { registerLoginHandler() {} },
    Meteor: { methods() {}, absoluteUrl: suffix => `https://app.test/${suffix}` },
  });
  vm.runInContext(executable('packages/wekan-accounts-saml/saml_server.js'), saml);
  assert.deepEqual(loads, []);
  for (const value of [null, {}, { enabled: false, entryPoint: 'url', issuer: 'issuer', cert: 'cert' }]) {
    config = value;
    assert.equal((await saml.getSaml()).saml, null);
  }
  assert.deepEqual(loads, []);
  config = { enabled: true, entryPoint: 'https://idp.test/', issuer: 'issuer', cert: 'cert' };
  const first = await saml.getSaml();
  assert(first.saml instanceof SAML);
  assert.equal(first.saml.options.validateInResponseTo, 'always');
  assert.equal((await saml.getSaml()).saml, first.saml);
  assert.deepEqual(loads, ['@node-saml/node-saml']);
  config = { ...config, issuer: 'changed' };
  assert.equal((await saml.getSaml()).saml.options.issuer, 'changed');

  const ldapLoads = [];
  class Client { constructor(options) { this.options = options; } async startTLS(options) { this.tlsOptions = options; } }
  const ldap = vm.createContext({
    require(name) { ldapLoads.push(name); assert.equal(name, 'ldapts'); return { Client }; },
    process: { env: {} }, Log: { info() {}, warn() {} }, log_debug() {}, log_info() {},
    ...require(`${ldapDir}encryptionSetting`),
  });
  vm.runInContext(executable('packages/wekan-ldap/server/ldap.js') + '\nglobalThis.LDAP = LDAP;', ldap);
  ldap.LDAP.settings_get = key => ({ LDAP_HOST: 'localhost', LDAP_PORT: 389, LDAP_ENCRYPTION: 'starttls' })[key];
  const connection = new ldap.LDAP();
  assert.deepEqual(ldapLoads, []);
  await connection.connect();
  assert.deepEqual(ldapLoads, ['ldapts']);
  assert(connection.client instanceof Client);
  assert.equal(connection.client.options.url, 'ldap://localhost:389');
  assert.equal(connection.client.tlsOptions.rejectUnauthorized, true);

  const slugLoads = [];
  let slugEnabled = false;
  const sync = vm.createContext({
    require(name) { slugLoads.push(name); assert.equal(name, 'limax'); return part => part.toLowerCase(); },
    LDAP: { settings_get: () => slugEnabled },
    ...require(`${ldapDir}usernameSlug`), Meteor: { startup() {} },
  });
  vm.runInContext(executable('packages/wekan-ldap/server/sync.js'), sync);
  assert.deepEqual(slugLoads, []);
  assert.equal(sync.slug('John-Doe'), 'John-Doe');
  assert.deepEqual(slugLoads, []);
  slugEnabled = true;
  assert.equal(sync.slug('John-Doe'), 'john-doe');
  assert.deepEqual(slugLoads, ['limax']);
  console.log('lazyAuthDependencies: registration, disabled paths, first use, SAML caching and STARTTLS passed');
})().catch(error => { console.error(error); process.exitCode = 1; });

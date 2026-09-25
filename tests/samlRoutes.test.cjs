'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('packages/wekan-accounts-saml/saml_server.js', 'utf8')
  .replace(/^import .*;$/gm, '');
const routes = {}, methods = {};
let config = { enabled: true, provider: 'idp', entryPoint: 'https://idp.example/sso', issuer: 'wekan', cert: 'test', idpSLORedirectURL: 'https://idp.example/logout' };
let user = null, reject = false, validated = 0;
class SamlStub {
  generateServiceProviderMetadata() { return '<EntityDescriptor />'; }
  async validateRedirectAsync() { validated++; if (reject) throw Error('Invalid signature'); return { loggedOut: true }; }
  async validatePostResponseAsync() { return this.validateRedirectAsync(); }
  async getLogoutUrlAsync(profile) { assert.equal(profile.nameID, 'subject'); return 'https://idp.example/logout?signed=request'; }
}
vm.runInNewContext(source, {
  SAML: SamlStub, URL, console,
  bodyParser: { urlencoded: () => (_req, _res, next) => next() },
  ServiceConfiguration: { configurations: { findOneAsync: async () => config } },
  Assets: { getTextSync() { throw Error('not configured'); } },
  WebApp: { connectHandlers: { use: (route, handler) => { routes[route] = handler; } } },
  Accounts: { registerLoginHandler() {} },
  Meteor: { absoluteUrl: (suffix = '') => `https://wekan.example/${suffix}`,
    userAsync: async () => user, methods: value => Object.assign(methods, value) },
});
function request(route, method, url, body) {
  return new Promise(resolve => {
    const result = {};
    routes[route]({ method, url, body }, {
      writeHead(status, headers) { Object.assign(result, { status, headers }); },
      end(body) { resolve({ ...result, body }); },
    });
  });
}
(async () => {
  assert.equal((await request('/_saml/config', 'GET', '/idp')).status, 200);
  assert.equal((await request('/_saml/config', 'GET', '/other')).status, 404);
  assert.equal(await methods.getSamlLogoutUrl(), null);
  user = { authenticationMethod: 'password', services: { saml: { nameID: 'subject' } } };
  assert.equal(await methods.getSamlLogoutUrl(), null);
  user.authenticationMethod = 'saml';
  assert.match(await methods.getSamlLogoutUrl(), /^https:\/\/idp.example\/logout/);
  assert.equal((await request('/_saml/logout', 'GET', '/idp?SAMLResponse=valid')).status, 302);
  assert.equal(validated, 1);
  reject = true;
  assert.equal((await request('/_saml/logout', 'POST', '/idp', { SAMLResponse: 'invalid' })).status, 400);
  assert.equal((await request('/_saml/logout', 'GET', '/idp?SAMLRequest=unsolicited')).status, 400);
  assert.equal((await request('/_saml/logout', 'DELETE', '/idp')).status, 405);
  config = { ...config, enabled: false };
  assert.equal((await request('/_saml/config', 'GET', '/idp')).status, 404);
  assert.equal(await methods.getSamlLogoutUrl(), null);
  console.log('samlRoutes: metadata, logout delegation, authentication and rejection checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });

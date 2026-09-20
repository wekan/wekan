'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { validationUrl, callbackUrl } = require('../packages/wekan-accounts-cas/cas_url');
const root = 'https://boards.example/wekan/';
assert.equal(callbackUrl('/wekan/board?name=x', root), null);
const parsed = callbackUrl('/wekan/board?name=a%20b&ticket=ST%2B1&casToken=abc&x=~&x=2', root);
assert.deepEqual(parsed, {
  ticket: 'ST+1', credentialToken: 'abc',
  serviceUrl: 'https://boards.example/wekan/board?name=a%20b&casToken=abc&x=~&x=2',
});
assert.equal(callbackUrl('/wekan/?%74icket=ST-1', root).serviceUrl, root);
assert.throws(() => callbackUrl('//evil.example/?ticket=x', root), /Invalid CAS/);
assert.throws(() => callbackUrl('/?ticket=a&ticket=b', root), /Invalid CAS/);
assert.throws(() => callbackUrl('/?ticket=a&casToken=x&casToken=y', root), /Invalid CAS/);
assert.throws(() => validationUrl('http://cas.example/validate'), /https/);
assert.throws(() => validationUrl('not a URL'), /valid https/);
assert.equal(validationUrl('https://cas.example:8443/cas/serviceValidate').port, '8443');

// Exercise the actual CAS class and mounted middleware, with HTTPS stubbed so
// this test cannot contact an identity provider.
const source = fs.readFileSync('packages/wekan-accounts-cas/cas_server.js', 'utf8');
const { transformSync } = require('@swc/core');
const requests = [];
let handler;
const context = {
  module: { exports: {} }, exports: {}, console, process,
  Meteor: { absoluteUrl: () => root, settings: { cas: { popup: false } } },
  WebApp: { handlers: { use(fn) { handler = fn; } } },
  Accounts: { registerLoginHandler() {} },
  require(name) {
    if (name === 'https') return { get(url) { requests.push(url); } };
    if (name === './cas_url') return { validationUrl, callbackUrl };
    if (name === 'xml2js') return {};
    return require(name);
  },
};
const code = transformSync(source + '\nmodule.exports = { CAS };', { module: { type: 'commonjs' } }).code;
vm.runInNewContext(code, context);
const cas = new context.module.exports.CAS({ validate_url: 'https://cas.example:8443/cas/serviceValidate?tenant=one', service: parsed.serviceUrl });
cas.validate('ST+1', () => {});
assert.equal(requests[0].hostname, 'cas.example');
assert.equal(requests[0].port, '8443');
assert.equal(requests[0].searchParams.get('tenant'), 'one');
assert.equal(requests[0].searchParams.get('ticket'), 'ST+1');
assert.equal(requests[0].searchParams.get('service'), parsed.serviceUrl);
let next = 0;
handler({ url: '/wekan/' }, {}, () => next++);
assert.equal(next, 1);
const response = () => ({ writeHead(status, headers) { this.status = status; this.headers = headers; }, end(body) { this.body = body; } });
const clean = response();
handler({ url: '/wekan/?ticket=ST-1&name=a%20b' }, clean, () => assert.fail('callback fell through'));
assert.equal(clean.status, 302);
assert.equal(clean.headers.Location, 'https://boards.example/wekan/?name=a%20b');
const invalid = response();
handler({ url: '//evil.example/?ticket=x' }, invalid, () => assert.fail('invalid callback fell through'));
assert.equal(invalid.status, 400);
assert.equal(invalid.headers.Location, undefined);
console.log('CAS URLs: HTTPS/custom ports, exact service encoding, mounted callbacks and rejected ambiguity pass.');

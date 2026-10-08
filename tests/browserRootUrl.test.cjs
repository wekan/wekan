'use strict';

// #6752: with the snap's default ROOT_URL (http://127.0.0.1), Copy link gave
// http://127.0.0.1/... even when the browser opened WeKan by its real name.
// models/lib/browserRootUrl.js decides when the browser's own address is used
// instead; client/00-startup.js applies it to Meteor.absoluteUrl, which every
// copied link goes through.
// Run: node --test tests/browserRootUrl.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');
const { browserRootUrl, isLoopbackHost } = require('../models/lib/browserRootUrl');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the reported case: a loopback ROOT_URL, a browser on a real name', () => {
  assert.strictEqual(browserRootUrl('http://127.0.0.1', 'http://wekan.example.lan/b/abc/board'), 'http://wekan.example.lan');
  assert.strictEqual(browserRootUrl('http://127.0.0.1:3001/', 'https://wekan.example.com:8443/b/x'), 'https://wekan.example.com:8443');
  assert.strictEqual(browserRootUrl('http://localhost', 'http://192.168.1.20:3001/'), 'http://192.168.1.20:3001');
  assert.strictEqual(browserRootUrl('http://[::1]:3000', 'http://kanban/'), 'http://kanban');
});

test('a sub-URL install keeps its path', () => {
  assert.strictEqual(browserRootUrl('http://127.0.0.1/wekan', 'http://wekan.example.lan/wekan/b/abc'), 'http://wekan.example.lan/wekan');
  assert.strictEqual(browserRootUrl('http://127.0.0.1/wekan/', 'http://host/wekan/'), 'http://host/wekan');
});

test('negative: a real ROOT_URL always wins, even from another address', () => {
  assert.strictEqual(browserRootUrl('https://wekan.example.com', 'http://10.0.0.5:3000/'), null);
  assert.strictEqual(browserRootUrl('https://wekan.example.com/wekan', 'http://localhost:3000/'), null);
});

test('negative: a browser on loopback itself keeps ROOT_URL', () => {
  assert.strictEqual(browserRootUrl('http://127.0.0.1', 'http://localhost:3000/'), null);
  assert.strictEqual(browserRootUrl('http://localhost', 'http://127.0.0.1/'), null);
});

test('negative: junk and non-web pages change nothing', () => {
  assert.strictEqual(browserRootUrl('', 'http://host/'), null);
  assert.strictEqual(browserRootUrl('http://127.0.0.1', 'not a url'), null);
  assert.strictEqual(browserRootUrl('http://127.0.0.1', 'file:///index.html'), null);
});

test('loopback detection', () => {
  for (const h of ['localhost', 'LOCALHOST', 'app.localhost', '127.0.0.1', '127.1.2.3', '::1', '[::1]', '0.0.0.0']) {
    assert.ok(isLoopbackHost(h), h);
  }
  for (const h of ['127.example.com', 'wekan.example.com', '192.168.1.1', 'localhost.example.com', '']) {
    assert.ok(!isLoopbackHost(h), h);
  }
});

test('the client applies it to Meteor.absoluteUrl at startup, before anything builds a link', () => {
  const startup = read('client/00-startup.js');
  const at = startup.indexOf("require('/models/lib/browserRootUrl')");
  assert.ok(at !== -1, 'client/00-startup.js loads the rule');
  assert.match(startup, /browserRootUrl\(Meteor\.absoluteUrl\.defaultOptions\.rootUrl, window\.location\.href\)/);
  assert.match(startup, /if \(rootUrl\) Meteor\.absoluteUrl\.defaultOptions\.rootUrl = rootUrl;/);
  assert.ok(at < startup.indexOf('installAccountsCookiePaths('), 'before the first absoluteUrl use');
});

test('negative: the server never rewrites ROOT_URL from a request', () => {
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(__dirname, '..', dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(rel);
      else if (/\.js$/.test(e.name) && /browserRootUrl/.test(read(rel))) offenders.push(rel);
    }
  };
  walk('server');
  assert.deepStrictEqual(offenders, [], 'emails keep the configured ROOT_URL');
});

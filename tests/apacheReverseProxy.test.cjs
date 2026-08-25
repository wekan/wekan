'use strict';

// Regression coverage for #3001. The documented Apache configuration must be
// a reverse proxy only, never an Internet-facing forward proxy.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'docs/Platforms/Webserver/Apache.md'),
  'utf8',
);

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('every example virtual host explicitly disables forward proxying', () => {
  const virtualHosts = [...source.matchAll(/<VirtualHost[^>]*>([\s\S]*?)<\/VirtualHost>/g)];
  assert.strictEqual(virtualHosts.length, 2);
  for (const [, body] of virtualHosts) {
    assert.match(body, /^\s*ProxyRequests Off\s*$/m);
  }
});

test('the guide never enables or grants wildcard access to a forward proxy', () => {
  assert.doesNotMatch(source, /^\s*ProxyRequests On\s*$/m);
  assert.doesNotMatch(source, /<Proxy\s+["']?\*["']?>/i);
});

test('the ineffective forwarding-depth workaround is rejected', () => {
  assert.match(source, /`ProxyMaxForwards`[^\n]+does\s+not close an open proxy/);
});

console.log(`\napacheReverseProxy: ${passed} tests passed`);

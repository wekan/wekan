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

// The 2024 Confusion Attacks
// (https://blog.orange.tw/posts/2024-08-confusion-attacks-en/): a request
// capture in a RewriteRule or ProxyPassMatch target reaches files outside the
// DocumentRoot or another proxy target, Apache's <Files>/<Location> name can
// differ from what the backend serves, and AllowEncodedSlashes On sent NTLM
// hashes on Windows. Fixed in httpd 2.4.60.
const configs = [...source.matchAll(/```ApacheConf\n([\s\S]*?)```/g)].map(m => m[1]).join('\n');

test('the guide asks for httpd 2.4.60, which fixes the Confusion Attacks', () => {
  assert.match(source, /Apache httpd \*\*2\.4\.60 or newer\*\*/);
  assert.match(source, /CVE-2024-38472 to CVE-2024-38477 and CVE-2024-39573/);
});

test('both examples pass the WebSocket with upgrade=websocket on a fixed prefix', () => {
  const virtualHosts = [...source.matchAll(/<VirtualHost[^>]*>([\s\S]*?)<\/VirtualHost>/g)].map(m => m[1]);
  assert.match(virtualHosts[0], /^\s*ProxyPass\s+"\/" "http:\/\/127\.0\.0\.1:3001\/" upgrade=websocket$/m);
  // The sub-URL example's ProxyPassMatch looked for ^/sockjs while the
  // requests arrive at /wekan/sockjs, so its WebSocket never connected.
  assert.match(virtualHosts[1], /^\s*ProxyPass\s+"\/wekan" "http:\/\/127\.0\.0\.1:3001\/wekan" upgrade=websocket$/m);
  for (const body of virtualHosts) {
    // A ServerName is a host name; a path in it is not valid.
    assert.match(body, /^\s*ServerName [a-z0-9.-]+$/m);
  }
});

test('negative: no config builds a target from the request, or loosens path handling', () => {
  assert.doesNotMatch(configs, /^\s*ProxyPassMatch\b/m, 'a request capture in a proxy target');
  assert.doesNotMatch(configs, /^\s*RewriteRule\b/m, 'a request capture in a rewrite target');
  assert.doesNotMatch(configs, /\[[^\]\n]*\bP\b[^\]\n]*\]/, 'a RewriteRule proxy flag');
  assert.doesNotMatch(configs, /\$\d/, 'a backreference anywhere in a target');
  assert.doesNotMatch(configs, /^\s*AllowEncodedSlashes\s+(On|NoDecode)\b/mi);
  assert.doesNotMatch(configs, /^\s*MergeSlashes\s+Off\b/mi);
  assert.doesNotMatch(configs, /<Files\b|<FilesMatch\b/i, 'an Apache-side filename ACL');
  assert.doesNotMatch(configs, /<Directory\s+["']?\/["']?>[\s\S]*?Require all granted/i);
  assert.doesNotMatch(source, /^\s*NameVirtualHost\b/m, 'a directive 2.4 only warns about');
});

test('the guide says what not to add, and why', () => {
  const section = source.slice(source.indexOf('### c) What not to add'), source.indexOf('## 5) Enable your site'));
  for (const topic of [/RewriteRule.*ProxyPassMatch|ProxyPassMatch.*RewriteRule/s, /`%3F`/, /DocumentRoot/,
    /<Files>.*<Location>/s, /AllowEncodedSlashes/, /MergeSlashes/, /CVE-2024-38472/, /<Directory \/>/, /\/usr\/share/]) {
    assert.match(section, topic);
  }
});

console.log(`\napacheReverseProxy: ${passed} tests passed`);

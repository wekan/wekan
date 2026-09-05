'use strict';

// ScannerBleed (CVE-2026-68560 / GHSA-x3xm-pxrv-jg7p): an uploaded filename
// used to reach /bin/sh through the administrator's external scanner template.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'models/fileValidation.js'), 'utf8');
const fnSource = source.match(/function shellQuote\(value\) \{[\s\S]*?\n\}/);
assert.ok(fnSource, 'ScannerBleed shellQuote helper must exist');
const shellQuote = vm.runInNewContext(`(${fnSource[0]})`);

for (const attack of [
  '$(touch /tmp/scannerbleed)',
  'a`id`b.png',
  "x'; touch /tmp/scannerbleed; echo '",
  'x\\$(id).png',
]) {
  const quoted = shellQuote(attack);
  assert.ok(quoted.startsWith("'") && quoted.endsWith("'"));
  // Replacing the placeholder must leave the untrusted path in exactly one
  // POSIX-shell argument; embedded quotes use the standard '\'' boundary.
  assert.strictEqual(quoted, "'" + attack.replace(/'/g, "'\\''") + "'");
}

assert.match(source,
  /externalCommandLine \? 'injection\.shell' : 'file\.name'/,
  'a scanner-path attempt must be reported as ScannerBleed');
assert.match(source,
  /externalCommandLine\.replace\("\{file\}", shellQuote\(fileObj\.path\)\)/,
  'the scanner command must receive only the quoted path');
assert.doesNotMatch(source, /externalCommandLine\.replace\("\{file\}", fileObj\.path\)/,
  'the raw path must never return to the shell command');

console.log('scannerBleed: quoting, rejection, and Security reporting passed');

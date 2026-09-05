'use strict';

// Menu commands must return as soon as they finish. An acknowledgement-only
// read looks like a frozen release because it prints no prompt in build.sh,
// while cmd.exe's `pause` needlessly requires another key on Windows.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sh = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
const bat = fs.readFileSync(path.join(root, 'build.bat'), 'utf8');

assert.doesNotMatch(sh, /^\s*pause(?:\s|$)/m,
  'build.sh must return directly instead of waiting for Enter');
assert.doesNotMatch(sh, /function pause\(\)/,
  'build.sh must not retain an acknowledgement-pause helper');
assert.doesNotMatch(bat, /^\s*pause\s*$/mi,
  'build.bat must return directly instead of showing Press any key');

console.log('buildScriptsNoPause: 3 checks passed');

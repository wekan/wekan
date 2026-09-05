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

// A selected release command is a terminal action, like build/test/dev actions:
// once its child process ends, do not fall through and ask for another menu
// selection. build.sh already exits after releases_menu returns successfully.
assert.match(sh, /"Releases"\) if releases_menu; then exit 0; fi/,
  'build.sh must exit after a selected release command finishes');
assert.match(bat, /:rel_run_done\s*\r?\ngoto end/,
  'build.bat release scripts must exit after their child process finishes');
assert.match(bat, /call bash -c "!RC! !RA!"\s*\r?\ngoto end/,
  'build.bat inline release commands must exit after their child finishes');

// Reads from the terminal must identify what input they need. Internal reads
// fed by files, pipes or process substitution are intentionally excluded.
for (const line of sh.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!/(^|[;&|]\s*)read\s/.test(trimmed)) continue;
  if (/while .*read|<\s|read -r pid|read -d/.test(trimmed)) continue;
  assert.ok(/read\s+(?:-[^ ]+\s+)*-p\s+"[^"]+"/.test(trimmed) ||
      trimmed === 'read IPADDRESS' || trimmed === 'read PORT',
    `terminal read must have a visible question: ${trimmed}`);
}
for (const line of bat.split(/\r?\n/)) {
  const match = /^\s*set \/p\s+"([^"]*)"/i.exec(line);
  if (!match || /<\s*"/.test(line)) continue;
  assert.match(match[1], /=.+/,
    `set /p must display a visible question: ${line.trim()}`);
}

console.log('buildScriptsNoPause: prompt and exit checks passed');

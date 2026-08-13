'use strict';

// "No problems detected" on a site that is showing a month-old copy of itself.
// Run: node tests/snapProblemsDatabases.test.cjs
//
// #6583, comment 5282677837:
//
//   "sudo snap run wekan.database-compare  brings me to:
//    error: cannot find app "database-compare" in "wekan"
//    It seems, that database compare is not included in wekan 10.82"
//
// Two things went wrong before that message, and both are about an admin not
// being able to find out what their snap is doing:
//
//   1. `wekan.problems` said "No problems detected" while the wrong copy was
//      being served. That was TRUE of everything it checks - it reads the one
//      database WeKan is connected to, and every check inside it passed. The
//      question that mattered, WHICH of the two copies that is, was asked by
//      nothing. It is a section of the report now, read from the files, so it
//      answers even when the site is down.
//   2. The recovery commands are snap APPS, so they exist only in the revision
//      that ships them (v10.90). On an older one snapd says "cannot find app",
//      which does not say to refresh. The report says it.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const problems = read('snap-src/bin/wekan-problems');
const help = read('snap-src/bin/wekan-help');
const doc = read('docs/Platforms/FOSS/Container/Snap/Migration-to-FerretDB.md');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('snapProblemsDatabases:');

test('both scripts still parse', () => {
  for (const rel of ['snap-src/bin/wekan-problems', 'snap-src/bin/wekan-help']) {
    execFileSync('bash', ['-n', path.join(repoRoot, rel)]);
  }
});

test('the report reaches the database section at all', () => {
  // It used to `exec` the Node report, which REPLACES this process - anything
  // written after it could never run. The status is still the command's status.
  assert.ok(!/^exec env NODE_PATH/m.test(problems),
    'exec would make everything below it dead code');
  assert.ok(/rc=\$\?/.test(problems) && /exit \$rc/.test(problems),
    'and the exit status of the report is still what the command returns');
});

test('it says which copy is being served, and asks the files', () => {
  assert.ok(/Databases on this machine/.test(problems), 'the section exists');
  assert.ok(/database-role" --why/.test(problems),
    'through the one helper that decides it, so the report cannot disagree with '
    + 'what the snap actually does');
  assert.ok(/WiredTiger/.test(problems) && /files\/db"\/\*\.sqlite/.test(problems),
    'and both copies are looked for on disk, so this works with WeKan down');
});

test('two copies name the two commands', () => {
  const section = problems.slice(problems.indexOf('Databases on this machine'));
  assert.ok(/database-compare/.test(section) && /database-merge/.test(section));
  assert.ok(/changes nothing/.test(section),
    'compare first, and said to be safe - the admin reading this is nervous');
});

test('an older revision is told to refresh, not left with snapd\'s error', () => {
  const section = problems.slice(problems.indexOf('Databases on this machine'));
  assert.ok(/if \[ -r "\$SNAP\/bin\/database-compare" \]/.test(section),
    'whether this revision HAS them is a file test, not an assumption');
  const older = section.slice(section.indexOf('else'));
  assert.ok(/snap refresh/.test(older), 'and the answer to "cannot find app" is a refresh');
  assert.ok(/does not re-import|not import/.test(older),
    'with the reason refreshing is safe here, which is the actual worry');
});

test('it is a section, not a "problem" (negative)', () => {
  // Two copies is the normal state of a migrated snap. Reporting it as a fault
  // would make every migrated instance look broken, and the next real problem
  // would be lost in it.
  const section = problems.slice(problems.indexOf('Databases on this machine'));
  assert.ok(!/PROBLEM|FAIL|ERROR/.test(section), 'no fault is declared here');
  assert.ok(/That is normal after a/.test(section), 'it says so');
});

test('the sub-commands still print only what they were asked for (negative)', () => {
  // `wekan.problems migrations`, `login`, `cpu`, `broken-cards` are used in
  // scripts and pipes; appending a database report to those would break them.
  assert.ok(/case "\$\{1:-\}" in\n\s*''\|status\|databases\)/.test(problems),
    'the section is for the full overview only');
});

test('wekan.help lists the two commands', () => {
  assert.ok(/database-compare/.test(help) && /database-merge/.test(help),
    'the help is where an admin looks before searching GitHub');
  assert.ok(/INSERT only/.test(help), 'and merge says what it does to the data');
});

test('the documented command list matches the snap', () => {
  for (const app of ['database-compare', 'database-merge']) {
    assert.ok(new RegExp(`snap run wekan\\.${app}`).test(doc),
      `Migration-to-FerretDB.md must list ${app}`);
  }
  assert.ok(/v10\.90/.test(doc),
    'and say which release they arrived in, which is what "cannot find app" means');
});

console.log(`\nsnapProblemsDatabases: ${passed} tests passed`);

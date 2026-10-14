'use strict';

// CodeQL #586 (js/clear-text-logging): releases/live-tests/basecamp-import.mjs
// logged the Basecamp account id read from WEKAN_LIVE_BASECAMP_ACCOUNT. Live
// tests run with the maintainer's own logins and write a log under
// .tools/log/, so nothing that comes from a login - a token, a password, an
// account, an address, a project path - is ever part of a log line.
// Run: node tests/liveTestsNoSecretLogs.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(__dirname, '..', 'releases', 'live-tests');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.mjs'));
assert.ok(files.length >= 7, `the live tests are found (${files.length})`);

const offenders = [];
for (const file of files) {
  const src = fs.readFileSync(path.join(DIR, file), 'utf8');
  // Every name a value from the environment or a login lands in.
  const tainted = new Set(['credentials', 'token', 'password', 'username', 'account']);
  for (const m of src.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=[^;\n]*(?:process\.env|glabToken\(|credentials)/g)) tainted.add(m[1]);
  for (const m of src.matchAll(/(?:const|let)\s+\{([^}]+)\}\s*=[^;\n]*credentials/g)) {
    for (const name of m[1].split(',')) tainted.add(name.trim().split(':').pop().trim());
  }
  // Values derived from them in the same file.
  for (const m of src.matchAll(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=[^;\n]*\b(BASE|projectPath|account|url)\b/g)) tainted.add(m[1]);
  src.split('\n').forEach((line, i) => {
    const call = /\blog\((.*)\);?\s*$/.exec(line);
    if (!call) return;
    for (const name of tainted) {
      // Every metacharacter escaped, not only `$`: a name is an identifier
      // today, but the pattern must not depend on that.
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\$\\{[^}]*\\b${escaped}\\b`).test(call[1])) offenders.push(`${file}:${i + 1}: ${name}`);
    }
  });
}
assert.deepEqual(offenders, [], 'a live test logs something from a login or its configuration');
console.log(`  ok - ${files.length} live tests: no log line carries a login, an account, an address or a project`);

// Negative: the check sees the shape CodeQL reported.
const shape = "const account = (process.env.WEKAN_LIVE_BASECAMP_ACCOUNT || '').trim();\n  log(`basecamp-import: account ${account}`);";
assert.ok(/\blog\(.*\$\{account\}/.test(shape.split('\n')[1]));
console.log('\nliveTestsNoSecretLogs: all tests passed');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const users = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'users.js'),
  'utf8',
);
const hook = users.match(
  /Accounts\.onCreateUser\(async \(options, user\) => \{[\s\S]*?\n\}\);/,
);

assert.ok(hook, 'Accounts.onCreateUser hook exists');
assert.match(hook[0], /ReactiveCache\.getUser\(\s*\{\},\s*\{ fields: \{ _id: 1 \} \}/);
assert.match(hook[0], /user\.isAdmin = !existingUser/);
assert.doesNotMatch(hook[0], /getUsers\(\{\}, \{\}, true\)|countAsync\(\)|\.count\(\)/);

console.log('signupFirstUser: existence lookup avoids a full users count');

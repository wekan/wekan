'use strict';

// Regression for CodeQL alerts #450-#522. Test fixtures still need unique IDs:
// use the one CSPRNG-backed helper, never Math.random(), so future test code
// cannot accidentally normalize predictable generators near security flows.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'playwright');
const dbHelper = fs.readFileSync(path.join(root, 'helpers', 'db.js'), 'utf8');
assert.match(dbHelper, /function uniqueSuffix\(\)[\s\S]*crypto\.randomBytes\(8\)/,
  'the shared Playwright suffix must use Node crypto');
assert.match(dbHelper, /uid, uniqueSuffix/,
  'the secure suffix must be exported for every spec');

const files = [path.join(root, 'helpers', 'db.js')];
for (const name of fs.readdirSync(path.join(root, 'specs'))) {
  if (name.endsWith('.js')) files.push(path.join(root, 'specs', name));
}
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(source, /\bMath\.random\s*\(/,
    `${path.relative(path.join(__dirname, '..'), file)} uses predictable randomness`);
}

console.log(`ok - ${files.length} Playwright files use no Math.random()`);

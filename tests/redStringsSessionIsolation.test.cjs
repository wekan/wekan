'use strict';

// Regression guard for the all-browser run: every Red Strings test opens a new
// page, so it must also receive a new resume token instead of reusing the one
// created once for the whole describe block.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.join(__dirname, 'playwright/specs/27-red-strings.e2e.js'),
  'utf8',
);

assert.match(
  source,
  /test\.beforeEach\(\(\) => \{\s*owner\.token = db\.addResumeToken\(owner\.id\);\s*\}\);/,
  'every test must add its own resume token',
);
assert.doesNotMatch(
  source,
  /test\.beforeEach\(\(\) => \{\s*owner\.token = owner\.token;/,
  'a fresh page must not keep reusing the describe-wide token',
);

console.log('redStringsSessionIsolation: 2 tests passed');

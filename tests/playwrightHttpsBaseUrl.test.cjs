'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const setup = fs.readFileSync(
  path.join(__dirname, 'playwright', 'global-setup.js'),
  'utf8',
);

test('Playwright server readiness supports the HTTPS comparison target', () => {
  assert.match(setup, /require\('https'\)/);
  assert.match(setup, /new URL\(BASE_URL\)\.protocol === 'https:' \? https : http/);
  assert.match(setup, /transport\.get\(BASE_URL/);
  assert.doesNotMatch(setup, /http\.get\(BASE_URL/);
});

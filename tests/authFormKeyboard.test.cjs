'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const passwordTemplate = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'users', 'passwordInput.jade'),
  'utf8',
);

assert.doesNotMatch(
  passwordTemplate,
  /button\.password-toggle-btn[^\n]*tabindex="-1"/,
  'A05: reveal/hide is deliberately reachable in normal Tab order',
);
assert.doesNotMatch(
  passwordTemplate,
  /input\.password-field[^\n]*tabindex="-1"/,
  'password fields themselves must remain in the sequential Tab order',
);

console.log('Auth form keyboard regression checks passed.');

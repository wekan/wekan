'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const passwordTemplate = fs.readFileSync(
  path.join(__dirname, '..', 'client', 'components', 'users', 'passwordInput.jade'),
  'utf8',
);

assert.match(
  passwordTemplate,
  /button\.password-toggle-btn\.primary\(type="button" tabindex="-1"/,
  'show/hide password controls must stay out of the sequential Tab order',
);
assert.doesNotMatch(
  passwordTemplate,
  /input\.password-field[^\n]*tabindex="-1"/,
  'password fields themselves must remain in the sequential Tab order',
);

console.log('Auth form keyboard regression checks passed.');

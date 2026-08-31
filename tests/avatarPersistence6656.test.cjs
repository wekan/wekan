'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const avatars = fs.readFileSync('models/avatars.server.js', 'utf8');
assert.match(avatars, /await user\.setAvatarUrl\(universalUrl\)/,
  'upload completion must await the selected-avatar profile pointer');
assert.doesNotMatch(avatars, /\n\s*user\.setAvatarUrl\(universalUrl\)/,
  'the profile write must never be left floating');

console.log('avatarPersistence6656: awaited avatar selection passed');

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const client = fs.readFileSync('client/components/users/userHeader.js', 'utf8');
const server = fs.readFileSync('server/models/users.js', 'utf8');

assert.match(client, /Meteor\.call\('setOwnProfile', fullname, initials/);
assert.match(client, /Meteor\.call\('setLanguage', this\.tag/);
assert.doesNotMatch(client, /Users\.update\(Meteor\.userId\(\), \{[\s\S]{0,120}'profile\.(?:language|fullname|initials)'/,
  'profile fields must not use optimistic direct writes that the server rolls back');
assert.match(server, /async setOwnProfile\(fullname, initials\)[\s\S]*await Users\.updateAsync\(this\.userId/);
assert.match(server, /async setLanguage\(language\)[\s\S]*isLanguageSupported\(language\)[\s\S]*await Users\.updateAsync\(this\.userId/);
assert.match(server, /async setOwnProfile[\s\S]*if \(!this\.userId\) throw new Meteor\.Error\('not-logged-in'/,
  'logged-out profile changes must be rejected');

console.log('profilePersistence6655: persisted profile methods passed');

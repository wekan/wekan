'use strict';

// Guard: LDAPBleed hardening (maintainer decision 2026-10-02). The Docker
// image and the snap set LDAP_REJECT_UNAUTHORIZED=false, so an LDAPS or
// StartTLS server's certificate was never verified unless an admin changed it,
// and an EMPTY value disabled verification too. Verification is now the
// default everywhere, and only the exact value false turns it off.
// Run: node tests/ldapRejectUnauthorizedDefault.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

test('only an explicit false disables certificate verification', () => {
  const src = read('packages/wekan-ldap/server/ldap.js');
  assert.match(src, /reject_unauthorized\s*: this\.constructor\.settings_get\('LDAP_REJECT_UNAUTHORIZED'\) !== false,/);
  // settings_get turns the env string 'false' into false and leaves '' as ''.
  const decide = value => value !== false;
  assert.equal(decide(undefined), true);
  assert.equal(decide(''), true);
  assert.equal(decide(true), true);
  assert.equal(decide('no'), true);
  assert.equal(decide(false), false);
});

test('negative: no shipped default turns verification off', () => {
  for (const file of ['Dockerfile', '.devcontainer/Dockerfile']) {
    assert.match(read(file), /^\s*LDAP_REJECT_UNAUTHORIZED=true \\$/m, file);
  }
  assert.match(read('snap-src/bin/config'), /^DEFAULT_LDAP_REJECT_UNAUTHORIZED="true"$/m);
  assert.match(read('docs/Features/Login/LDAP.md'), /^\s*- LDAP_REJECT_UNAUTHORIZED=true$/m);
  // Example compose files may show the opt-out only commented out.
  const files = fs.readdirSync(ROOT).filter(f => /^docker-compose.*\.yml$/.test(f));
  for (const file of files) {
    for (const line of read(file).split('\n').filter(l => /LDAP_REJECT_UNAUTHORIZED=false/.test(l))) {
      assert.match(line, /^\s*#/, `${file}: ${line.trim()}`);
    }
  }
});

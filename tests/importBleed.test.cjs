'use strict';

// ImportBleed (GHSA-qp32-wqxw-wq3h): board imports reach direct database
// writes. Both DDP entry points must reject a logged-out connection before any
// feature lookup, parser or creator can run after mandatory type checks.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'models/import.js'), 'utf8');

function methodBody(name, nextMarker) {
  const start = source.indexOf(`async ${name}(`);
  assert.notEqual(start, -1, `${name} exists`);
  const end = source.indexOf(nextMarker, start);
  assert.notEqual(end, -1, `${name} has a bounded source section`);
  return source.slice(start, end);
}

const boardImport = methodBody('importBoard', '\n});\n\nMeteor.methods({');
const scopedImport = methodBody('importScoped', '\n});\n\nMeteor.methods({');

function firstGuard(body, name) {
  const guard = body.indexOf('if (!this.userId)');
  const firstAwait = body.indexOf('await assertImportEnabled()');
  const creators = [
    body.indexOf('new WekanCreator'),
    body.indexOf('new ScopedImporter'),
  ].filter(index => index !== -1);
  const checks = [...body.matchAll(/\bcheck\(/g)].map(match => match.index);
  assert.notEqual(guard, -1, `${name} explicitly requires an authenticated user`);
  assert.ok(checks.filter(index => index < guard).length >= 4,
    `${name} completes Meteor argument auditing before its authorization error`);
  assert.ok(firstAwait === -1 || guard < firstAwait,
    `${name} rejects anonymous callers before feature lookup`);
  assert.ok(creators.every(index => guard < index),
    `${name} rejects anonymous callers before writers can be constructed`);
  assert.match(body.slice(guard, guard + 220),
    /recordAnonymousImportAttempt[\s\S]*throw new Meteor\.Error\('error-notAuthorized'\)/,
    `${name} records the denial and returns the canonical authorization error`);
}

firstGuard(boardImport, 'importBoard');
firstGuard(scopedImport, 'importScoped');

assert.match(scopedImport, /const userId = this\.userId;/,
  'importScoped captures the authenticated method user before awaiting');
assert.match(scopedImport, /new ScopedImporter\(target, doc, \{[\s\S]{0,100}userId,/,
  'the scoped importer receives the authenticated method user');
assert.doesNotMatch(scopedImport, /userId: Meteor\.userId\(\)/,
  'the write actor does not depend on ambient identity after awaits');

assert.match(boardImport, /recordAnonymousImportAttempt\('importBoard', this\.connection\)/,
  'importBoard records the attributable anonymous denial');
assert.match(scopedImport, /recordAnonymousImportAttempt\('importScoped', this\.connection\)/,
  'importScoped records the attributable anonymous denial');

const categories = fs.readFileSync(
  path.join(__dirname, '..', 'models/lib/securityCategories.js'), 'utf8');
assert.match(categories,
  /'authn\.import':\s*\{ category: 'authn', bleed: 'ImportBleed', severity: 'critical', cwe: 'CWE-306' \}/,
  'Admin Panel Problems resolves denied imports to ImportBleed');

console.log('importBleed: authentication guards precede both import write paths');

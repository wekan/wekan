#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const {
  normalizeReviewableTemplatePackage,
  reviewHashForPackage,
} = require('../models/lib/templatePackage');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const validPackage = {
  schemaVersion: 1,
  packageId: 'phase5.reviewable.demo',
  title: 'Phase 5 reviewable template QA',
  description: 'A reviewed template package.',
  lists: [
    {
      title: 'Backlog',
      cards: [
        {
          title: 'Review source package',
          description: 'Confirm schema, hash and package id before install.',
        },
      ],
    },
    {
      title: 'Done',
      cards: [],
    },
  ],
};

test('valid packages normalize to a stable review hash', () => {
  const normalized = normalizeReviewableTemplatePackage(validPackage);
  assert.equal(normalized.valid, true);
  assert.equal(normalized.package.packageId, 'phase5.reviewable.demo');
  assert.equal(normalized.package.lists.length, 2);
  assert.equal(normalized.review.cardCount, 1);
  assert.match(normalized.review.hash, /^[a-f0-9]{64}$/);
  assert.equal(normalized.review.hash, reviewHashForPackage(normalized.package));
});

test('negative: unreviewed fields are rejected at every level', () => {
  assert.equal(
    normalizeReviewableTemplatePackage({ ...validPackage, script: 'alert(1)' }).valid,
    false,
  );
  assert.equal(
    normalizeReviewableTemplatePackage({
      ...validPackage,
      lists: [{ ...validPackage.lists[0], url: 'https://example.invalid' }],
    }).valid,
    false,
  );
  assert.equal(
    normalizeReviewableTemplatePackage({
      ...validPackage,
      lists: [{ title: 'Backlog', cards: [{ title: 'x', html: '<b>x</b>' }] }],
    }).valid,
    false,
  );
});

test('negative: missing identity, text or oversized payloads are rejected', () => {
  assert.equal(
    normalizeReviewableTemplatePackage({ ...validPackage, packageId: '../bad' }).valid,
    false,
  );
  assert.equal(
    normalizeReviewableTemplatePackage({ ...validPackage, title: '' }).valid,
    false,
  );
  assert.equal(
    normalizeReviewableTemplatePackage({ ...validPackage, lists: [] }).valid,
    false,
  );
  assert.equal(
    normalizeReviewableTemplatePackage({
      ...validPackage,
      lists: new Array(21).fill({ title: 'x', cards: [] }),
    }).valid,
    false,
  );
});

test('server installer is user-derived and has rollback protection', () => {
  const server = read('server/templatePackages.js');
  const imports = read('server/imports.js');
  const boards = read('models/boards.js');

  assert.match(imports, /import '\/server\/templatePackages'/);
  assert.match(server, /'templatePackages\.install'/);
  assert.match(server, /WebApp\.handlers\.post\('\/api\/template-packages\/install'/);
  assert.match(server, /if \(!req\.userId\)/);
  assert.match(server, /if \(!this\.userId\) throw new Meteor\.Error\('not-authorized'\)/);
  assert.match(server, /installPackage\(this\.userId, payload\)/);
  assert.match(server, /installPackage\(req\.userId, req\.body \|\| \{\}\)/);
  assert.doesNotMatch(server, /payload\.userId/);
  assert.match(server, /normalizeReviewableTemplatePackage\(payload\)/);
  assert.match(server, /rollbackTemplateInstall\(created\)/);
  assert.match(server, /type: 'template-board'/);
  assert.match(server, /type: 'cardType-linkedBoard'/);
  assert.match(server, /templatePackageReviewHash: normalized\.review\.hash/);
  assert.match(boards, /templatePackageReviewHash/);
  assert.match(boards, /templatePackageInstalledBy/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  not ok - ${name}`);
    console.error(error.stack || error);
  }
}

console.log(`\ntemplatePackage: ${tests.length - failed}/${tests.length} passed`);
if (failed) process.exitCode = 1;

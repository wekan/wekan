'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'imports/i18n/data/eu.i18n.json')));
for (const key of ['r-w-card-archived', 'r-w-card-unarchived', 'r-archive', 'r-unarchive', 'r-d-archive', 'r-d-unarchive']) {
  assert.doesNotMatch(d[key], /bilteg/i, key);
  assert.match(d[key], /artxibo/i, key);
}
assert.match(d['r-archive'], /artxibora$/);
assert.match(d['r-unarchive'], /^Artxibotik/);
assert.match(d['r-w-card-archived'], /denean$/);
assert.match(d['r-w-card-unarchived'], /denean$/);
const template = fs.readFileSync(path.join(root, 'client/components/rules/actions/boardActions.jade'), 'utf8');
assert.match(template, /option\(value="archive"\).*r-archive/);
assert.match(template, /option\(value="unarchive"\).*r-unarchive/);
console.log('basqueArchiveActions: archive terminology, directions and actual action options verified');

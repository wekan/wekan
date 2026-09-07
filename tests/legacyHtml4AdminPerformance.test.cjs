'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pages = fs.readFileSync(path.resolve(__dirname,
  '../server/lib/legacyHtml4Pages.js'), 'utf8');
const jade = fs.readFileSync(path.resolve(__dirname,
  '../client/components/settings/adminProblems.jade'), 'utf8');
const en = JSON.parse(fs.readFileSync(path.resolve(__dirname,
  '../imports/i18n/data/en.i18n.json'), 'utf8'));

console.log('legacyHtml4AdminPerformance:');
const at = pages.indexOf('async function adminProblemsPerformancePage');
assert.ok(at >= 0, 'the dedicated Performance controller must exist');
const body = pages.slice(at, at + 2600);
assert.match(body, /path !== '\/admin\/problems\/performance'/);
assert.match(body, /fields: \{ isAdmin: 1 \}/);
assert.match(body, /!user\?\.isAdmin/);
for (const key of ['features-performance', 'cards-loading',
  'cards-loading-description']) {
  assert.ok(body.includes(`'${key}'`), `${key} must render in HTML4`);
  assert.ok(jade.includes(`'${key}'`), `${key} must render in HTML5`);
  assert.equal(typeof en[key], 'string', `${key} must be translatable`);
}
assert.match(body, /adminProblemsNavigation\(translate\)/);
assert.match(body, /error-notAuthorized/);
console.log('  ok - shared translated content and Global Admin isolation');

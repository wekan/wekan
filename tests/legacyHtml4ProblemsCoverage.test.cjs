'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ADMIN_PAGES } = require('../models/lib/adminUrls');

const source = fs.readFileSync(path.resolve(__dirname,
  '../server/lib/legacyHtml4Pages.js'), 'utf8');
const expected = Object.keys(ADMIN_PAGES.problems.panes).sort();
const exact = [...source.matchAll(
  /path !== '\/admin\/problems\/([^']+)'/g,
)].map(match => match[1]);
const mapAt = source.indexOf('const PROBLEM_REPORT_STREAMS = {');
const mapEnd = source.indexOf('\n};', mapAt);
const reportMap = source.slice(mapAt, mapEnd);
const sharedReports = [...reportMap.matchAll(/\n  '?(\w[\w-]*)'?:\s*'/g)]
  .map(match => match[1]);
const covered = [...new Set([...exact, ...sharedReports])].sort();

assert.deepEqual(covered, expected,
  'every registered Problems slug needs an exact or shared dedicated controller');
for (const slug of expected) {
  assert.ok(source.includes(`/admin/problems/${slug}`)
    || reportMap.includes(`${slug}:`) || reportMap.includes(`'${slug}':`),
  `${slug} must not fall through to the generic baseline`);
}
console.log(`legacyHtml4ProblemsCoverage: ${covered.length}/${expected.length} panes covered`);

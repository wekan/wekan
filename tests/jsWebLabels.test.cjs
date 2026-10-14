'use strict';

// #1040: LibreJS license information for the browser bundle - a JS Web Labels
// page at /jslicense.html, linked from every page with rel="jslicense".
// Run: node tests/jsWebLabels.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { LICENSES, bundleScripts, renderJsWebLabels, jsLicenseLink } = require('../models/lib/jsWebLabels.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const manifest = [
  { type: 'js', where: 'client', url: '/abc123.js?meteor_js_resource=true' },
  { type: 'css', where: 'client', url: '/def.css?meteor_css_resource=true' },
  { type: 'js', where: 'internal', url: '/internal.js' },
  { type: 'asset', url: '/x.png' },
];

// Positive.
assert.deepEqual(bundleScripts(manifest), ['/abc123.js?meteor_js_resource=true'], 'scripts only, never css, assets or internal');
assert.deepEqual(bundleScripts(manifest, '/wekan/'), ['/wekan/abc123.js?meteor_js_resource=true'], 'under ROOT_URL\'s path');
const page = renderJsWebLabels({ scripts: bundleScripts(manifest), version: '12.43' });
assert.match(page, /<table id="jslicense-labels1">/, 'the id LibreJS looks for');
assert.match(page, /<tr><td><a href="\/abc123\.js\?meteor_js_resource=true">abc123\.js<\/a><\/td><td>/);
assert.match(page, /<a href="http:\/\/www\.jclark\.com\/xml\/copying\.txt">Expat<\/a>/, 'MIT under LibreJS\'s own name for it');
assert.match(page, /<td><a href="https:\/\/github\.com\/wekan\/wekan\/tree\/v12\.43">/, 'the source at the running version');
assert.equal(jsLicenseLink('/wekan/'), '<link rel="jslicense" href="/wekan/jslicense.html">');
assert.equal(jsLicenseLink(), '<link rel="jslicense" href="/jslicense.html">');
// Every license the bundle's packages use is a free one LibreJS knows.
assert.deepEqual(LICENSES.map(l => l.name), ['Expat', 'Apache-2.0', 'Modified BSD', 'FreeBSD', 'ISC']);
console.log('  ok - a labels table of the served scripts, linked from the page');

// Negative.
assert.doesNotMatch(renderJsWebLabels({ scripts: ['/a.js?x="><script>alert(1)</script>'] }), /<script\b/i, 'escaped: no script tag, in any letter case');
assert.match(renderJsWebLabels({ scripts: [] }), /<table id="jslicense-labels1">\n\n<\/table>/, 'no scripts, no rows');
assert.deepEqual(bundleScripts(null), []);
assert.match(renderJsWebLabels({ scripts: ['/a.js'] }), /href="https:\/\/github\.com\/wekan\/wekan"/, 'no version: the repository');
console.log('  ok - escaped, and empty or unknown input yields no rows');

// Wiring.
const server = read('server/jsWebLabels.js');
assert.match(server, /WebApp\.handlers\.get\('\/jslicense\.html'/);
assert.match(server, /\['web\.browser', 'web\.browser\.legacy'\]/);
assert.match(read('server/imports.js'), /import '\/server\/jsWebLabels';/);
assert.match(read('server/lib/customHeadRender.js'), /if \(!\/rel=\["'\]\?jslicense\/i\.test\(data\.head\)\) \{[\s\S]{0,300}jsLicenseLink\(/,
  'every page links it, before the custom-head early return');
const head = read('server/lib/customHeadRender.js');
assert.ok(head.indexOf('jsLicenseLink(') < head.indexOf('if (!setting || !setting.customHeadEnabled)'), 'also when custom head is off');
console.log('  ok - served, imported and linked from every page');

console.log('\njsWebLabels: all tests passed');

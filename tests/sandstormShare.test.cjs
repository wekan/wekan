'use strict';

// #1188: on Sandstorm, Copy card URL opens Sandstorm's Share Access dialog for
// the card, whose link opens the grain at that card.
// Run: node tests/sandstormShare.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { sandstormSharePath, startSharingMessage } = require('../models/lib/sandstormShare.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Positive: the card's path, in the only shape the shell accepts.
assert.deepEqual(startSharingMessage('https://abc123.sandstorm.example/b/sandstorm/libreboard/CARD1'),
  { startSharing: { pathname: '/b/sandstorm/libreboard/CARD1' } });
assert.equal(sandstormSharePath('/b/sandstorm/libreboard/CARD1?x=1#y'), '/b/sandstorm/libreboard/CARD1', 'path only');
console.log('  ok - the card\'s path, as { startSharing: { pathname } }');

// Negative.
for (const bad of ['', null, 'http://[bad', 'https://h/b/../../etc']) {
  const r = startSharingMessage(bad);
  assert.ok(r === null || !r.startSharing.pathname.includes('..'), String(bad));
}
assert.equal(sandstormSharePath(''), '/', 'an empty address is the grain root, never an error');
assert.deepEqual(Object.keys(startSharingMessage('/b/x').startSharing), ['pathname'], 'nothing the shell would reject');
console.log('  ok - nothing but a clean path is sent to the shell');

// Wiring: the shell message, and both copy buttons use it on Sandstorm only.
const sandstorm = read('sandstorm.js');
assert.match(sandstorm, /window\.sandstormShareUrl = function\(url\) \{[\s\S]{0,300}window\.parent\.postMessage\(message, '\*'\);\s*return true;/);
assert.ok(sandstorm.indexOf('window.sandstormShareUrl') > sandstorm.indexOf('if (isSandstorm && Meteor.isClient) {'), 'defined only inside a grain');
const details = read('client/components/cards/cardDetails.js');
const copy = details.slice(details.indexOf("'click .js-copy-card-link'(event, tpl) {"), details.indexOf("// #1172: star/unstar"));
assert.match(copy, /if \(Meteor\.settings\?\.public\?\.sandstorm && typeof window\.sandstormShareUrl === 'function' &&\s*\n\s*window\.sandstormShareUrl\(url\)\) return;\s*\n\s*Utils\.showCopied/,
  'on Sandstorm it shares; elsewhere it copies as before');
assert.match(details, /'click \.js-copy-card-link-to-clipboard'\(event, tpl\) \{[\s\S]{0,300}window\.sandstormShareUrl\(document\.getElementById\('cardURL'\)\.value\)\) return;/);
console.log('  ok - both copy buttons share through Sandstorm in a grain, copy elsewhere');

console.log('\nsandstormShare: all tests passed');

'use strict';

// #1273: a Member Settings switch keeps the "#label" / "@member" text in a
// new card's title when the label or member is picked from the composer's
// autocomplete. Off (the default) keeps today's behaviour: the text goes,
// and the card gets the label or member.
// Run: node tests/titleTags.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { titleTagText } = require('../models/lib/titleTags.js');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// Positive: with the switch on, the typed text stays.
assert.equal(titleTagText('member', { username: 'xet7' }, true), '@xet7 ');
assert.equal(titleTagText('label', { name: 'Bug', color: 'red' }, true), '#Bug ');
assert.equal(titleTagText('label', { name: '', color: 'red' }, true), '#red ', 'an unnamed label is its colour');
console.log('  ok - on: the #label / @member text stays in the title');

// Negative: off (or unset) removes it, as before; nothing odd is ever inserted.
for (const keep of [false, undefined, null, 0]) {
  assert.equal(titleTagText('member', { username: 'xet7' }, keep), '');
  assert.equal(titleTagText('label', { name: 'Bug' }, keep), '');
}
assert.equal(titleTagText('member', {}, true), '', 'no "@undefined"');
assert.equal(titleTagText('label', {}, true), '', 'no "#undefined"');
assert.equal(titleTagText('label', null, true), '');
assert.equal(titleTagText('other', { name: 'x' }, true), '');
console.log('  ok - off, or with nothing to name, nothing is left in the title');

// The issue's own example, typed and picked the way the composer replaces the
// term being completed: "fix menu for #PROJECT by @member" became "fix menu
// for by" - it stays whole with the switch on.
function typeAndPick(keep) {
  let title = 'fix menu for #PRO';
  title = title.replace(/#PRO$/, titleTagText('label', { name: 'PROJECT' }, keep));
  title += 'by @mem';
  title = title.replace(/@mem$/, titleTagText('member', { username: 'member' }, keep));
  return title.trim().replace(/\s+/g, ' ');
}
assert.equal(typeAndPick(true), 'fix menu for #PROJECT by @member');
assert.equal(typeAndPick(false), 'fix menu for by', 'the reported behaviour, still the default');
console.log('  ok - the reporter\'s example');

// Wiring: both composer strategies use it, with the user's setting.
const body = read('client/components/lists/listBody.js');
assert.match(body, /toggleValueInReactiveArray\(tpl\.members, user\._id\);[\s\S]{0,200}return titleTagText\('member', user, keepTitleTags\(\)\);/);
assert.match(body, /toggleValueInReactiveArray\(tpl\.labels, label\._id\);[\s\S]{0,200}return titleTagText\('label', label, keepTitleTags\(\)\);/);
assert.match(body, /const keepTitleTags = \(\) => \{[\s\S]{0,200}user\.hasKeepTitleTags\(\)/);
console.log('  ok - both autocomplete strategies follow the setting');

// The setting: schema, helper, an own-profile toggle, and the UI (UI guard).
const users = read('models/users.js');
assert.match(users, /'profile\.keepTitleTags': \{[\s\S]{0,400}type: Boolean,\s*optional: true,/);
assert.match(users, /hasKeepTitleTags\(\) \{\s*return !!\(\(this\.profile \|\| \{\}\)\.keepTitleTags\);/);
const server = read('server/models/users.js');
assert.match(server, /async toggleKeepTitleTags\(\) \{\s*if \(!this\.userId\) throw[\s\S]{0,300}Users\.updateAsync\(this\.userId, \{ \$set: \{ 'profile\.keepTitleTags':/,
  'only the signed-in user\'s own profile is changed');
const jade = read('client/components/users/userHeader.jade');
assert.match(jade, /a\.js-toggle-keep-title-tags\(title="\{\{_ 'keep-title-tags-description'\}\}"\)[\s\S]{0,120}\{\{_ 'keep-title-tags'\}\}\s*\n\s*if isKeepTitleTags\s*\n\s*i\.fa\.fa-check/);
const js = read('client/components/users/userHeader.js');
assert.match(js, /'click \.js-toggle-keep-title-tags'\(\) \{\s*if \(ReactiveCache\.getCurrentUser\(\)\) Meteor\.call\('toggleKeepTitleTags'\);/);
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
assert.ok(en['keep-title-tags'] && en['keep-title-tags-description']);
console.log('  ok - Member Settings has the switch, off by default');

console.log('\ntitleTags: all tests passed');

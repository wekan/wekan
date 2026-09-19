'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loginRedirectTarget } = require('../imports/lib/loginRedirectTarget');

for (const target of ['/my-cards', '/wekan/b/board/title?label=green#card']) {
  assert.equal(loginRedirectTarget(true, target), target);
  assert.equal(loginRedirectTarget(false, target), '/');
}
for (const target of [null, undefined, '', 'https://elsewhere.invalid', '//elsewhere.invalid', '/\\elsewhere.invalid', 'my-cards']) {
  assert.equal(loginRedirectTarget(true, target), '/');
}

const router = fs.readFileSync(path.join(__dirname, '../config/router.js'), 'utf8');
const start = router.indexOf('function ensureSignedInUnlessSandstorm(');
const code = router.slice(start, router.indexOf('\nFlowRouter.triggers.exit(', start));
for (const isSandstorm of [false, true]) {
  let userId = null;
  const calls = [];
  const guard = vm.runInNewContext(code + '\nensureSignedInUnlessSandstorm', {
    isSandstorm,
    Meteor: { userId: () => userId },
    AccountsTemplates: {
      setPrevPath: value => calls.push(['remember', value]),
      ensureSignedIn: context => calls.push(['guard', context.path]),
    },
  });
  guard({ path: '/my-cards' });
  assert.deepEqual(calls, isSandstorm ? [] : [['remember', '/my-cards'], ['guard', '/my-cards']]);
  calls.length = 0;
  userId = 'signed-in';
  guard({ path: '/my-cards' });
  assert.deepEqual(calls, isSandstorm ? [] : [['guard', '/my-cards']]);
}
console.log('  ok - initial protected paths survive sign-in without accepting external redirect targets or bypassing the guard');

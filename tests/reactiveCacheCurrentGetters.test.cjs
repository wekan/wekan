'use strict';

// Regression for #6507: fresh install (no Settings document, Meteor.user() briefly
// null) — the Admin panel would not open, the title bar sometimes failed to load /
// showed "You are not authorized", and the console looped
//   Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'remove')
// through a Tracker computation (a Blaze removed-DomRange teardown crash).
//
// Root cause: ReactiveCacheClient.getCurrentSetting() / getCurrentUser() guarded the
// DataCache with `!this.__x || !this.__x.get()`, so whenever the value was FALSY they
// rebuilt the DataCache — and its Tracker.autorun — on EVERY reactive read, churning
// computations app-wide and racing Blaze teardown. Every other getter creates its
// DataCache once (`if (!this.__x)`). This guards that the two current-* getters do the
// same, and models the churn behaviourally.
// Run: node tests/reactiveCacheCurrentGetters.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const src = fs.readFileSync(path.join(__dirname, '..', 'imports', 'reactiveCache.js'), 'utf8');

check('getCurrentSetting/getCurrentUser create the DataCache ONCE (no recreate-on-falsy)', () => {
  assert.ok(/getCurrentSetting\(\) \{[\s\S]*?if \(!this\.__currentSetting\) \{/.test(src),
    'getCurrentSetting must guard on !this.__currentSetting only');
  assert.ok(/getCurrentUser\(\) \{[\s\S]*?if \(!this\.__currentUser\) \{/.test(src),
    'getCurrentUser must guard on !this.__currentUser only');
});

check('the recreate-on-falsy anti-pattern is gone from the whole file', () => {
  assert.ok(!/\|\| !this\.__[a-zA-Z]+\.get\(\)/.test(src),
    'no getter may rebuild its DataCache when the cached value is falsy');
});

// Behavioural model: the guard must build the cache once even when the value stays
// falsy across many reactive reads (the fresh-install case).
check('the guard builds the cache once across many falsy reads (models the fix)', () => {
  function makeGetter() {
    const self = { __currentSetting: undefined, builds: 0 };
    const build = () => { self.builds += 1; return { get: () => undefined /* no Settings doc */ }; };
    return () => {
      // The FIXED guard:
      if (!self.__currentSetting) self.__currentSetting = build();
      return { self, value: self.__currentSetting.get() };
    };
  }
  const get = makeGetter();
  let last;
  for (let i = 0; i < 25; i++) last = get();
  assert.strictEqual(last.self.builds, 1, 'the DataCache is built exactly once, not once per read');

  // And the OLD guard would have rebuilt every time — proving the bug shape.
  let oldBuilds = 0, cache;
  for (let i = 0; i < 25; i++) {
    if (!cache || !cache.get()) { oldBuilds += 1; cache = { get: () => undefined }; }
    cache.get();
  }
  assert.strictEqual(oldBuilds, 25, 'sanity: the old `|| !get()` guard rebuilt on every read');
});

console.log(`\nreactiveCacheCurrentGetters: ${passed} checks passed`);

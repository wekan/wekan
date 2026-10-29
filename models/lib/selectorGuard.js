'use strict';

// A query given a Promise where an id or a selector belongs. findOneAsync()
// reads a Promise as the empty selector {}, so it answers with the FIRST
// document of the collection: #6831 invited a new user by email, missed the
// `await` on Meteor 3's async Accounts.createUser, and added the first user -
// the site administrator - to the board in their place. A missing `await`
// fails here, loudly, instead of quietly picking a document nobody asked for.

function isThenable(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function') &&
    typeof value.then === 'function';
}

function assertNotPromiseSelector(selector, where) {
  if (isThenable(selector)) {
    throw new Error(`${where}: a Promise was given as the id or selector - a missing await`);
  }
}

// Every get* of an object (ReactiveCacheServer, whose getters are all async)
// checks its first argument, and rejects as the getter itself would.
function guardSelectorMethods(api) {
  for (const name of Object.keys(api)) {
    const method = api[name];
    if (!/^get[A-Z]/.test(name) || typeof method !== 'function') continue;
    api[name] = function guardedGetter(selector, ...rest) {
      try {
        assertNotPromiseSelector(selector, `ReactiveCache.${name}`);
      } catch (e) {
        return Promise.reject(e);
      }
      return method.call(this, selector, ...rest);
    };
  }
  return api;
}

module.exports = { isThenable, assertNotPromiseSelector, guardSelectorMethods };

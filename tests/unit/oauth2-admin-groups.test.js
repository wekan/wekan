// Standalone Node unit test for the #5876 OAuth2 admin-groups pure function.
//
// Exercises oauth2AdminStatusFromGroups(groups) from
// packages/wekan-oidc/loginHandler.js, which reads process.env.OAUTH2_ADMIN_GROUPS
// (comma- and/or whitespace-separated) and returns { manage, isAdmin }.
//
// No test framework: plain Node + assert. Run with:
//   node tests/unit/oauth2-admin-groups.test.js

const assert = require('assert');
const oidc = require('../../packages/wekan-oidc/loginHandler.js');

assert.strictEqual(
  typeof oidc.oauth2AdminStatusFromGroups,
  'function',
  'oauth2AdminStatusFromGroups must be exported as a function',
);

const ENV = 'OAUTH2_ADMIN_GROUPS';

// Run `fn` with OAUTH2_ADMIN_GROUPS set to `value` (or deleted when value is
// undefined), restoring the previous env value afterwards no matter what.
function withEnv(value, fn) {
  const had = Object.prototype.hasOwnProperty.call(process.env, ENV);
  const previous = process.env[ENV];
  try {
    if (value === undefined) {
      delete process.env[ENV];
    } else {
      process.env[ENV] = value;
    }
    fn();
  } finally {
    if (had) {
      process.env[ENV] = previous;
    } else {
      delete process.env[ENV];
    }
  }
}

function check(label, envValue, groups, expected) {
  withEnv(envValue, () => {
    const actual = oidc.oauth2AdminStatusFromGroups(groups);
    assert.deepStrictEqual(actual, expected, label);
  });
  console.log('OK ' + label);
}

// a) env unset -> {manage:false, isAdmin:false}; groups irrelevant.
check('a env unset (groups present)', undefined, ['admins'], { manage: false, isAdmin: false });
check('a env unset (no groups)', undefined, [], { manage: false, isAdmin: false });

// b) env "" (empty) -> {manage:false, isAdmin:false}.
check('b env empty string', '', ['admins'], { manage: false, isAdmin: false });

// c) env "admins" + groups ["admins"] -> {manage:true, isAdmin:true}.
check('c admins matches', 'admins', ['admins'], { manage: true, isAdmin: true });

// d) env "admins" + groups ["users"] -> {manage:true, isAdmin:false}.
check('d no match', 'admins', ['users'], { manage: true, isAdmin: false });

// e) env "wekan:admins, ops" (comma+space) + groups [{displayName:"ops"}] -> {manage:true, isAdmin:true}.
check('e comma+space, object group', 'wekan:admins, ops', [{ displayName: 'ops' }], { manage: true, isAdmin: true });

// f) env "admins" + groups [] -> {manage:true, isAdmin:false}.
check('f empty groups array', 'admins', [], { manage: true, isAdmin: false });

// g) env "admins" + groups null/undefined (non-array) -> {manage:true, isAdmin:false}.
check('g groups null', 'admins', null, { manage: true, isAdmin: false });
check('g groups undefined', 'admins', undefined, { manage: true, isAdmin: false });

console.log('ALL OAUTH2_ADMIN_GROUPS UNIT TESTS PASSED');

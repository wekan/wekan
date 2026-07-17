'use strict';

// Plain-Node regression guard (no Meteor) for issue #4560: "User Profile is
// reset when changing the authentication method from LDAP to OIDC".
//
// Root cause: the OIDC branch of Accounts.onCreateUser in
// server/models/users.js links an incoming OIDC login to an existing account
// (matched by verified email, opt-in via OAUTH2_MERGE_EXISTING_USERS) by
// deleting the existing document and re-inserting it. It used to do
//
//     existingUser.profile = user.profile;
//
// i.e. REPLACE the stored profile with the freshly built OIDC-only profile
// ({ initials, fullname, boardView }). That wiped profile.avatarUrl,
// profile.templatesBoardId and the template swimlane ids, language and every
// other preference — the reporter's "templates and avatars disappeared".
// The fix merges instead of replacing: all existing profile fields survive,
// missing fields are filled from the OIDC-derived profile, and the provider's
// fullname/initials are applied only when the provider actually asserted a
// fullname (otherwise fullname is just a fallback to the username and must
// not overwrite a real stored name).
//
// The onCreateUser hook is extracted from server/models/users.js source text
// and exercised BEHAVIORALLY in a VM with stubs, so this fails if the merge
// regresses, not only if the code is reworded.
// Run: node tests/oidcProfileMerge.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(
  path.join(__dirname, '..', 'server', 'models', 'users.js'),
  'utf8',
);

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// --- Extract the Accounts.onCreateUser(...) registration --------------------
// The hook is a top-level statement; the first `});` at column 0 after its
// start closes it (all nested closers inside the hook are indented).
const m = src.match(/Accounts\.onCreateUser\(async \(options, user\) => \{[\s\S]*?\n\}\);/);
assert.ok(m, 'Accounts.onCreateUser hook found in server/models/users.js');

function buildHook(env) {
  let hook = null;
  const removed = [];
  const context = {
    process: { env: Object.assign({}, env) },
    console,
    Accounts: {
      onCreateUser(fn) {
        hook = fn;
      },
    },
    Meteor: {
      Error: class MeteorError extends Error {
        constructor(code, reason) {
          super(reason || code);
          this.error = code;
        }
      },
      users: {
        removeAsync: async selector => {
          removed.push(selector);
        },
      },
      setTimeout: () => {},
    },
    Random: { id: () => 'rndid12345678' },
    // Free variable used by the hook for brand-new users; a no-op keeps the
    // creation path exercisable without an Orgs collection.
    autoAddOrgsByDomain: async () => {},
    ReactiveCache: null, // set per scenario below
    InvitationCodes: { removeAsync: async () => {} },
  };
  vm.createContext(context);
  vm.runInContext(m[0], context);
  assert.ok(hook, 'hook registered');
  return { hook, context, removed };
}

// The existing (LDAP-era) account whose profile must survive the switch.
function ldapUser() {
  return {
    _id: 'ldapUserId1',
    username: 'jdoe',
    emails: [{ address: 'jdoe@example.com', verified: true }],
    authenticationMethod: 'ldap',
    services: { ldap: { id: 'jdoe' } },
    profile: {
      fullname: 'John Doe',
      initials: 'JD',
      avatarUrl: 'http://wekan.example/cfs/files/avatars/abc123',
      templatesBoardId: 'tplBoard111',
      cardTemplatesSwimlaneId: 'swimCard222',
      listTemplatesSwimlaneId: 'swimList333',
      boardTemplatesSwimlaneId: 'swimBoard444',
      language: 'ja',
      boardView: 'board-view-lists',
      hiddenSystemMessages: true,
    },
  };
}

// The incoming user document accounts-base hands to onCreateUser for an OIDC
// login (fresh _id, services.oidc from the OAuth handler).
function oidcIncoming(overrides) {
  return {
    _id: 'freshOidcId1',
    createdAt: new Date(),
    services: {
      oidc: Object.assign(
        {
          id: 'oidc-sub-1',
          username: 'jdoe@example.com',
          fullname: 'John A. Doe',
          email: 'jdoe@example.com',
          email_verified: true,
        },
        overrides || {},
      ),
    },
  };
}

function stubCaches(context, existing) {
  context.ReactiveCache = {
    getUsers: async () => ({ countAsync: async () => 5 }),
    getUser: async selector => {
      if (
        existing &&
        selector &&
        selector['emails.address'] === existing.emails[0].address
      ) {
        return existing;
      }
      return undefined;
    },
    getCurrentSetting: async () => ({ disableRegistration: false }),
    getInvitationCode: async () => undefined,
  };
}

const MERGE_ENV = { OAUTH2_MERGE_EXISTING_USERS: 'true' };

// --- POSITIVE: the #4560 scenario -------------------------------------------

test('LDAP -> OIDC merge keeps avatar, templates board/swimlanes and preferences (#4560)', async () => {
  const { hook, context, removed } = buildHook(MERGE_ENV);
  const existing = ldapUser();
  stubCaches(context, existing);

  const result = await hook({}, oidcIncoming());

  // Linked, not duplicated: the existing account (same _id) is re-inserted.
  assert.strictEqual(result._id, 'ldapUserId1');
  assert.ok(
    removed.some(sel => sel && sel._id === 'ldapUserId1'),
    'existing doc removed before re-insert (delete+reinsert keeps the _id)',
  );

  // The heart of #4560: profile is UPDATED, not REPLACED.
  assert.strictEqual(result.profile.avatarUrl, 'http://wekan.example/cfs/files/avatars/abc123');
  assert.strictEqual(result.profile.templatesBoardId, 'tplBoard111');
  assert.strictEqual(result.profile.cardTemplatesSwimlaneId, 'swimCard222');
  assert.strictEqual(result.profile.listTemplatesSwimlaneId, 'swimList333');
  assert.strictEqual(result.profile.boardTemplatesSwimlaneId, 'swimBoard444');
  assert.strictEqual(result.profile.language, 'ja');
  assert.strictEqual(result.profile.boardView, 'board-view-lists');
  assert.strictEqual(result.profile.hiddenSystemMessages, true);

  // Provider asserted a fullname: identity fields follow the provider.
  assert.strictEqual(result.profile.fullname, 'John A. Doe');
  assert.strictEqual(result.profile.initials, 'JAD');

  // Auth switch itself still happens.
  assert.strictEqual(result.authenticationMethod, 'oauth2');
  assert.strictEqual(result.services.oidc.id, 'oidc-sub-1');
  assert.strictEqual(result.services.ldap.id, 'jdoe', 'old service data untouched');
});

test('provider without a fullname claim does not clobber the stored fullname', async () => {
  const { hook, context } = buildHook(MERGE_ENV);
  const existing = ldapUser();
  stubCaches(context, existing);

  const result = await hook({}, oidcIncoming({ fullname: undefined }));

  // Without the guard, user.profile.fullname falls back to the username
  // ('jdoe@example.com') and used to overwrite the real name.
  assert.strictEqual(result.profile.fullname, 'John Doe');
  assert.strictEqual(result.profile.initials, 'JD');
  assert.strictEqual(result.profile.avatarUrl, 'http://wekan.example/cfs/files/avatars/abc123');
});

test('existing account without any profile gets the OIDC-derived one (no crash)', async () => {
  const { hook, context } = buildHook(MERGE_ENV);
  const existing = ldapUser();
  delete existing.profile;
  stubCaches(context, existing);

  const result = await hook({}, oidcIncoming());

  assert.strictEqual(result.profile.fullname, 'John A. Doe');
  assert.strictEqual(result.profile.initials, 'JAD');
  assert.strictEqual(result.profile.boardView, 'board-view-swimlanes');
});

// --- NEGATIVE: fail-closed linking rules stay intact -------------------------

test('NEGATIVE: merge stays rejected when OAUTH2_MERGE_EXISTING_USERS is unset', async () => {
  const { hook, context } = buildHook({});
  const existing = ldapUser();
  stubCaches(context, existing);

  await assert.rejects(
    () => hook({}, oidcIncoming()),
    err => err.error === 'oidc-email-already-in-use',
  );
});

test('NEGATIVE: merge stays rejected when the provider did not verify the email', async () => {
  const { hook, context } = buildHook(MERGE_ENV);
  const existing = ldapUser();
  stubCaches(context, existing);

  await assert.rejects(
    () => hook({}, oidcIncoming({ email_verified: false })),
    err => err.error === 'oidc-email-already-in-use',
  );
});

test('NEGATIVE: brand-new OIDC user (no matching account) still gets a fresh profile', async () => {
  const { hook, context } = buildHook(MERGE_ENV);
  stubCaches(context, null);

  const incoming = oidcIncoming();
  const result = await hook({}, incoming);

  assert.strictEqual(result._id, 'freshOidcId1');
  assert.strictEqual(result.authenticationMethod, 'oauth2');
  assert.strictEqual(result.profile.fullname, 'John A. Doe');
  assert.strictEqual(result.profile.boardView, 'board-view-swimlanes');
});

// --- Structural guard: the wholesale replacement must not come back ----------

test('source no longer contains the wholesale `existingUser.profile = user.profile`', () => {
  assert.ok(
    !/existingUser\.profile\s*=\s*user\.profile\s*;/.test(src),
    'profile must be merged, not replaced',
  );
});

// --- Runner ------------------------------------------------------------------

(async () => {
  let passed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed += 1;
      console.log('  ok -', name);
    } catch (err) {
      console.error('  FAIL -', name);
      console.error(err);
      process.exit(1);
    }
  }
  console.log(`\nAll ${passed} oidcProfileMerge tests passed.`);
})();

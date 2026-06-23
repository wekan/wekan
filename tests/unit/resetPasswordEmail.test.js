// Standalone Node unit test for the #5706 password-reset 500 hardening.
//
// Issue #5706: "Internal Server Error (500) when attempting to reset a password".
// Forgot Password -> enter a registered email -> "Email reset link" returned a
// raw HTTP 500 instead of sending the email / showing success.
//
// Two failure modes are guarded by server/lib/resetPasswordEmail.js and exercised
// here, with positive AND negative cases:
//   1. The email-template builder must never throw (missing user helpers, missing
//      profile fields, or a translation function that throws must all degrade
//      gracefully) -- otherwise the exception becomes an HTTP 500.
//   2. The reset-password email send must convert any failure (e.g. SMTP not
//      configured, mail server error) into a clean catchable error rather than an
//      unhandled exception (HTTP 500).
//
// No test framework: plain Node + assert. Run with:
//   node tests/unit/resetPasswordEmail.test.js

const assert = require('assert');
const {
  safeUserName,
  safeUserLanguage,
  buildEmailTemplateField,
  wrapSendResetPasswordEmail,
} = require('../../server/lib/resetPasswordEmail');

let passed = 0;
// Collect tests (sync or async) and run them sequentially below so that a
// rejected async assertion deterministically fails the process.
const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// A simple TAPi18n.__-style stub: returns "<lang>:<key>:<user>" so we can assert
// the language and resolved user name flowed through.
function fakeTranslate(key, params, language) {
  return `${language}:${key}:${params.user}`;
}

// ---------------------------------------------------------------------------
// safeUserName / safeUserLanguage
// ---------------------------------------------------------------------------

// POSITIVE: a fully transformed Wekan user uses its getName()/getLanguage().
test('safeUserName uses getName() when available', () => {
  const user = { getName: () => 'Ada Lovelace' };
  assert.strictEqual(safeUserName(user), 'Ada Lovelace');
});

test('safeUserLanguage uses getLanguage() when available', () => {
  const user = { getLanguage: () => 'fr' };
  assert.strictEqual(safeUserLanguage(user), 'fr');
});

// NEGATIVE: an un-transformed user (no helpers) falls back to profile/username.
test('safeUserName falls back to profile.fullname without helpers', () => {
  const user = { profile: { fullname: 'Grace Hopper' }, username: 'grace' };
  assert.strictEqual(safeUserName(user), 'Grace Hopper');
});

test('safeUserName falls back to username when no fullname', () => {
  const user = { profile: {}, username: 'grace' };
  assert.strictEqual(safeUserName(user), 'grace');
});

// NEGATIVE: user with no profile at all (the field is genuinely missing).
test('safeUserName handles a user with no profile', () => {
  const user = { username: 'noprofile' };
  assert.strictEqual(safeUserName(user), 'noprofile');
});

test('safeUserLanguage defaults to en without helpers or profile', () => {
  assert.strictEqual(safeUserLanguage({ username: 'noprofile' }), 'en');
});

// NEGATIVE: null / undefined user must not throw.
test('safeUserName tolerates null/undefined user', () => {
  assert.strictEqual(safeUserName(null), '');
  assert.strictEqual(safeUserName(undefined), '');
});

test('safeUserLanguage tolerates null/undefined user', () => {
  assert.strictEqual(safeUserLanguage(null), 'en');
  assert.strictEqual(safeUserLanguage(undefined), 'en');
});

// NEGATIVE: a helper that itself throws must not propagate.
test('safeUserName swallows a throwing getName()', () => {
  const user = {
    getName() {
      throw new Error('boom');
    },
    profile: { fullname: 'Fallback Name' },
    username: 'u',
  };
  assert.strictEqual(safeUserName(user), 'Fallback Name');
});

test('safeUserLanguage swallows a throwing getLanguage()', () => {
  const user = {
    getLanguage() {
      throw new Error('boom');
    },
    profile: { language: 'de' },
  };
  assert.strictEqual(safeUserLanguage(user), 'de');
});

// ---------------------------------------------------------------------------
// buildEmailTemplateField -- the reset-password email-template builder
// ---------------------------------------------------------------------------

// POSITIVE: valid registered user + working translator returns a real value and
// does NOT throw (the forgotPassword happy path that must not 500).
test('buildEmailTemplateField returns a localized value for a valid user', () => {
  const user = { getName: () => 'Ada', getLanguage: () => 'fi' };
  const out = buildEmailTemplateField(
    'resetPassword-text',
    fakeTranslate,
    'wekan.example',
    user,
    'https://wekan.example/reset/TOKEN',
  );
  assert.strictEqual(out, 'fi:email-resetPassword-text:Ada');
});

// NEGATIVE: user missing profile fields still produces a value, never throws.
test('buildEmailTemplateField tolerates a user with missing profile fields', () => {
  const user = { username: 'bare' }; // no getName/getLanguage, no profile
  const out = buildEmailTemplateField(
    'resetPassword-subject',
    fakeTranslate,
    'wekan.example',
    user,
    'https://wekan.example/reset/TOKEN',
  );
  // language defaults to 'en', user resolves to the username.
  assert.strictEqual(out, 'en:email-resetPassword-subject:bare');
});

// NEGATIVE: a translation function that throws must degrade to a safe fallback,
// not bubble up as a 500. This mirrors the original #5875-class email build
// crashes.
test('buildEmailTemplateField falls back when the translator throws', () => {
  const throwingTranslate = () => {
    throw new Error('language bundle not loaded');
  };
  const out = buildEmailTemplateField(
    'resetPassword-text',
    throwingTranslate,
    'wekan.example',
    { getName: () => 'Ada', getLanguage: () => 'fi' },
    'https://wekan.example/reset/TOKEN',
  );
  assert.strictEqual(out, 'resetPassword-text: https://wekan.example/reset/TOKEN');
});

// NEGATIVE: null user (no document at all) must not throw.
test('buildEmailTemplateField tolerates a null user', () => {
  const out = buildEmailTemplateField(
    'resetPassword-text',
    fakeTranslate,
    'wekan.example',
    null,
    'https://wekan.example/reset/TOKEN',
  );
  assert.strictEqual(out, 'en:email-resetPassword-text:');
});

// ---------------------------------------------------------------------------
// wrapSendResetPasswordEmail -- the email send error funnel
// ---------------------------------------------------------------------------

// A makeError stub mimicking new Meteor.Error(code, message).
function makeError(code, message) {
  const err = new Error(message);
  err.error = code;
  err.isMeteorError = true;
  return err;
}

// POSITIVE: when the underlying send succeeds, the wrapper is transparent and
// returns the original result.
test('wrapSendResetPasswordEmail returns the result on success', async () => {
  const wrapped = wrapSendResetPasswordEmail(async () => ({ email: 'a@b.c' }), makeError);
  const result = await wrapped('userId', 'a@b.c');
  assert.deepStrictEqual(result, { email: 'a@b.c' });
});

// NEGATIVE: when the underlying send throws (e.g. SMTP not configured -> the
// Meteor email package throws "You have not provided a mail URL"), the wrapper
// converts it into a clean 'email-fail' error instead of an unhandled 500.
test('wrapSendResetPasswordEmail converts a send failure into email-fail', async () => {
  const wrapped = wrapSendResetPasswordEmail(async () => {
    throw new Error('You have not provided a mail URL.');
  }, makeError);

  let caught;
  try {
    await wrapped('userId', 'a@b.c');
  } catch (e) {
    caught = e;
  }
  assert.ok(caught, 'expected the wrapper to throw');
  assert.strictEqual(caught.error, 'email-fail');
  assert.strictEqual(caught.isMeteorError, true);
  assert.strictEqual(caught.message, 'You have not provided a mail URL.');
});

// NEGATIVE: a thrown value with no message still yields a helpful default.
test('wrapSendResetPasswordEmail uses a default message when none is given', async () => {
  const wrapped = wrapSendResetPasswordEmail(async () => {
    throw new Error();
  }, makeError);

  let caught;
  try {
    await wrapped('userId', 'a@b.c');
  } catch (e) {
    caught = e;
  }
  assert.ok(caught);
  assert.strictEqual(caught.error, 'email-fail');
  assert.strictEqual(caught.message, 'Failed to send the password reset email.');
});

// Edge: a non-function (e.g. send not defined yet) is returned unchanged.
test('wrapSendResetPasswordEmail passes through a non-function', () => {
  assert.strictEqual(wrapSendResetPasswordEmail(undefined, makeError), undefined);
});

// ---------------------------------------------------------------------------

(async () => {
  for (const { name, fn } of tests) {
    await fn();
    passed += 1;
    console.log('  ok -', name);
  }
  console.log(`\n${passed} resetPasswordEmail tests passed.`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});

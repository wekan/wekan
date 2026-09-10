/**
 * Test: #6620 "[unhandledRejection] WeKan keeps running: TypeError:
 * string.toLowerCase is not a function"
 *
 * Two call sites crashed the server with an unhandled promise rejection when
 * a value that is not guaranteed to be a string reached .toLowerCase():
 *
 * 1. server/models/users.js Users.after.insert() - with disableRegistration
 *    on, every new user is checked against the invitation code. It read
 *    `doc.authenticationMethod.toLowerCase()`, but authenticationMethod is
 *    only ever set for oauth2/ldap signups (see ATCreateUserServer /
 *    enrollOrLoginOidcUser) - a normal password/invitation signup leaves it
 *    `undefined`, so EVERY such signup with disableRegistration on crashed
 *    this hook. `doc.emails[0].address` was also read unguarded.
 * 2. server/notifications/email.js buffered-digest send - read
 *    `user.emails[0].address.toLowerCase()` unguarded; a user with an empty
 *    emails array (e.g. a header-auth/LDAP account) crashed the timer
 *    callback as an unhandledRejection instead of just skipping the send.
 *
 * Both are re-implemented here as small pure functions (faithful copies of
 * the guarded production logic) so they can be exercised without a running
 * Meteor server/database - following the convention of the other
 * tests/*.test.cjs files in this suite.
 */

const assert = require('assert');

// --- Faithful copy of the guarded branch in Users.after.insert() ----------
// Returns the invitation-code lookup query that would be used, given a
// user doc that has just been inserted.
function invitationCodeQueryFor(doc) {
  if (
    typeof doc.authenticationMethod === 'string' &&
    doc.authenticationMethod.toLowerCase() === 'oauth2'
  ) {
    const oauthEmail = doc.emails && doc.emails[0] && doc.emails[0].address;
    return {
      email: typeof oauthEmail === 'string' ? oauthEmail.toLowerCase() : '',
      valid: true,
    };
  }
  return { code: doc.profile && doc.profile.icode, valid: true };
}

// --- Faithful copy of the guarded email-address lookup in the buffered
// notification-email sender in server/notifications/email.js -------------
function digestRecipientAddress(user) {
  const emailAddress = user.emails && user.emails[0] && user.emails[0].address;
  if (typeof emailAddress !== 'string' || !emailAddress) {
    return null;
  }
  return emailAddress.toLowerCase();
}

// --- Tests ------------------------------------------------------------

// 1. A normal password/invitation signup has no authenticationMethod set -
// this must not throw and must fall through to the invitation-code branch.
{
  assert.doesNotThrow(() => invitationCodeQueryFor({ profile: { icode: 'ABC123' } }));
  const query = invitationCodeQueryFor({ profile: { icode: 'ABC123' } });
  assert.deepStrictEqual(query, { code: 'ABC123', valid: true });
}

// 2. authenticationMethod as null/a number must not throw either.
{
  assert.doesNotThrow(() => invitationCodeQueryFor({ authenticationMethod: null, profile: {} }));
  assert.doesNotThrow(() => invitationCodeQueryFor({ authenticationMethod: 42, profile: {} }));
}

// 3. An oauth2 signup with a normal email still lower-cases it for lookup.
{
  const query = invitationCodeQueryFor({
    authenticationMethod: 'OAuth2',
    emails: [{ address: 'User@Example.com' }],
  });
  assert.deepStrictEqual(query, { email: 'user@example.com', valid: true });
}

// 4. An oauth2 signup with no emails array does not throw and yields an
// empty (never-matching) lookup rather than crashing.
{
  assert.doesNotThrow(() => invitationCodeQueryFor({ authenticationMethod: 'oauth2', emails: [] }));
  const query = invitationCodeQueryFor({ authenticationMethod: 'oauth2', emails: [] });
  assert.deepStrictEqual(query, { email: '', valid: true });

  assert.doesNotThrow(() => invitationCodeQueryFor({ authenticationMethod: 'oauth2' }));
}

// 5. digestRecipientAddress: normal user, one lower-cased address.
{
  assert.strictEqual(
    digestRecipientAddress({ emails: [{ address: 'Foo@Bar.com' }] }),
    'foo@bar.com',
  );
}

// 6. digestRecipientAddress: no emails array / empty array / undefined
// address all resolve to null instead of throwing.
{
  assert.doesNotThrow(() => digestRecipientAddress({ emails: [] }));
  assert.strictEqual(digestRecipientAddress({ emails: [] }), null);
  assert.strictEqual(digestRecipientAddress({}), null);
  assert.strictEqual(digestRecipientAddress({ emails: [{}] }), null);
  assert.strictEqual(digestRecipientAddress({ emails: [{ address: 42 }] }), null);
}

console.log('ok - registration invitation-code / digest email guard tests passed');

import { Meteor } from 'meteor/meteor';
import { currentPasswordPolicy } from '/server/lib/passwordPolicy';
import { recordShortPasswordLogin, markShortPasswordFixed } from '/server/lib/shortPasswordLogins';

// PASSWORD_MIN_LENGTH, for a password shorter than the minimum: it still signs
// in. Every such sign-in is listed in Admin Panel / Problems / Password length
// (server/lib/shortPasswordLogins.js), and with PASSWORD_MIN_LENGTH_ENFORCE the
// account is asked to change it before anything else
// (client/components/users/passwordChangeRequired.*).
//
// Only the browser knows how long the password it just typed is - Meteor sends
// it as a hash - so the browser compares it with the minimum after signing in
// and says "it was short", never the length. That is the account holder's own
// browser reporting on the account's behalf; it cannot weaken anything, only
// ask for a stronger password. Changing the password ends the requirement and
// marks the report fixed.
//
// ANY change of one's own password - Member Settings, the forced change, a
// reset link - signs EVERY session of the account out, this one too, so the
// next sign-in is with the new password everywhere. Meteor's changePassword
// keeps the changing session, and a reset signs the reset in; neither is
// kept. An administrator's Set password already signs everything out.
//
// LDAP, OAuth2, OIDC, SAML, CAS and Sandstorm accounts are never asked: their
// password is their provider's (models/lib/twoFactorRequirement.js).
const { signsInWithPassword } = require('/models/lib/twoFactorRequirement');

const FIELDS = { authenticationMethod: 1, 'services.password': 1, passwordChangeRequired: 1 };

async function requirementFor(userId) {
  const { minLength, enforce } = currentPasswordPolicy();
  if (!userId || !enforce) return { required: false, minLength };
  const user = await Meteor.users.findOneAsync(userId, { fields: FIELDS });
  return { required: signsInWithPassword(user) && user.passwordChangeRequired === true, minLength };
}

Meteor.methods({
  // The browser that signed in found its password shorter than the minimum:
  // reported always, and a change required only when the minimum is enforced.
  // Answers whether the change is required.
  async reportShortPasswordLogin() {
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const user = await Meteor.users.findOneAsync(this.userId, { fields: { ...FIELDS, username: 1 } });
    if (!signsInWithPassword(user)) return false;
    await recordShortPasswordLogin(user, this.connection);
    if (!currentPasswordPolicy().enforce) return false;
    await Meteor.users.updateAsync(this.userId, { $set: { passwordChangeRequired: true } });
    return true;
  },

  // What the browser shows after signing in: the change only, or the app.
  async getPasswordChangeRequirement() {
    return requirementFor(this.userId);
  },
});

// Every login token gone: each session of the account is closed by the
// server, and only the new password signs in again.
export async function endPasswordChangeRequirement(userId, { signOut, fixed = true }) {
  if (!userId) return;
  const modifier = { $unset: { passwordChangeRequired: 1 } };
  if (signOut) modifier.$set = { 'services.resume.loginTokens': [] };
  await Meteor.users.updateAsync(userId, modifier);
  if (fixed) await markShortPasswordFixed(userId);
}

// accounts-password has no hook for a changed password, so its two methods
// are wrapped. The original is called AT ONCE, before anything is awaited, so
// audit-argument-checks still sees its own check() calls
// (server/lib/argumentChecks.js).
const handlers = Meteor.server && Meteor.server.method_handlers;
function afterOwnPasswordChange(name, userIdOf) {
  const original = handlers && handlers[name];
  if (typeof original !== 'function' || original.__wekanPasswordChangeSignsOut) return;
  const wrapped = function signsEverySessionOut(...args) {
    const userId = this.userId;
    const result = original.apply(this, args);
    // Only after the change worked: a wrong current password changes nothing.
    return Promise.resolve(result).then(async value => {
      await endPasswordChangeRequirement(userIdOf(userId, value), { signOut: true });
      return value;
    });
  };
  for (const symbol of Object.getOwnPropertySymbols(original)) wrapped[symbol] = original[symbol];
  wrapped.__wekanPasswordChangeSignsOut = true;
  handlers[name] = wrapped;
}
// Member Settings / Change Password, and the forced change.
afterOwnPasswordChange('changePassword', userId => userId);
// A reset (or enrolment) link, which Meteor signs in with a new token.
afterOwnPasswordChange('resetPassword', (userId, value) => value && value.id);

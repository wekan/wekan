import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// Shared by DDP and HTTP: possession of a valid token is insufficient when
// an administrator has disabled its owner.
export function allowActiveUser(user, source, req) {
  if (!user) return false;
  if (!user.loginDisabled) return true;
  try {
    require('/server/lib/securityLog').record({
      key: 'authn.inactive', action: 'blocked', source, req,
      userId: user._id, detail: 'Disabled account authentication refused',
    });
  } catch (_) { /* Logging must never change the authentication decision. */ }
  return false;
}

export async function activeUserById(id, source, req) {
  if (typeof id !== 'string' || !id) return null;
  const user = await Meteor.users.findOneAsync(id);
  return allowActiveUser(user, source, req) ? user : null;
}

export async function activeUserByToken(token, source, req) {
  if (typeof token !== 'string' || !token) return null;
  const user = await Meteor.users.findOneAsync({
    'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(token),
  });
  return allowActiveUser(user, source, req) ? user : null;
}

// Test the status in the same database operation that mints the token: a
// concurrent disable must not be followed by reinserting usable credentials.
export async function insertActiveLoginToken(userId, stampedToken) {
  const result = await Meteor.users.rawCollection().updateOne(
    { _id: userId, loginDisabled: { $in: [false, null, ''] } },
    { $push: { 'services.resume.loginTokens': {
      hashedToken: Accounts._hashLoginToken(stampedToken.token),
      when: stampedToken.when,
    } } },
  );
  if (!result.matchedCount) {
    await activeUserById(userId, 'token-issuance');
    throw new Meteor.Error(403, 'Invalid credentials');
  }
}

export function revokeDisabledTokensModifier(modifier) {
  if (modifier.$set?.loginDisabled) {
    modifier.$set['services.resume.loginTokens'] = [];
    // Avoid conflicting modifiers when a caller also touches the token array.
    if (modifier.$push) delete modifier.$push['services.resume.loginTokens'];
    if (modifier.$addToSet) delete modifier.$addToSet['services.resume.loginTokens'];
  }
}

export async function revokeDisabledTokens(id) {
  await Meteor.users.rawCollection().updateOne(
    { _id: id, loginDisabled: true },
    { $set: { 'services.resume.loginTokens': [] } },
  );
}

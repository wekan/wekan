import { Meteor } from 'meteor/meteor';
import AccountSettings from '/models/accountSettings';
import securityLog from '/server/lib/securityLog';
import escapeForRegex from 'escape-string-regexp';

const PROFILE_FIELDS = Object.freeze({
  username: 255,
  fullname: 256,
  initials: 20,
  email: 320,
});

function bounded(value, field, required = false) {
  if (typeof value !== 'string') throw new Meteor.Error('invalid-profile');
  const clean = value.trim();
  if ((required && !clean) || clean.length > PROFILE_FIELDS[field]) {
    throw new Meteor.Error('invalid-profile');
  }
  return clean;
}

function report(user, context, detail) {
  securityLog.record({
    category: 'authz', bleed: 'UserBleed', severity: 'high', action: 'blocked',
    source: 'memberProfile', userId: user?._id || context.userId,
    username: user?.username, req: context.req, detail,
  });
}

async function settings() {
  const [username, email, remove] = await Promise.all([
    AccountSettings.findOneAsync('accounts-allowUserNameChange'),
    AccountSettings.findOneAsync('accounts-allowEmailChange'),
    AccountSettings.findOneAsync('accounts-allowUserDelete'),
  ]);
  return {
    allowUsernameChange: username?.booleanValue === true,
    allowEmailChange: email?.booleanValue === true,
    allowUserDelete: remove?.booleanValue === true,
  };
}

export async function memberProfileForUser(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1, emails: 1, authenticationMethod: 1,
      'profile.fullname': 1, 'profile.initials': 1 },
  });
  if (!user) {
    report(user, { ...context, userId }, 'refused profile read without an account');
    throw new Meteor.Error('not-authorized');
  }
  const policy = await settings();
  return {
    username: user.username || '',
    fullname: user.profile?.fullname || '',
    initials: user.profile?.initials || '',
    email: user.emails?.[0]?.address || '',
    authenticationMethod: user.authenticationMethod || 'password',
    ...policy,
  };
}

export async function updateOwnMemberProfile(userId, input, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1, emails: 1, authenticationMethod: 1 },
  });
  if (!user) {
    report(user, { ...context, userId }, 'refused profile write without an account');
    throw new Meteor.Error('not-authorized');
  }
  if ((user.authenticationMethod || '').toLowerCase() === 'oauth2') {
    report(user, context, 'refused local identity changes for an OAuth2 account');
    throw new Meteor.Error('not-authorized');
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Meteor.Error('invalid-profile');
  }
  const policy = await settings();
  const username = bounded(input.username, 'username', true);
  const fullname = bounded(input.fullname || '', 'fullname');
  const initials = bounded(input.initials || '', 'initials');
  const email = bounded(input.email, 'email', true).toLowerCase();
  if (username.includes('/') || /[\u0000-\u001f\u007f]/.test(username)
    || !/^\S+@\S+\.\S+$/.test(email)) throw new Meteor.Error('invalid-profile');

  const currentEmail = user.emails?.[0]?.address || '';
  const usernameChanged = username !== user.username;
  const emailChanged = email !== currentEmail.toLowerCase();
  if (usernameChanged && !policy.allowUsernameChange) {
    report(user, context, 'refused disabled self-service username change');
    throw new Meteor.Error('not-authorized');
  }
  if (emailChanged && !policy.allowEmailChange) {
    report(user, context, 'refused disabled self-service email change');
    throw new Meteor.Error('not-authorized');
  }

  if (usernameChanged) {
    const owner = await Meteor.users.findOneAsync({
      _id: { $ne: userId }, username: new RegExp(`^${escapeForRegex(username)}$`, 'i'),
    }, { fields: { _id: 1 } });
    if (owner) throw new Meteor.Error('username-already-taken');
  }
  if (emailChanged) {
    const owner = await Meteor.users.findOneAsync({
      _id: { $ne: userId }, 'emails.address': new RegExp(`^${escapeForRegex(email)}$`, 'i'),
    }, { fields: { _id: 1 } });
    if (owner) throw new Meteor.Error('email-already-taken');
  }

  const $set = {
    'profile.fullname': fullname,
    'profile.initials': initials,
  };
  if (usernameChanged) $set.username = username;
  if (emailChanged) $set.emails = [{ address: email, verified: false }];
  const updated = await Meteor.users.updateAsync({ _id: userId }, { $set });
  if (updated !== 1) throw new Meteor.Error('profile-update-failed');
  return memberProfileForUser(userId, context);
}

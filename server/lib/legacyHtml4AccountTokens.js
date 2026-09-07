import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import crypto from 'crypto';

const TOKEN_MAX_LENGTH = 512;

function boundedToken(token) {
  const value = typeof token === 'string' ? token : '';
  if (!value || value.length > TOKEN_MAX_LENGTH) throw new Meteor.Error('invalid-token');
  return value;
}

function boundedPassword(password) {
  const value = typeof password === 'string' ? password : '';
  const maximum = Meteor.settings?.packages?.accounts?.passwordMaxLength || 256;
  if (value.length < 6 || value.length > maximum) throw new Meteor.Error('invalid-password');
  return value;
}

function tokenRecord(user, kind) {
  return user?.services?.password?.[kind] || null;
}

export async function consumePasswordTokenForHtml4(token, password, expectedKind) {
  const originalToken = boundedToken(token);
  const newPassword = boundedPassword(password);
  if (!['reset', 'enroll'].includes(expectedKind)) throw new Meteor.Error('invalid-token-kind');
  const tokenPath = `services.password.${expectedKind}.token`;
  const user = await Meteor.users.findOneAsync({ [tokenPath]: originalToken }, {
    fields: { emails: 1, services: 1 },
  });
  const record = tokenRecord(user, expectedKind);
  if (!user || !record || !(record.when instanceof Date)) throw new Meteor.Error('invalid-token');
  const lifetime = expectedKind === 'enroll'
    ? Accounts._getPasswordEnrollTokenLifetimeMs()
    : Accounts._getPasswordResetTokenLifetimeMs();
  if (Date.now() - record.when.getTime() > lifetime) throw new Meteor.Error('invalid-token');
  if (!Array.isArray(user.emails)
    || !user.emails.some(item => item?.address === record.email)) {
    throw new Meteor.Error('invalid-token');
  }

  // Claim before doing expensive hashing. The token value is part of the update
  // selector, so two processes cannot consume it concurrently.
  const claim = `html4-${crypto.randomUUID()}`;
  const claimed = await Meteor.users.updateAsync({ _id: user._id, [tokenPath]: originalToken }, {
    $set: { [tokenPath]: claim },
  });
  if (claimed !== 1) throw new Meteor.Error('invalid-token');

  try {
    await Accounts.setPasswordAsync(user._id, newPassword, { logout: true });
    const passwordPath = `services.password.${expectedKind}`;
    const selector = expectedKind === 'reset'
      ? { _id: user._id, 'emails.address': record.email }
      : { _id: user._id, 'emails.address': record.email, [tokenPath]: claim };
    const modifier = {
      $set: { 'emails.$.verified': true },
      ...(expectedKind === 'enroll' ? { $unset: { [passwordPath]: 1 } } : {}),
    };
    const completed = await Meteor.users.updateAsync(selector, modifier);
    if (completed !== 1) throw new Meteor.Error('invalid-token');
    return { userId: user._id,
      twoFactorEnabled: Accounts._check2faEnabled?.(user) === true };
  } catch (error) {
    // Restore only our own still-present claim. A successful password reset has
    // already removed the reset record, and must never resurrect it.
    await Meteor.users.updateAsync({ _id: user._id, [tokenPath]: claim }, {
      $set: { [tokenPath]: originalToken },
    }).catch(() => {});
    throw error;
  }
}

export async function consumeVerificationTokenForHtml4(token) {
  const value = boundedToken(token);
  const user = await Meteor.users.findOneAsync({
    'services.email.verificationTokens.token': value,
  }, { fields: { emails: 1, services: 1 } });
  const record = user?.services?.email?.verificationTokens
    ?.find(item => item?.token === value);
  if (!user || !record?.address
    || !user.emails?.some(item => item?.address === record.address)) {
    throw new Meteor.Error('invalid-token');
  }
  const updated = await Meteor.users.updateAsync({
    _id: user._id,
    emails: { $elemMatch: { address: record.address } },
    services: { $exists: true },
    'services.email.verificationTokens': { $elemMatch: {
      token: value, address: record.address,
    } },
  }, {
    $set: { 'emails.$.verified': true },
    $pull: { 'services.email.verificationTokens': { address: record.address } },
  });
  if (updated !== 1) throw new Meteor.Error('invalid-token');
  return { userId: user._id,
    twoFactorEnabled: Accounts._check2faEnabled?.(user) === true };
}

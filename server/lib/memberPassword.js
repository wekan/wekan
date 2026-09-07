import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import securityLog from '/server/lib/securityLog';
import { LoginAttemptThrottle, resolveClientKey } from '/server/lib/loginAttemptThrottle';

const throttle = new LoginAttemptThrottle({
  maxFailures: 5,
  windowMs: 60 * 1000,
  lockoutMs: 60 * 1000,
});

function clientKey(userId, context) {
  const req = context.req;
  const connection = context.connection;
  const address = resolveClientKey({
    headers: req?.headers || connection?.httpHeaders,
    socketAddress: req?.socket?.remoteAddress || req?.connection?.remoteAddress
      || connection?.clientAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
  return `${userId || 'anonymous'}:${address}`;
}

function report(user, context, detail) {
  securityLog.record({
    category: 'brute-force', bleed: 'JamBleed', severity: 'high', action: 'blocked',
    source: 'memberPassword', userId: user?._id || context.userId,
    username: user?.username, req: context.req, detail,
  });
}

function boundedPassword(value) {
  const password = typeof value === 'string' ? value : '';
  const maximum = Meteor.settings?.packages?.accounts?.passwordMaxLength || 256;
  if (password.length < 6 || password.length > maximum) {
    throw new Meteor.Error('invalid-password');
  }
  return password;
}

export async function changeOwnMemberPassword(userId, input, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1, authenticationMethod: 1, services: 1 },
  });
  if (!user) throw new Meteor.Error('not-authorized');
  if ((user.authenticationMethod || '').toLowerCase() === 'oauth2') {
    report(user, context, 'refused local password change for an OAuth2 account');
    throw new Meteor.Error('not-authorized');
  }
  const key = clientKey(userId, context);
  const now = Date.now();
  const gate = throttle.check(key, now);
  if (gate.blocked) {
    report(user, context, 'rate-limited current-password verification');
    const error = new Meteor.Error('too-many-requests');
    error.retryAfterMs = gate.retryAfterMs;
    throw error;
  }
  const currentPassword = typeof input?.currentPassword === 'string'
    ? input.currentPassword : '';
  const newPassword = boundedPassword(input?.newPassword);
  if (newPassword !== input?.passwordAgain) throw new Meteor.Error('password-mismatch');
  const checked = await Accounts._checkPasswordAsync(user, currentPassword);
  if (!checked || checked.error || checked.userId !== userId) {
    const blocked = throttle.recordFailure(key, now);
    throttle.prune(now);
    if (blocked.blocked) report(user, context, 'locked current-password verification after 5 failures');
    throw new Meteor.Error('invalid-credentials');
  }
  await Accounts.setPasswordAsync(userId, newPassword, { logout: true });
  throttle.recordSuccess(key);
  throttle.prune(now);
  return true;
}

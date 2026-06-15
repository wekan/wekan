import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { WebApp } from 'meteor/webapp';
import {
  findOrCreateHeaderLoginUser,
  isTrustedHeaderLoginSource,
  shouldProcessHeaderLoginMiddlewareRequest,
} from '/server/lib/headerLoginAuth';

async function issueLoginTokenCookies(userId, req, res) {
  if (!userId) {
    return;
  }

  const stampedToken = Accounts._generateStampedLoginToken();
  const hashedToken = Accounts._hashStampedToken(stampedToken);
  const tokenExpires = Accounts._tokenExpiration(stampedToken.when);

  await Meteor.users.updateAsync(
    { _id: userId },
    { $push: { 'services.resume.loginTokens': hashedToken } },
  );

  const cookieBase = ['Path=/', 'SameSite=Lax'];
  if (req?.headers?.['x-forwarded-proto'] === 'https' || req?.socket?.encrypted) {
    cookieBase.push('Secure');
  }
  const attrs = cookieBase.join('; ');

  const newCookies = [
    `meteor_login_token=${encodeURIComponent(stampedToken.token)}; ${attrs}`,
    `meteor_user_id=${encodeURIComponent(userId)}; ${attrs}`,
    `meteor_login_token_expires=${encodeURIComponent(tokenExpires.toISOString())}; ${attrs}`,
  ];

  const existingCookies = res.getHeader('Set-Cookie');
  if (Array.isArray(existingCookies)) {
    res.setHeader('Set-Cookie', [...existingCookies, ...newCookies]);
  } else if (typeof existingCookies === 'string' && existingCookies) {
    res.setHeader('Set-Cookie', [existingCookies, ...newCookies]);
  } else {
    res.setHeader('Set-Cookie', newCookies);
  }
}

Meteor.startup(() => {
  if (process.env.HEADER_LOGIN_ID) {
    Meteor.settings.public.headerLoginId = process.env.HEADER_LOGIN_ID;
    Meteor.settings.public.headerLoginEmail = process.env.HEADER_LOGIN_EMAIL;
    Meteor.settings.public.headerLoginFirstname = process.env.HEADER_LOGIN_FIRSTNAME;
    Meteor.settings.public.headerLoginLastname = process.env.HEADER_LOGIN_LASTNAME;

    const isSandstorm = Meteor.settings?.public?.sandstorm === true;
    const hasTrustedIps =
      (process.env.HEADER_LOGIN_TRUSTED_IP || process.env.HEADER_LOGIN_TRUSTED_IPS || '').trim() !== '';
    if (!isSandstorm && !hasTrustedIps) {
      // SECURITY (GHSA-jggc-qvfc-jr6x): header-login now fails closed when the
      // trusted-proxy allowlist is unset. Warn operators so passwordless login
      // is not silently disabled after upgrading.
      console.warn(
        'Header-login is enabled (HEADER_LOGIN_ID is set) but HEADER_LOGIN_TRUSTED_IPS ' +
          'is not configured. For security it now fails closed and will NOT authenticate ' +
          'anyone until you set HEADER_LOGIN_TRUSTED_IPS to the IP address(es) of your ' +
          'trusted reverse proxy.',
      );
    }
    if (!isSandstorm) {
      WebApp.handlers.use(async (req, res, next) => {
        try {
          if (!shouldProcessHeaderLoginMiddlewareRequest(req)) {
            return next();
          }

          if (!isTrustedHeaderLoginSource(req)) {
            return next();
          }

          const userId = await findOrCreateHeaderLoginUser(req);
          if (userId) {
            await issueLoginTokenCookies(userId, req, res);
          }
        } catch (error) {
          if (process.env.DEBUG === 'true') {
            console.warn('Header login middleware failed:', error);
          }
        }
        return next();
      });
    }
  }
});

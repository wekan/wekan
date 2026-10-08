import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { WebApp } from 'meteor/webapp';
import {
  findOrCreateHeaderLoginUser,
  isTrustedHeaderLoginSource,
  shouldProcessHeaderLoginMiddlewareRequest,
} from '/server/lib/headerLoginAuth';
import { authEnv, onAuthConfigChange } from '/server/lib/authConfig';

async function issueLoginTokenCookies(userId, req, res) {
  if (!userId) {
    return;
  }

  const stampedToken = Accounts._generateStampedLoginToken();
  const tokenExpires = Accounts._tokenExpiration(stampedToken.when);

  await require('/server/lib/activeUser').insertActiveLoginToken(userId, stampedToken);

  const cookieBase = ['Path=/', 'SameSite=Lax', 'HttpOnly'];
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

// Header login is configured by HEADER_LOGIN_* only: Admin Panel / People /
// Header login shows them read-only (environment-only since 2026-10-08, see
// models/lib/authConfigCatalog.js). The middleware is still always installed
// and decides per request whether header login is on.
function applyHeaderLoginSettings() {
  const idHeader = authEnv('HEADER_LOGIN_ID');
  Meteor.settings.public.headerLoginId = idHeader;
  Meteor.settings.public.headerLoginEmail = authEnv('HEADER_LOGIN_EMAIL');
  Meteor.settings.public.headerLoginFirstname = authEnv('HEADER_LOGIN_FIRSTNAME');
  Meteor.settings.public.headerLoginLastname = authEnv('HEADER_LOGIN_LASTNAME');

  const isSandstorm = Meteor.settings?.public?.sandstorm === true;
  const hasTrustedIps = (authEnv('HEADER_LOGIN_TRUSTED_IPS') || '').trim() !== '';
  if (idHeader && !isSandstorm && !hasTrustedIps) {
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
}

onAuthConfigChange('headerLogin', applyHeaderLoginSettings);

Meteor.startup(() => {
  if (Meteor.settings?.public?.sandstorm === true) return;
  WebApp.handlers.use(async (req, res, next) => {
    try {
      if (!authEnv('HEADER_LOGIN_ID')) {
        return next();
      }

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
});

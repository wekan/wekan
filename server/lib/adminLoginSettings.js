import { Meteor } from 'meteor/meteor';
import Settings from '/models/settings';
import AccountSettings from '/models/accountSettings';
import securityLog from '/server/lib/securityLog';
import { resolveDefaultAuthenticationMethod } from '/models/lib/authenticationMethod';

export const LOGIN_ALLOW_KEYS = Object.freeze([
  'forgotPassword', 'registration', 'usernameChange', 'userDelete',
  'displayAuthenticationMethod',
]);

export function enabledLoginAuthenticationMethods() {
  const methods = ['password'];
  if (process.env.LDAP_ENABLE === 'true') methods.push('ldap');
  if (process.env.OAUTH2_ENABLED === 'true') methods.push('oauth2');
  if (process.env.CAS_ENABLED === 'true') methods.push('cas');
  return methods;
}

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  securityLog.record({ severity: 'high', category: 'authz', bleed: 'LoginSettingsBleed',
    action: 'blocked', source: 'adminLoginSettings', userId,
    username: user?.username, req: context.req,
    detail: 'refused an attempt to read or change instance login policy' });
  throw new Meteor.Error('not-authorized');
}

async function accountBoolean(id) {
  const doc = await AccountSettings.findOneAsync(id, { fields: { booleanValue: 1 } });
  return doc?.booleanValue === true;
}

export async function loginSettingsForAdmin(userId, context = {}) {
  await requireGlobalAdmin(userId, context);
  const [setting, usernameChange, userDelete] = await Promise.all([
    Settings.findOneAsync({}, { fields: { disableForgotPassword: 1,
      disableRegistration: 1, displayAuthenticationMethod: 1,
      defaultAuthenticationMethod: 1, oidcBtnText: 1 } }),
    accountBoolean('accounts-allowUserNameChange'),
    accountBoolean('accounts-allowUserDelete'),
  ]);
  return { forgotPassword: setting?.disableForgotPassword !== true,
    registration: setting?.disableRegistration !== true,
    usernameChange, userDelete,
    displayAuthenticationMethod: setting?.displayAuthenticationMethod === true,
    defaultAuthenticationMethod: resolveDefaultAuthenticationMethod(
      setting?.defaultAuthenticationMethod),
    oidcBtnText: setting?.oidcBtnText || '',
    authenticationMethods: enabledLoginAuthenticationMethods() };
}

export async function setLoginAllowForAdmin(userId, key, allowed, context = {}) {
  const user = await requireGlobalAdmin(userId, context);
  if (!LOGIN_ALLOW_KEYS.includes(key) || typeof allowed !== 'boolean') {
    securityLog.record({ severity: 'high', category: 'validation',
      bleed: 'LoginSettingsBleed', action: 'blocked', source: 'adminLoginSettings',
      userId: user._id, username: user.username, req: context.req,
      detail: `refused invalid login allow setting key: ${String(key).slice(0, 100)}` });
    throw new Meteor.Error('invalid-setting-value');
  }
  const accountId = key === 'usernameChange' ? 'accounts-allowUserNameChange'
    : key === 'userDelete' ? 'accounts-allowUserDelete' : '';
  if (accountId) {
    await AccountSettings.direct.updateAsync(accountId, { $set: { booleanValue: allowed } });
  } else {
    const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
    const field = key === 'forgotPassword' ? 'disableForgotPassword'
      : key === 'registration' ? 'disableRegistration' : 'displayAuthenticationMethod';
    const value = key === 'forgotPassword' || key === 'registration' ? !allowed : allowed;
    await Settings.direct.updateAsync(setting._id, { $set: { [field]: value } });
  }
  return loginSettingsForAdmin(userId, context);
}

export async function setLoginIdentityForAdmin(userId, input, context = {}) {
  const user = await requireGlobalAdmin(userId, context);
  const methods = enabledLoginAuthenticationMethods();
  const method = resolveDefaultAuthenticationMethod(input?.defaultAuthenticationMethod);
  const oidcBtnText = String(input?.oidcBtnText || '').trim();
  if (!methods.includes(method) || oidcBtnText.length > 500) {
    securityLog.record({ severity: 'high', category: 'validation',
      bleed: 'LoginSettingsBleed', action: 'blocked', source: 'adminLoginSettings',
      userId: user._id, username: user.username, req: context.req,
      detail: 'refused invalid default authentication method or OIDC button text' });
    throw new Meteor.Error('invalid-setting-value');
  }
  const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
  await Settings.direct.updateAsync(setting._id, { $set: {
    defaultAuthenticationMethod: method, oidcBtnText,
  } });
  return loginSettingsForAdmin(userId, context);
}

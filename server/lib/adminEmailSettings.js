import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Email, EmailInternals } from 'meteor/email';
import Settings from '/models/settings';
import AccountSettings from '/models/accountSettings';
import { installAdminMailTransport, installMailTransport } from '/server/lib/mailTransport';
import securityLog from '/server/lib/securityLog';
const { ALL_MAIL_SERVICES, isSupportedMailService, mailServiceStorageKey } =
  require('/models/lib/mailServices');

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1, emails: 1, 'profile.language': 1 },
  });
  if (user?.isAdmin) return user;
  securityLog.record({ severity: 'high', category: 'authz', bleed: 'MailSettingsBleed',
    action: 'blocked', source: 'adminEmailSettings', userId,
    username: user?.username, req: context.req,
    detail: 'refused an attempt to read or change instance email settings' });
  throw new Meteor.Error('error-notAuthorized', 'Not authorized');
}

function safeConfiguration(mailServer, service) {
  const raw = mailServer?.configurations?.[mailServiceStorageKey(service)] || {};
  const result = { username: String(raw.username || ''), from: String(raw.from || '') };
  if (service === 'SMTP') Object.assign(result, { host: String(raw.host || ''),
    port: String(raw.port || ''), secure: raw.secure === true });
  return result;
}

export async function emailSettingsForAdmin(userId, context = {}) {
  await requireGlobalAdmin(userId, context);
  const [setting, account] = await Promise.all([
    Settings.findOneAsync({}, { fields: { mailServer: 1, mailDomainName: 1 } }),
    AccountSettings.findOneAsync('accounts-allowEmailChange', {
      fields: { booleanValue: 1 },
    }),
  ]);
  const mailServer = setting?.mailServer || {};
  const service = isSupportedMailService(mailServer.service) ? mailServer.service : 'SMTP';
  return { enabled: mailServer.enabled === true, service,
    configuration: safeConfiguration(mailServer, service),
    passwordSet: mailServer.passwordSet?.[mailServiceStorageKey(service)] === true,
    mailDomainName: String(setting?.mailDomainName || ''),
    allowEmailChange: account?.booleanValue === true,
    services: ALL_MAIL_SERVICES.slice() };
}

export async function saveMailTransportForAdmin(userId, input, context = {}) {
  const user = await requireGlobalAdmin(userId, context);
  const service = String(input?.service || 'SMTP');
  if (!isSupportedMailService(service)) {
    securityLog.record({ severity: 'high', category: 'validation',
      bleed: 'MailSettingsBleed', action: 'blocked', source: 'adminEmailSettings',
      userId: user._id, username: user.username, req: context.req,
      detail: `refused unsupported mail service: ${service.slice(0, 100)}` });
    throw new Meteor.Error('mail-service-invalid');
  }
  const raw = input?.configuration || {};
  const clean = { username: String(raw.username || '').trim().slice(0, 1000),
    from: String(raw.from || '').trim().slice(0, 1000) };
  if (service === 'SMTP') Object.assign(clean, {
    host: String(raw.host || '').trim().slice(0, 1000),
    port: String(raw.port || '').trim().slice(0, 20), secure: raw.secure === true,
  });
  if (input?.enabled && service === 'SMTP' && !clean.host) {
    throw new Meteor.Error('mail-host-required');
  }
  if (input?.enabled && !clean.from) throw new Meteor.Error('mail-from-required');
  const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
  const storageKey = mailServiceStorageKey(service);
  const set = { 'mailServer.enabled': input?.enabled === true,
    'mailServer.service': service,
    [`mailServer.configurations.${storageKey}`]: clean, 'mailServer.from': clean.from };
  const password = String(input?.password || '');
  if (password) {
    if (password.length > 10000) throw new Meteor.Error('invalid-setting-value');
    set[`mailServer.passwords.${storageKey}`] = password;
    set[`mailServer.passwordSet.${storageKey}`] = true;
  }
  await Settings.direct.updateAsync(setting._id, { $set: set });
  const updated = await Settings.findOneAsync(setting._id);
  Accounts.emailTemplates.from = updated.mailServer.enabled ? clean.from : process.env.MAIL_FROM;
  if (updated.mailServer.enabled) {
    installAdminMailTransport({ Email, EmailInternals, mailServer: updated.mailServer });
  } else {
    delete Email.customTransport;
    installMailTransport({ Email, EmailInternals });
  }
  return emailSettingsForAdmin(userId, context);
}

export async function saveEmailAccessForAdmin(userId, input, context = {}) {
  const user = await requireGlobalAdmin(userId, context);
  const mailDomainName = String(input?.mailDomainName || '').trim();
  if (mailDomainName.length > 500 || typeof input?.allowEmailChange !== 'boolean') {
    securityLog.record({ severity: 'high', category: 'validation',
      bleed: 'MailSettingsBleed', action: 'blocked', source: 'adminEmailSettings',
      userId: user._id, username: user.username, req: context.req,
      detail: 'refused invalid email access setting' });
    throw new Meteor.Error('invalid-setting-value');
  }
  const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
  await Promise.all([
    Settings.direct.updateAsync(setting._id, { $set: { mailDomainName } }),
    AccountSettings.direct.updateAsync('accounts-allowEmailChange', {
      $set: { booleanValue: input.allowEmailChange },
    }),
  ]);
  return emailSettingsForAdmin(userId, context);
}

export async function sendSmtpTestForAdmin(userId, context = {}) {
  const user = await requireGlobalAdmin(userId, context);
  const email = user.emails?.[0]?.address;
  if (!email) throw new Meteor.Error('email-invalid');
  const language = user.profile?.language || 'en';
  try {
    await Email.sendAsync({ to: email, from: Accounts.emailTemplates.from,
      subject: getTAPi18n().__('email-smtp-test-subject', { lng: language }),
      text: getTAPi18n().__('email-smtp-test-text', { lng: language }) });
  } catch ({ message }) {
    throw new Meteor.Error('email-fail',
      `${getTAPi18n().__('email-fail-text', { lng: language })}: ${message}`, message);
  }
  return { message: 'email-sent', email };
}

function getTAPi18n() {
  return require('/imports/i18n').TAPi18n;
}

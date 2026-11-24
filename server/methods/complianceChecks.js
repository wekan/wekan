// Admin Panel / Problems / Compliance (WP-12): the facts the checklist of
// models/lib/complianceChecks.js is made from - read here, because only the
// server knows its environment. Site administrators only; read-only.
import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { authEnv } from '/server/lib/authConfig';
import LegalPages from '/models/legalPages';

const { complianceChecks } = require('/models/lib/complianceChecks');
const { isSiteAdmin } = require('/models/lib/tenantAdmin');
const { requireTwoFactorMode } = require('/models/lib/twoFactorRequirement');
const { idleLogoutConfig } = require('/models/lib/idleLogout');
const { isHttps, hstsHeader } = require('/models/lib/securityHeaders');
const { retentionDays } = require('/models/lib/retentionSettings');
const loginRetention = require('/models/lib/loginAddressRetention');

Meteor.methods({
  async getComplianceChecks() {
    const user = this.userId ? await ReactiveCache.getUser(this.userId) : null;
    if (!user || user.loginDisabled || !isSiteAdmin(user)) throw new Meteor.Error('not-authorized');
    const rootUrl = process.env.ROOT_URL || Meteor.absoluteUrl();
    const docs = await LegalPages.find({ _id: { $in: ['privacy', 'imprint', 'contacts'] } }).fetchAsync();
    const doc = id => docs.find(d => d._id === id) || {};
    let backup = {};
    try {
      const { ContinuousBackupSettings } = require('/server/continuousBackup');
      backup = (await ContinuousBackupSettings.findOneAsync('settings', { fields: { enabled: 1, encrypt: 1 } })) || {};
    } catch (e) { backup = {}; }
    const idle = idleLogoutConfig(authEnv);
    return complianceChecks({
      require2fa: requireTwoFactorMode(authEnv),
      idleMinutes: idle.enabled ? idle.minutes : 0,
      https: isHttps(rootUrl),
      hsts: hstsHeader(authEnv, rootUrl),
      loginRetentionDays: loginRetention.retentionDays({ LOGIN_ADDRESS_RETENTION_DAYS: process.env.LOGIN_ADDRESS_RETENTION_DAYS }),
      auditRetentionDays: retentionDays('ADMIN_AUDIT_RETENTION_DAYS', { ADMIN_AUDIT_RETENTION_DAYS: process.env.ADMIN_AUDIT_RETENTION_DAYS }),
      privacyPublished: doc('privacy').enabled === true,
      imprintPublished: doc('imprint').enabled === true,
      securityContact: !!String(doc('contacts').securityContact || '').trim(),
      backup: { enabled: backup.enabled === true, encrypt: backup.encrypt === true },
    });
  },
});

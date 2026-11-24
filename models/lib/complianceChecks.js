'use strict';

// Admin Panel / Problems / Compliance (docs/Compliance/README.md WP-12): a
// read-only checklist of the settings the laws and standards most asked about
// look for, each linking to the pane where it is changed. It only reports:
// whether a check matters is the operator's call (docs/Security/Compliance/).
//
//   ok    the setting is as recommended
//   warn  worth a look: recommended for any deployment with personal data
//   info  depends on who runs it - HIPAA, or a commercial service in DE/AT
//
// Pure: the server gathers the facts (server/methods/complianceChecks.js);
// tests/complianceChecks.test.cjs.

const HIPAA_AUDIT_DAYS = 2190;

// facts: {
//   require2fa: 'off'|'admins'|'all', idleMinutes: number|0,
//   https: boolean, hsts: string|null, loginRetentionDays: number,
//   auditRetentionDays: number, privacyPublished: boolean,
//   imprintPublished: boolean, securityContact: boolean,
//   backup: { enabled: boolean, encrypt: boolean },
// }
function complianceChecks(facts = {}) {
  const f = facts || {};
  const backup = f.backup || {};
  const rows = [
    {
      id: 'require-2fa', labelKey: 'compliance-2fa-admins',
      status: f.require2fa === 'admins' || f.require2fa === 'all' ? 'ok' : 'warn',
      value: `REQUIRE_2FA=${f.require2fa || 'off'}`,
      pane: { page: 'people', slug: 'login' },
    },
    {
      id: 'idle-logout', labelKey: 'compliance-idle-logout',
      status: f.idleMinutes > 0 ? 'ok' : 'warn',
      value: f.idleMinutes > 0 ? `LOGOUT_IDLE_MINUTES=${f.idleMinutes}` : 'LOGOUT_IDLE_MINUTES',
      pane: { page: 'people', slug: 'login' },
    },
    {
      id: 'https', labelKey: 'compliance-https',
      status: f.https && f.hsts ? 'ok' : 'warn',
      value: f.https ? (f.hsts || 'HSTS_MAX_AGE=0') : 'ROOT_URL http://',
      pane: { page: 'settings', slug: 'security' },
    },
    {
      id: 'login-retention', labelKey: 'compliance-login-retention',
      status: f.loginRetentionDays > 0 ? 'ok' : 'warn',
      value: `LOGIN_ADDRESS_RETENTION_DAYS=${Number(f.loginRetentionDays) || 0}`,
      pane: { page: 'settings', slug: 'privacy' },
    },
    {
      id: 'audit-retention', labelKey: 'compliance-audit-retention',
      // 0 keeps the log for ever, which is long enough too.
      status: f.auditRetentionDays === 0 || f.auditRetentionDays >= HIPAA_AUDIT_DAYS ? 'ok' : 'info',
      value: `ADMIN_AUDIT_RETENTION_DAYS=${Number(f.auditRetentionDays) || 0}`,
      pane: { page: 'people', slug: 'audit-log' },
    },
    {
      id: 'privacy-published', labelKey: 'compliance-privacy-published',
      status: f.privacyPublished ? 'ok' : 'warn',
      value: '/privacy',
      pane: { page: 'settings', slug: 'privacy' },
    },
    {
      id: 'imprint-published', labelKey: 'compliance-imprint-published',
      status: f.imprintPublished ? 'ok' : 'info',
      value: '/imprint',
      pane: { page: 'settings', slug: 'privacy' },
    },
    {
      id: 'security-contact', labelKey: 'compliance-security-contact',
      status: f.securityContact ? 'ok' : 'warn',
      value: '/.well-known/security.txt',
      pane: { page: 'settings', slug: 'privacy' },
    },
    {
      id: 'backup-encrypted', labelKey: 'compliance-backup-encrypted',
      status: !backup.enabled ? 'info' : backup.encrypt ? 'ok' : 'warn',
      value: !backup.enabled ? '-' : backup.encrypt ? 'encrypt' : 'no encryption',
      pane: { page: 'attachments', slug: 'continuous-backup' },
    },
  ];
  return rows;
}

const STATUS_KEYS = Object.freeze({ ok: 'compliance-ok', warn: 'compliance-check', info: 'compliance-for-information' });

module.exports = { HIPAA_AUDIT_DAYS, complianceChecks, STATUS_KEYS };

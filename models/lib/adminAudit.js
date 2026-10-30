'use strict';

// Admin Panel / People / Audit log: who, among the site administrators, did
// what and when - set a password, made somebody an admin, changed a login
// setting, restored a backup. Admin Panel / Problems answers a different
// question (what attacks were refused) and folds its events into summaries;
// an audit trail has to keep every event, so it is a collection of its own
// (server/adminAudit.js), one document per action, kept AUDIT_KEEP_DAYS.
//
// WHAT IS RECORDED: a call, by a site administrator, of one of the methods
// below - the ones that change who can do what or how the site is configured.
// An administrator editing cards is a member editing cards and is not here.
// A call that fails is recorded too, with its error: an attempt is part of
// the trail.
//
// WHAT IS NEVER RECORDED: a password or a secret. The arguments are kept as a
// short summary, and on the way in:
//   - every value under a key that names a credential (password, secret,
//     token, key, credential, ...) is replaced by [redacted], at any depth;
//   - the arguments that are a password by POSITION (setPassword's first,
//     setCreateUser's fourth) are replaced too;
//   - a password inside a URL (ldap://user:pass@host) is masked.
//
// Pure: no Meteor. Shared by the server and plain-Node tests.

const AUDIT_KEEP_DAYS = 365;

const AUDITED_METHODS = [
  // People
  'setCreateUser', 'setPassword', 'setUsername', 'setEmail', 'setUsernameAndEmail',
  'setEmailVerified', 'setInitials', 'editUser', 'removeUser', 'impersonate',
  'adminSetAvatarUrl', 'unlockUser', 'unlockAllUsers', 'mergeImportedUser',
  'sendInvitation', 'setUserOrgsTeamsFromLdap', 'ldap_sync_now',
  // Organizations and teams
  'setCreateOrg', 'setOrgAllFields', 'setOrgIsActive', 'setOrgTenantFields',
  'setAutoAddUsersWithDomainName', 'setCreateTeam', 'setTeamAllFields', 'setTeamIsActive',
  // Login and site settings
  'saveAuthConfigSettings', 'saveSamlSettings', 'saveOauthProviderSettings',
  'savePasswordlessSettings', 'saveAdminMailSettings', 'setPermanentDeleteEnabled',
  'saveSqrlEnabled', 'saveInstanceFeatures', 'saveOptionalApis', 'saveRulesReadOnlyForMembers',
  'saveWebhookInternalHosts', 'saveAccountWebhook', 'saveActivityPubEnabled',
  'saveEmailBounceSettings', 'saveInboundMailSettings', 'setAdminNotifyDefault', 'uploadSiteLogo',
  'reloadAccountsLockout',
  // Attachments, backups and data
  'updateAttachmentStorageSettings', 'setDefaultAttachmentStorage', 'startBulkAttachmentMove',
  'compactMongoGridFs', 'saveBackupSchedule', 'restoreBackup', 'runBackup',
  'migrateTextDatabase', 'repairBrokenCards', 'repairDataHealth', 'permanentlyDeleteArchivedBoards',
  'cleanupUnusedTemplateContainers', 'sandstormDeleteRawMongo', 'setRecoveryMaintenance',
];

// Arguments that are a password by position, for methods that take one.
const SECRET_POSITIONS = {
  setPassword: [0],
  setCreateUser: [3],
};

const SECRET_KEY = /pass(word)?|secret|token|credential|private|api[-_]?key|access[-_]?key|account[-_]?key|connection[-_]?string|^key$/i;
const MAX_STRING = 200;
const MAX_SUMMARY = 2000;
const MAX_DEPTH = 4;
const MAX_ITEMS = 20;

function maskUrlCredentials(text) {
  return text.replace(/([a-z][a-z0-9+.-]*:\/\/)([^/@\s:]+):([^/@\s]+)@/gi, '$1$2:[redacted]@');
}

function clean(value, depth) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const s = maskUrlCredentials(value);
    return s.length > MAX_STRING ? `${s.slice(0, MAX_STRING)}…` : s;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();
  if (depth >= MAX_DEPTH) return '[…]';
  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map(v => clean(v, depth + 1));
    if (value.length > MAX_ITEMS) items.push(`[+${value.length - MAX_ITEMS}]`);
    return items;
  }
  if (typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).slice(0, MAX_ITEMS)) {
      out[key] = SECRET_KEY.test(key) ? '[redacted]' : clean(value[key], depth + 1);
    }
    return out;
  }
  return `[${typeof value}]`;
}

// The arguments as they are stored: secrets out, short, JSON.
function auditArgs(method, args) {
  const secret = new Set(SECRET_POSITIONS[method] || []);
  const list = (Array.isArray(args) ? args : []).map((arg, i) => (secret.has(i) ? '[redacted]' : clean(arg, 0)));
  let text = JSON.stringify(list);
  if (text.length > MAX_SUMMARY) text = `${text.slice(0, MAX_SUMMARY)}…`;
  return text;
}

function isAudited(method) {
  return AUDITED_METHODS.includes(method);
}

module.exports = {
  AUDITED_METHODS, SECRET_POSITIONS, AUDIT_KEEP_DAYS, auditArgs, isAudited, maskUrlCredentials,
};

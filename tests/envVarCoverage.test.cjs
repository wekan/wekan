'use strict';

// Every environment variable WeKan reads is accounted for, so a new feature
// cannot ship a setting that some platform or the Admin Panel does not have.
//
// A variable is one of:
//   1. in an Admin Panel catalog (models/lib/authConfigCatalog.js, samlConfig.js,
//      oauthProviders.js). Admin Panel overrides it, and
//      tests/authConfigCatalog.test.cjs requires it on every platform the
//      release workflows build (Dockerfile, docker-compose, start-wekan.sh and
//      .bat, the snap config and help);
//   2. OWN_PANE below: an Admin Panel page of its own covers it, outside the
//      catalog, with the variable as the fallback, and every platform lists it;
//   3. ENV_ONLY below, with the reason it is not an Admin Panel setting, and
//      whether the platforms list it (a setting a user sets) or not (one the
//      host sets itself - Sandstorm, Nextcloud's AppAPI);
//   4. LEGACY: read before v12.00, when this check began. Frozen: it may only
//      shrink, as variables move into a catalog or stop being read.
// A variable read anywhere else fails this test.
// Run: node tests/envVarCoverage.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const OWN_PANE = {
  INBOUND_EMAIL_WEBHOOK_SECRET: 'Admin Panel / People / Notification Settings / Email to card (a secret, never sent back to a browser)',
};

const ENV_ONLY = {
  INBOUND_IMAP_DISABLED: { platforms: true, reason: 'stops IMAP in ONE process of a multi-pod deployment; an Admin Panel value is shared by every pod' },
  WEKAN_DISK_MONITOR: { platforms: true, reason: "this server's own disk monitor, per process" },
  WEKAN_DISK_WATCH_PATHS: { platforms: true, reason: "paths on this server's disk, per host" },
  WEKAN_RAM_MONITOR: { platforms: true, reason: "this server's own memory monitor, per process" },
  WEKAN_IMPORT_RUN_STALE_MS: { platforms: true, reason: 'operational tuning of interrupted-import detection' },
  LOGIN_ADDRESS_RETENTION_DAYS: { platforms: true, reason: 'how long sign-in addresses are kept (docs/Compliance/README.md WP-2); 0 keeps them' },
  LOGIN_ADDRESS_RECORDED: { platforms: true, reason: 'data minimisation (docs/Compliance/README.md P3, models/lib/loginAddressRetention.js): false records no sign-in address at all; a server setting, like the retention days beside it' },
  USERS_ANONYMIZE_INACTIVE_AFTER_DAYS: { platforms: true, reason: 'storage limitation (docs/Compliance/README.md P3, models/lib/inactiveUsers.js): days after an inactivity disable that the account is anonymised; off unless set' },
  REGISTRATION_MINIMUM_AGE: { platforms: true, reason: 'children\'s data (docs/Compliance/README.md P3, row 1.9, models/lib/registrationAge.js): the minimum age a password sign-up confirms; off unless set' },
  BACKUP_PASSPHRASE: { platforms: true, reason: 'a secret (docs/Compliance/README.md P3, server/lib/backupEncryption.js): the passphrase the Admin Panel backups are encrypted with; never stored in the database it backs up' },
  ATTACHMENTS_PASSPHRASE: { platforms: true, reason: 'a secret (docs/Compliance/README.md P3, server/lib/attachmentEncryption.js): the passphrase the attachments on disk are encrypted with; its Admin Panel pane is shown only while it is set, never stored in the database' },
  ADMIN_AUDIT_RETENTION_DAYS: { platforms: true, reason: 'retention (docs/Compliance/README.md WP-7, models/lib/retentionSettings.js): Days the administrators audit log (Admin Panel / People / Audit log) is kept. Default 365; 0 keeps it; a HIPAA deployment sets 2190 or more.' },
  AUDIT_LOG_STDOUT: { platforms: true, reason: 'where this process writes its log (docs/Compliance/README.md WP-11, models/lib/auditStdout.js): json copies every audit row, security problem and data access to stdout for a SIEM; a server setting, not an Admin Panel one' },
  ACTIVITIES_RETENTION_DAYS: { platforms: true, reason: 'retention (docs/Compliance/README.md WP-7, models/lib/retentionSettings.js): Days board activity rows are kept; off unless set. The change history of cards is never removed.' },
  WORKLOAD_ABSENCE_RETENTION_DAYS: { platforms: true, reason: 'retention (docs/Compliance/README.md WP-7, models/lib/retentionSettings.js): Days after its end a workload absence is kept; off unless set. Absences can be health data.' },
  WORKLOAD_ABSENCE_TYPE_RECORDED: { platforms: true, reason: 'retention (docs/Compliance/README.md WP-7, models/lib/retentionSettings.js): false stores every new workload absence as "other", so no sick leave is recorded.' },
  EVENTLOG_RETENTION_DAYS: { platforms: true, reason: 'how long the Problems report keeps its own rows (#6893); the Clear button is its Admin Panel side' },
  DEFAULT_AVATAR_URL: { platforms: true, reason: 'maintainer decision (#824): "There should be no UI in Admin Panel"' },
  // models/lib/oidcProviderMode.js: Sign in with Apple needs both and WeKan
  // sets them by itself from Apple's address; these are only for another
  // provider with the same quirk, so no platform lists them.
  // The /metrics address allowlist under the name every platform sets
  // (models/server/metrics.js reads it beside METRICS_ACCEPTED_IP_ADDRESS).
  METRICS_ALLOWED_IP_ADDRESSES: { platforms: true, reason: 'which addresses may scrape /metrics: an operator setting of this deployment, not a WeKan option' },
  // Admin Panel / Settings / Privacy and security / Allowed addresses
  // (models/lib/adminPanelAddresses.js): the server's own list wins over the
  // Admin Panel's, and "any" is the way back in for an operator whose saved
  // list no longer has their address - which a browser setting cannot be.
  ADMIN_PANEL_ALLOWED_IP_ADDRESSES: { platforms: true, reason: 'the addresses the Admin Panel can be used from, set by the operator so a list that locked the admins out can be overridden without the Admin Panel' },
  OAUTH2_RESPONSE_MODE: { platforms: false, reason: "an OIDC provider's response_mode; Apple's is set by itself" },
  OAUTH2_CLAIMS_IN_ID_TOKEN: { platforms: false, reason: "an OIDC provider that keeps the claims in the ID token; Apple's is detected by itself" },
  // The Cloud Panel's way back in for an operator locked out by its allowed
  // addresses (docs/Features/Admin-Panel/Cloud-Panel.md): set for one restart,
  // never kept, and never something the browser may switch.
  // The Cloud Admin container's domain (models/lib/cloudPanel.js cloudDomainFromEnv): CloudPanelBleed.
  CLOUD: { platforms: true, reason: 'the Cloud Panel exists only with it, and only the server may set it - a browser setting was the hole (CloudPanelBleed)' },
  CLOUD_ADMIN_ANY_ADDRESS: { platforms: false, reason: 'a one-off recovery switch for a Cloud Panel locked out by its own allowed addresses; a setting in the browser could not reach a locked-out operator' },
  NEXTCLOUD_EXAPP: { platforms: false, reason: "set by Nextcloud's AppAPI when it deploys WeKan as an ExApp" },
  NEXTCLOUD_URL: { platforms: false, reason: "set by Nextcloud's AppAPI when it deploys WeKan as an ExApp" },
  WEKAN_NEXTCLOUD_PROXY_KEY: { platforms: false, reason: "a per-deployment secret Nextcloud's AppAPI hands over" },
  SANDSTORM_MAILDIR: { platforms: false, reason: 'set inside a Sandstorm grain; Sandstorm defines the whole environment' },
};

const LEGACY = new Set([
  'ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURES_BEFORE',
  'ACCOUNTS_LOCKOUT_KNOWN_USERS_FAILURE_WINDOW',
  'ACCOUNTS_LOCKOUT_KNOWN_USERS_PERIOD',
  'ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BEFORE',
  'ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURES_BERORE',
  'ACCOUNTS_LOCKOUT_UNKNOWN_USERS_FAILURE_WINDOW',
  'ACCOUNTS_LOCKOUT_UNKNOWN_USERS_LOCKOUT_PERIOD',
  'ATTACHMENTS_UPLOAD_EXTERNAL_PROGRAM', 'ATTACHMENTS_UPLOAD_MAX_SIZE',
  'ATTACHMENTS_UPLOAD_MIME_TYPES', 'ATTACHMENT_API_MAX_DOWNLOAD_BYTES',
  'ATTACHMENT_API_MAX_UPLOAD_BYTES', 'AVATARS_UPLOAD_EXTERNAL_PROGRAM',
  'AVATARS_UPLOAD_MAX_SIZE', 'AVATARS_UPLOAD_MIME_TYPES', 'BIGEVENTS_PATTERN',
  'BROWSER_POLICY_ENABLED', 'CARDS_LOADING', 'CARDS_LOADING_LAZY_THRESHOLD',
  'CARD_OPENED_WEBHOOK_ENABLED', 'CORS', 'CORS_ALLOW_HEADERS',
  'CORS_EXPOSE_HEADERS', 'DASHBOARD_URL', 'DDP_TRANSPORT', 'DEBUG',
  'DEBUGSPEED', 'DEBUGSPEED_LOG_FILE', 'DEBUGSPEED_SAMPLE_MS',
  'DEBUGSPEED_SLOW_MS', 'DEFAULT_BOARD_ID', 'DEFAULT_METEOR_REACTIVITY_ORDER',
  'EMAIL_NOTIFICATION_TIMEOUT', 'FERRETDB_DIR', 'FERRETDB_SQLITE_DIR',
  'GRIDFS_ENABLED', 'HTTP_FORWARDED_COUNT', 'IMAGE_COMPRESS_RATIO',
  'INBOUND_EMAIL_DOMAIN', 'INBOUND_EMAIL_HMAC_SECRET', 'MAIL_FROM', 'MAIL_URL',
  'MATOMO_ADDRESS', 'MATOMO_DO_NOT_TRACK', 'MATOMO_WITH_USERNAME',
  'MAX_IMAGE_PIXEL', 'METEOR_REACTIVITY_ORDER', 'METRICS_ACCEPTED_IP_ADDRESS',
  'METRICS_ACCESS_TOKEN', 'METRICS_TRUST_PROXY', 'MONGO_URL', 'NODE_ENV',
  'NOTIFICATION_TRAY_AFTER_READ_DAYS_BEFORE_REMOVE',
  'NOTIFY_DUE_AT_HOUR_OF_DAY', 'NOTIFY_DUE_DAYS_BEFORE_AND_AFTER',
  'NOTIFY_ON_ASSIGN', 'PERMISSIONS_POLICY', 'PORT',
  'REST_LOGIN_FAILURE_WINDOW_SECONDS', 'REST_LOGIN_LOCKOUT_SECONDS',
  'REST_LOGIN_MAX_FAILURES', 'RESULTS_PER_PAGE', 'ROOT_URL', 'S3_ACCESS_KEY',
  'S3_BUCKET', 'S3_ENABLED', 'S3_ENDPOINT', 'S3_PORT', 'S3_REGION',
  'S3_SECRET_KEY', 'S3_SSL_ENABLED', 'SANDSTORM', 'SANDSTORM_MIGRATION_MARKER',
  'SANDSTORM_RAW_MONGO_PATH', 'SANDSTORM_SMTP_SEND', 'SNAP_COMMON',
  'TRUSTED_URL', 'UPLOAD_DANGEROUS_MIME_SCAN_LIMIT', 'WAIT_SPINNER',
  'WEBHOOKS_ATTRIBUTES', 'WEKAN_API_USAGE_FLUSH_MS', 'WEKAN_CPU_MONITOR',
  'WEKAN_DB_WAIT_TIMEOUT', 'WEKAN_FERRETDB_URL', 'WEKAN_FORCE_SCHEMA_UPGRADE',
  'WEKAN_HISTORY_INTEGRITY_SCAN', 'WEKAN_IMPORT_TIMEOUT_MS',
  'WEKAN_IMPORT_ZIP_MAX_BYTES', 'WEKAN_INTEGRITY_PRIVATE_KEY',
  'WEKAN_INTEGRITY_SCAN', 'WEKAN_METRICS_ACCEPTED_IP_ADDRESS',
  'WEKAN_MIN_FREE_DISK_MB', 'WEKAN_MONGODB_URL', 'WEKAN_SKIP_SCHEMA_UPGRADE',
  'WEKAN_SKIP_STARTUP_REPAIR', 'WEKAN_SLOW_REQUEST_MS', 'WITH_API',
  'WRITABLE_PATH',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'tests' || entry.name === '.npm') continue;
      walk(rel, out);
    } else if (/\.(js|mjs|cjs)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

const files = [...['server', 'models', 'client', 'imports', 'config'].filter(d => fs.existsSync(path.join(ROOT, d))).flatMap(d => walk(d)),
  ...fs.readdirSync(path.join(ROOT, 'packages')).filter(p => p.startsWith('wekan-')).flatMap(p => walk(path.join('packages', p)))];
const READ = /process\.env\.([A-Z][A-Z0-9_]{2,})|process\.env\[['"]([A-Z][A-Z0-9_]{2,})['"]\]|(?:authEnv|readEnv|env)\(\s*['"]([A-Z][A-Z0-9_]{2,})['"]/g;
const used = new Map();
for (const file of files) {
  for (const m of read(file).matchAll(READ)) {
    const name = m[1] || m[2] || m[3];
    if (!used.has(name)) used.set(name, file);
  }
}
const catalogs = ['models/lib/authConfigCatalog.js', 'models/lib/samlConfig.js', 'models/lib/oauthProviders.js'].map(read).join('\n');
const inCatalog = name => new RegExp(`['"]${name}['"]`).test(catalogs) || /^OAUTH_[A-Z]+_/.test(name);

let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('every variable WeKan reads is in an Admin Panel catalog, ENV_ONLY or LEGACY', () => {
  const unaccounted = [...used].filter(([name]) => !inCatalog(name) && !OWN_PANE[name] && !ENV_ONLY[name] && !LEGACY.has(name))
    .map(([name, file]) => `${name} (${file})`);
  assert.deepEqual(unaccounted, [], 'add it to a catalog section (Admin Panel + every platform), or to ENV_ONLY with the reason');
});

test('negative: no variable is both in a catalog and listed as environment only', () => {
  assert.deepEqual(Object.keys(ENV_ONLY).filter(inCatalog), []);
  assert.deepEqual([...LEGACY].filter(inCatalog), [], 'a variable moved into a catalog leaves LEGACY');
});

test('LEGACY and ENV_ONLY name only variables still read, so the lists cannot go stale', () => {
  assert.deepEqual([...LEGACY].filter(name => !used.has(name)), []);
  assert.deepEqual(Object.keys(ENV_ONLY).filter(name => !used.has(name)), []);
  assert.deepEqual(Object.keys(OWN_PANE).filter(name => !used.has(name)), []);
});

test('an environment-only or own-page setting a user sets is listed on every platform', () => {
  const config = read('snap-src/bin/config');
  const keys = new Set(config.split('\n')[5].replace(/^keys="|"$/g, '').split(' '));
  const help = read('snap-src/bin/wekan-help');
  const platformFiles = ['Dockerfile', 'start-wekan.sh', 'start-wekan.bat',
    ...fs.readdirSync(ROOT).filter(f => /^docker-compose.*\.yml$/.test(f) && read(f).includes('LDAP_ENABLE'))];
  const missing = [];
  const listed = [...Object.entries(ENV_ONLY).filter(([, e]) => e.platforms).map(([n]) => n), ...Object.keys(OWN_PANE)];
  for (const name of listed) {
    for (const file of platformFiles) if (!new RegExp(`\\b${name}\\b`).test(read(file))) missing.push(`${file}: ${name}`);
    if (!keys.has(name)) missing.push(`snap keys: ${name}`);
    const key = (config.match(new RegExp(`^KEY_${name}="([^"]+)"$`, 'm')) || [])[1];
    if (!key || !help.includes(`$SNAP_INSTANCE_NAME ${key}=`)) missing.push(`snap help: ${name}`);
  }
  assert.deepEqual(missing, []);
});

test('every ENV_ONLY entry gives its reason', () => {
  for (const [name, entry] of Object.entries(ENV_ONLY)) {
    assert.equal(typeof entry.platforms, 'boolean', name);
    assert.ok(entry.reason && entry.reason.length > 20, `${name} says why`);
  }
});

console.log(`envVarCoverage: ${passed} tests passed`);

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
  DEFAULT_AVATAR_URL: { platforms: true, reason: 'maintainer decision (#824): "There should be no UI in Admin Panel"' },
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

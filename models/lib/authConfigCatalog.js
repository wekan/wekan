'use strict';

// Every login setting that an environment variable configures, per login
// method, so Admin Panel / People can override each one in that method's own
// section. One catalog is what keeps the four users of it in step:
//   - server/lib/authConfig.js resolves a setting at run time (Admin Panel
//     value first, then the environment variable) for every caller, including
//     the wekan-ldap, wekan-oidc and wekan-accounts-cas packages;
//   - the Admin Panel draws one form per section from it;
//   - tests/authConfigCatalog.test.cjs fails when code reads a login variable
//     the catalog does not list, and when a platform (Dockerfile, snap,
//     docker-compose, start-wekan) does not list a variable the catalog has.
//
// SAML and the Meteor OAuth providers (Google, GitHub, ...) have catalogs of
// their own (samlConfig.js, oauthProviders.js) and are not repeated here.
//
// SECURITY: a field of type 'secret' is only ever a password or a client
// secret. It is stored server-side and never sent to a browser: the Admin
// Panel learns only whether one is set and where it comes from. Every other
// value that reaches a browser goes through redactCredentialsInUrl(), so a
// password written inside a URL (ldap://user:pass@host) is masked on the
// server before it leaves it.
//
// This file is pure: no Meteor, no database. It is loaded by the server, the
// client (field lists only) and by plain-Node tests.

const { redactCredentialsInUrl } = require('./configResolver');
const { OAUTH_PROVIDERS } = require('./oauthProviders');

// What DEFAULT_AUTHENTICATION_METHOD may name: the keys the login form uses
// (server/models/settings.js getAuthenticationsEnabled), password included.
const AUTHENTICATION_METHODS = ['password', 'ldap', 'oauth2', 'cas', 'saml', 'passwordless',
  ...OAUTH_PROVIDERS.map(provider => provider.key)];

// [key, envVar, type, options]. `key` is the field name inside the section's
// Settings sub-document; LDAP keeps the names its first eight fields and the
// bind password were already stored under. `aliases` are older spellings of the
// variable that are still read from the environment. `restart` marks a setting
// that only takes effect when WeKan starts.
const SECTIONS = {
  ldap: {
    storage: 'ldap',
    fields: [
      ['enabled', 'LDAP_ENABLE', 'boolean', { defaultValue: false }],
      ['host', 'LDAP_HOST', 'text'],
      ['port', 'LDAP_PORT', 'number'],
      ['encryption', 'LDAP_ENCRYPTION', 'choice', { choices: ['false', 'true', 'starttls'], defaultValue: 'false' }],
      ['caCert', 'LDAP_CA_CERT', 'textarea'],
      ['rejectUnauthorized', 'LDAP_REJECT_UNAUTHORIZED', 'boolean', { defaultValue: true }],
      ['baseDN', 'LDAP_BASEDN', 'text'],
      ['authentication', 'LDAP_AUTHENTIFICATION', 'boolean', { defaultValue: false }],
      ['authentificationUserDN', 'LDAP_AUTHENTIFICATION_USERDN', 'text'],
      ['bindPassword', 'LDAP_AUTHENTIFICATION_PASSWORD', 'secret'],
      ['adSimpleAuth', 'LDAP_AD_SIMPLE_AUTH', 'boolean', { defaultValue: false }],
      ['defaultDomain', 'LDAP_DEFAULT_DOMAIN', 'text'],
      ['loginFallback', 'LDAP_LOGIN_FALLBACK', 'boolean', { defaultValue: false }],
      ['migrationAllowPasswordLogin', 'LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN', 'boolean', { defaultValue: false }],
      ['reconnect', 'LDAP_RECONNECT', 'boolean'],
      ['timeout', 'LDAP_TIMEOUT', 'number'],
      ['idleTimeout', 'LDAP_IDLE_TIMEOUT', 'number'],
      ['connectTimeout', 'LDAP_CONNECT_TIMEOUT', 'number'],
      ['userAuthentication', 'LDAP_USER_AUTHENTICATION', 'boolean', { defaultValue: false }],
      ['userAuthenticationField', 'LDAP_USER_AUTHENTICATION_FIELD', 'text'],
      ['userAttributes', 'LDAP_USER_ATTRIBUTES', 'text'],
      ['userSearchFilter', 'LDAP_USER_SEARCH_FILTER', 'text'],
      ['userSearchScope', 'LDAP_USER_SEARCH_SCOPE', 'choice', { choices: ['base', 'one', 'sub'], defaultValue: 'sub' }],
      ['userSearchField', 'LDAP_USER_SEARCH_FIELD', 'text'],
      ['searchPageSize', 'LDAP_SEARCH_PAGE_SIZE', 'number'],
      ['searchSizeLimit', 'LDAP_SEARCH_SIZE_LIMIT', 'number'],
      ['groupBaseDN', 'LDAP_GROUP_BASEDN', 'text'],
      ['groupFilterEnable', 'LDAP_GROUP_FILTER_ENABLE', 'boolean', { defaultValue: false }],
      ['groupFilterObjectClass', 'LDAP_GROUP_FILTER_OBJECTCLASS', 'text'],
      ['groupFilterGroupIdAttribute', 'LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE', 'text'],
      ['groupFilterGroupMemberAttribute', 'LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE', 'text'],
      ['groupFilterGroupMemberFormat', 'LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT', 'text'],
      ['groupFilterGroupName', 'LDAP_GROUP_FILTER_GROUP_NAME', 'text'],
      ['groupFilterNested', 'LDAP_GROUP_FILTER_NESTED', 'boolean', { defaultValue: false }],
      ['uniqueIdentifierField', 'LDAP_UNIQUE_IDENTIFIER_FIELD', 'text'],
      ['utf8NamesSlugify', 'LDAP_UTF8_NAMES_SLUGIFY', 'boolean', { defaultValue: false }],
      ['usernameField', 'LDAP_USERNAME_FIELD', 'text'],
      ['fullnameField', 'LDAP_FULLNAME_FIELD', 'text'],
      ['emailField', 'LDAP_EMAIL_FIELD', 'text'],
      ['emailMatchEnable', 'LDAP_EMAIL_MATCH_ENABLE', 'boolean', { defaultValue: false }],
      ['emailMatchRequire', 'LDAP_EMAIL_MATCH_REQUIRE', 'boolean', { defaultValue: false }],
      ['emailMatchVerified', 'LDAP_EMAIL_MATCH_VERIFIED', 'boolean', { defaultValue: false }],
      ['mergeExistingUsers', 'LDAP_MERGE_EXISTING_USERS', 'boolean', { defaultValue: false }],
      ['syncUserData', 'LDAP_SYNC_USER_DATA', 'boolean', { defaultValue: false }],
      ['syncUserDataFieldmap', 'LDAP_SYNC_USER_DATA_FIELDMAP', 'textarea'],
      ['syncGroupRoles', 'LDAP_SYNC_GROUP_ROLES', 'boolean', { defaultValue: false }],
      ['syncAdminStatus', 'LDAP_SYNC_ADMIN_STATUS', 'boolean', { defaultValue: false }],
      ['syncAdminGroups', 'LDAP_SYNC_ADMIN_GROUPS', 'text'],
      ['syncOrganizations', 'LDAP_SYNC_ORGANIZATIONS', 'boolean', { defaultValue: false }],
      ['syncOrganizationsGroups', 'LDAP_SYNC_ORGANIZATIONS_GROUPS', 'text'],
      ['syncTeams', 'LDAP_SYNC_TEAMS', 'boolean', { defaultValue: false }],
      ['syncTeamsGroups', 'LDAP_SYNC_TEAMS_GROUPS', 'text'],
      ['backgroundSync', 'LDAP_BACKGROUND_SYNC', 'boolean', { defaultValue: false }],
      ['backgroundSyncInterval', 'LDAP_BACKGROUND_SYNC_INTERVAL', 'text'],
      ['backgroundSyncKeepExistantUsersUpdated', 'LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED', 'boolean', { defaultValue: false }],
      ['backgroundSyncImportNewUsers', 'LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS', 'boolean', { defaultValue: false }],
      ['backgroundSyncDisableNonexistantUsers', 'LDAP_BACKGROUND_SYNC_DISABLE_NONEXISTANT_USERS', 'boolean', { defaultValue: false }],
      ['logEnabled', 'LDAP_LOG_ENABLED', 'boolean', { defaultValue: false }],
    ],
  },
  oidc: {
    storage: 'oidc',
    fields: [
      ['enabled', 'OAUTH2_ENABLED', 'boolean', { defaultValue: false }],
      ['oracleOimEnabled', 'ORACLE_OIM_ENABLED', 'boolean', { defaultValue: false }],
      ['redirectionEnabled', 'OIDC_REDIRECTION_ENABLED', 'boolean', { defaultValue: false }],
      ['loginStyle', 'OAUTH2_LOGIN_STYLE', 'choice', { choices: ['popup', 'redirect'], defaultValue: 'popup' }],
      ['clientId', 'OAUTH2_CLIENT_ID', 'text'],
      ['secret', 'OAUTH2_SECRET', 'secret'],
      ['serverUrl', 'OAUTH2_SERVER_URL', 'url'],
      ['authEndpoint', 'OAUTH2_AUTH_ENDPOINT', 'text'],
      ['userinfoEndpoint', 'OAUTH2_USERINFO_ENDPOINT', 'text'],
      ['tokenEndpoint', 'OAUTH2_TOKEN_ENDPOINT', 'text'],
      ['logoutEndpoint', 'OAUTH2_LOGOUT_ENDPOINT', 'text'],
      ['requestPermissions', 'OAUTH2_REQUEST_PERMISSIONS', 'text'],
      ['idTokenWhitelistFields', 'OAUTH2_ID_TOKEN_WHITELIST_FIELDS', 'text'],
      ['idMap', 'OAUTH2_ID_MAP', 'text'],
      ['usernameMap', 'OAUTH2_USERNAME_MAP', 'text'],
      ['fullnameMap', 'OAUTH2_FULLNAME_MAP', 'text'],
      ['emailMap', 'OAUTH2_EMAIL_MAP', 'text'],
      ['avatarMap', 'OAUTH2_AVATAR_MAP', 'text', { defaultValue: 'picture' }],
      ['caCert', 'OAUTH2_CA_CERT', 'path'],
      ['adfsEnabled', 'OAUTH2_ADFS_ENABLED', 'boolean', { defaultValue: false }],
      ['b2cEnabled', 'OAUTH2_B2C_ENABLED', 'boolean', { defaultValue: false }],
      ['mergeExistingUsers', 'OAUTH2_MERGE_EXISTING_USERS', 'boolean', { defaultValue: false }],
      ['autoRegistration', 'OAUTH2_AUTO_REGISTRATION', 'boolean', { defaultValue: true }],
      ['adminGroups', 'OAUTH2_ADMIN_GROUPS', 'text'],
      ['allowedEmailDomains', 'OAUTH2_ALLOWED_EMAIL_DOMAINS', 'text'],
      ['propagateOidcData', 'PROPAGATE_OIDC_DATA', 'boolean', { defaultValue: false }],
      ['secretJwtKeyPath', 'OAUTH2_SECRET_JWT_KEY_PATH', 'path'],
      ['secretJwtIssuer', 'OAUTH2_SECRET_JWT_ISSUER', 'text'],
      ['secretJwtKeyId', 'OAUTH2_SECRET_JWT_KEY_ID', 'text'],
      ['secretJwtAudience', 'OAUTH2_SECRET_JWT_AUDIENCE', 'text', { defaultValue: 'https://appleid.apple.com' }],
      ['secretJwtSubject', 'OAUTH2_SECRET_JWT_SUBJECT', 'text'],
      ['secretJwtExpiresIn', 'OAUTH2_SECRET_JWT_EXPIRES_IN', 'number'],
    ],
  },
  cas: {
    storage: 'cas',
    fields: [
      ['enabled', 'CAS_ENABLED', 'boolean', { defaultValue: false }],
      ['baseUrl', 'CAS_BASE_URL', 'url'],
      ['loginUrl', 'CAS_LOGIN_URL', 'url'],
      // CASE_VALIDATE_URL is the misspelling the code used to read, so an
      // install that set it keeps working.
      ['validateUrl', 'CAS_VALIDATE_URL', 'url', { aliases: ['CASE_VALIDATE_URL'] }],
      ['mergeExistingUsers', 'CAS_MERGE_EXISTING_USERS', 'boolean', { defaultValue: false }],
    ],
  },
  headerLogin: {
    storage: 'headerLogin',
    fields: [
      ['id', 'HEADER_LOGIN_ID', 'text'],
      ['email', 'HEADER_LOGIN_EMAIL', 'text'],
      ['firstname', 'HEADER_LOGIN_FIRSTNAME', 'text'],
      ['lastname', 'HEADER_LOGIN_LASTNAME', 'text'],
      ['trustedIps', 'HEADER_LOGIN_TRUSTED_IPS', 'text', { aliases: ['HEADER_LOGIN_TRUSTED_IP'] }],
      ['trustedProxies', 'HEADER_LOGIN_TRUSTED_PROXIES', 'text'],
    ],
  },
  login: {
    storage: 'loginOptions',
    fields: [
      ['passwordLoginEnabled', 'PASSWORD_LOGIN_ENABLED', 'boolean', { defaultValue: true }],
      // Chosen here, it wins over the environment variable; left at Default,
      // the variable decides, as it always did (#5879).
      ['defaultAuthenticationMethod', 'DEFAULT_AUTHENTICATION_METHOD', 'choice', { choices: AUTHENTICATION_METHODS, defaultValue: 'password' }],
      ['loginExpirationInDays', 'ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS', 'number', { defaultValue: 90, restart: true }],
    ],
  },
};

const AUTH_CONFIG_SECTIONS = {};
const BY_ENV_VAR = {};
for (const [section, { storage, fields }] of Object.entries(SECTIONS)) {
  AUTH_CONFIG_SECTIONS[section] = {
    storage,
    fields: fields.map(([key, envVar, type, options = {}]) => {
      const field = {
        key, envVar, type, section, storage,
        secret: type === 'secret',
        // A secret can also come from a file named by <NAME>_FILE (Docker /
        // Kubernetes secrets), so the password is never in the environment.
        // That path is an environment variable only, deliberately: settable
        // in the Admin Panel, together with the LDAP host or the OAuth2 token
        // endpoint, it would make the server read any file and send it there.
        fileVar: type === 'secret' ? `${envVar}_FILE` : null,
        choices: options.choices || null,
        aliases: options.aliases || [],
        defaultValue: options.defaultValue === undefined ? null : options.defaultValue,
        restart: options.restart === true,
      };
      for (const name of [envVar, ...field.aliases]) BY_ENV_VAR[name] = field;
      return field;
    }),
  };
}

function authConfigField(envVar) {
  return BY_ENV_VAR[envVar] || null;
}

function isUnset(value) {
  return value === undefined || value === null || value === '';
}

// The value the Admin Panel stored for one field, or undefined when it has
// none. `docs` is the Settings document (or the subset holding the sections).
function adminValue(field, doc) {
  const stored = doc && doc[field.storage];
  if (!stored || typeof stored !== 'object') return undefined;
  const value = stored[field.key];
  return isUnset(value) ? undefined : value;
}

// Environment-variable shaped: always a string or undefined, exactly what
// process.env would hold, so code that compares `=== 'true'` or parses an
// integer keeps working unchanged when the value comes from the Admin Panel.
function asEnvString(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return String(value);
}

function defaultReadFile(file) {
  // Required lazily: the client loads this catalog for its field lists and
  // never reaches a secret.
  // eslint-disable-next-line global-require
  return require('fs').readFileSync(file, 'utf8');
}

// The secret in the file <NAME>_FILE names. A secret file ends with a line
// break more often than not; that is not part of the password, any other
// character is. { value } when the file has one, { error } when it cannot be
// read, {} when the variable is not set.
function secretFromFile(field, env, readFile = defaultReadFile) {
  const file = env[field.fileVar];
  if (isUnset(file)) return {};
  try {
    const value = String(readFile(String(file))).replace(/(\r?\n)+$/, '');
    return value === '' ? { error: 'empty' } : { value };
  } catch (e) {
    return { error: e && e.code ? e.code : 'unreadable' };
  }
}

// The effective value of a login environment variable: the Admin Panel
// override when there is one, otherwise the environment (the variable itself,
// then its older aliases, and for a secret the file <NAME>_FILE names). A name
// the catalog does not list is plain env.
function resolveAuthEnv(name, doc, env = process.env, options = {}) {
  const field = BY_ENV_VAR[name];
  if (field) {
    const stored = adminValue(field, doc);
    if (stored !== undefined) return asEnvString(stored);
    if (name !== field.envVar) return env[name];
    // An older spelling wins over the current one, as it did when the code
    // read it first (HEADER_LOGIN_TRUSTED_IP, CASE_VALIDATE_URL), so an
    // environment-only install behaves exactly as before.
    for (const envName of [...field.aliases, field.envVar]) {
      if (!isUnset(env[envName])) return env[envName];
    }
    if (field.fileVar) {
      const fromFile = secretFromFile(field, env, options.readFile);
      if (fromFile.value !== undefined) return fromFile.value;
    }
    return env[field.envVar];
  }
  return env[name];
}

function sourceOf(field, doc, env, readFile) {
  if (adminValue(field, doc) !== undefined) return 'admin';
  for (const envName of [field.envVar, ...field.aliases]) {
    if (!isUnset(env[envName])) return 'env';
  }
  if (field.fileVar) {
    const fromFile = secretFromFile(field, env, readFile);
    if (fromFile.value !== undefined) return 'file';
    if (fromFile.error) return 'file-error';
  }
  return 'default';
}

// What the Admin Panel may see of one section. Secrets: only whether one is
// set and where it comes from - never the value, from either source. Every
// other value: redacted of credentials written inside a URL, on the server.
// A secret from a file is reported as { source: 'file' }; a <NAME>_FILE that
// cannot be read as { source: 'file-error' }, so the Admin Panel can say why a
// login fails - the file's path and content are never part of the answer.
function authConfigSources(section, doc, env = process.env, options = {}) {
  const spec = AUTH_CONFIG_SECTIONS[section];
  if (!spec) throw new TypeError(`Unknown login settings section: ${section}`);
  const overrides = {};
  const sources = {};
  for (const field of spec.fields) {
    const source = sourceOf(field, doc, env, options.readFile);
    if (field.secret) {
      sources[field.key] = { source, hasValue: !['default', 'file-error'].includes(source) };
      continue;
    }
    const stored = adminValue(field, doc);
    if (stored !== undefined) overrides[field.key] = redactValue(stored);
    const effective = resolveAuthEnv(field.envVar, doc, env);
    sources[field.key] = {
      source,
      value: redactValue(effective === undefined ? field.defaultValue : effective),
    };
  }
  return { overrides, sources };
}

function redactValue(value) {
  return typeof value === 'string' ? redactCredentialsInUrl(value) : value;
}

const MAX_TEXT = 4096;
const MAX_TEXTAREA = 65536;

// Turn an Admin Panel submission into the `$set`/`$unset` for one section.
// Empty or null means "no override": the environment variable applies again.
// A secret left empty keeps the stored one (the form never holds it); the
// explicit `clearSecrets: [key]` list removes it. Unknown keys are refused, so
// nothing outside the catalog can be written through this path.
function cleanAuthConfigInput(section, input) {
  const spec = AUTH_CONFIG_SECTIONS[section];
  if (!spec) throw new TypeError(`Unknown login settings section: ${section}`);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Login settings must be an object');
  }
  const clearSecrets = input.clearSecrets === undefined ? [] : input.clearSecrets;
  if (!Array.isArray(clearSecrets)) throw new TypeError('clearSecrets must be a list');
  const set = {};
  const unset = {};
  for (const [key, raw] of Object.entries(input)) {
    if (key === 'clearSecrets') continue;
    const field = spec.fields.find(item => item.key === key);
    if (!field) throw new TypeError(`Unknown ${section} setting: ${key}`);
    const path = `${spec.storage}.${key}`;
    if (field.secret) {
      if (isUnset(raw)) continue;
      if (typeof raw !== 'string' || raw.length > MAX_TEXT) throw new TypeError(`Invalid ${field.envVar}`);
      set[path] = raw;
      set[`${path}Set`] = true;
      continue;
    }
    if (isUnset(raw)) { unset[path] = ''; continue; }
    set[path] = cleanValue(field, raw);
  }
  for (const key of clearSecrets) {
    const field = spec.fields.find(item => item.key === key && item.secret);
    if (!field) throw new TypeError(`Not a secret ${section} setting: ${key}`);
    const path = `${spec.storage}.${key}`;
    if (set[path] !== undefined) throw new TypeError(`${field.envVar} cannot be set and cleared at once`);
    unset[path] = '';
    set[`${path}Set`] = false;
  }
  return { set, unset };
}

function cleanValue(field, raw) {
  switch (field.type) {
    case 'boolean':
      if (raw === true || raw === 'true') return true;
      if (raw === false || raw === 'false') return false;
      throw new TypeError(`Invalid ${field.envVar}`);
    case 'number': {
      const number = typeof raw === 'number' ? raw : Number(String(raw).trim());
      if (!Number.isFinite(number) || number < 0) throw new TypeError(`Invalid ${field.envVar}`);
      return number;
    }
    case 'choice':
      if (!field.choices.includes(raw)) throw new TypeError(`Invalid ${field.envVar}`);
      return raw;
    default: {
      if (typeof raw !== 'string') throw new TypeError(`Invalid ${field.envVar}`);
      const value = raw.trim();
      if (value.length > (field.type === 'textarea' ? MAX_TEXTAREA : MAX_TEXT)) {
        throw new TypeError(`Invalid ${field.envVar}`);
      }
      if (field.type === 'url') {
        let url;
        try { url = new URL(value); } catch (e) { throw new TypeError(`Invalid ${field.envVar} URL`); }
        if (!['http:', 'https:'].includes(url.protocol)) throw new TypeError(`Invalid ${field.envVar} URL`);
        // A password belongs in its own secret field, which never reaches a
        // browser; inside a URL it would be stored and shown with the rest.
        if (url.username || url.password) throw new TypeError(`${field.envVar} must not contain a user name or password`);
      }
      if (field.type === 'path') {
        // The server reads this file. Only an absolute path to a file, never a
        // relative one or one that climbs out with '..'.
        if (!value.startsWith('/') || value.split('/').includes('..') || value.includes('\0')) {
          throw new TypeError(`${field.envVar} must be an absolute file path`);
        }
      }
      return value;
    }
  }
}

// Every variable the catalog knows, in order, for platform checks and docs -
// the secrets' <NAME>_FILE variants included.
function authConfigEnvVars() {
  return Object.values(AUTH_CONFIG_SECTIONS).flatMap(section => section.fields
    .flatMap(field => (field.fileVar ? [field.envVar, field.fileVar] : [field.envVar])));
}

module.exports = {
  AUTH_CONFIG_SECTIONS,
  authConfigField,
  authConfigEnvVars,
  resolveAuthEnv,
  authConfigSources,
  cleanAuthConfigInput,
};

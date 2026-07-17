import { Client } from 'ldapts';
import { Log } from 'meteor/logging';
import { normalizeLdapEncryption } from './encryptionSetting';
import { buildUserIdFilter } from './userIdFilter';

// #4158: warn about a deprecated/invalid LDAP_ENCRYPTION value only once per
// distinct message, not on every single login attempt (LDAP instantiates a
// new connection per login).
const encryptionWarningsShown = new Set();
function warnOnceAboutEncryption(warning) {
  if (warning && !encryptionWarningsShown.has(warning)) {
    encryptionWarningsShown.add(warning);
    Log.warn(warning);
  }
}

// copied from https://github.com/ldapjs/node-ldapjs/blob/a113953e0d91211eb945d2a3952c84b7af6de41c/lib/filters/index.js#L167
function escapedToHex (str) {
  if (str !== undefined) {
    return str.replace(/\\([0-9a-f][^0-9a-f]|[0-9a-f]$|[^0-9a-f]|$)/gi, function (match, p1) {
      if (!p1) {
        return '\\5c';
      }

      const hexCode = p1.charCodeAt(0).toString(16);
      const rest = p1.substring(1);
      return '\\' + hexCode + rest;
    });
  } else {
    return undefined;
  }
}

// Convert hex string to LDAP escaped binary filter value
// e.g. "0102ff" -> "\\01\\02\\ff"
function hexToLdapEscaped(hex) {
  return hex.match(/.{2}/g).map(h => '\\' + h).join('');
}

// #5236: RFC 4515 escaping for an LDAP filter assertion value, so a value taken
// from the directory (e.g. a member DN or cn containing parentheses) cannot
// break the filter ("illegal unescaped char: (") or be used for injection. The
// backslash is escaped first; output uses single-backslash hex escapes (\28,
// \29, …), matching escapedToHex so the existing filter post-processing treats
// it the same way as the escaped username.
function escapeLdapFilterValue(value) {
  if (value === undefined || value === null) {
    return value;
  }
  return String(value)
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\0/g, '\\00');
}

export default class LDAP {
  constructor() {
    this.connected = false;

    this.options = {
      host                               : this.constructor.settings_get('LDAP_HOST'),
      port                               : this.constructor.settings_get('LDAP_PORT'),
      Reconnect                          : this.constructor.settings_get('LDAP_RECONNECT'),
      timeout                            : this.constructor.settings_get('LDAP_TIMEOUT'),
      connect_timeout                    : this.constructor.settings_get('LDAP_CONNECT_TIMEOUT'),
      idle_timeout                       : this.constructor.settings_get('LDAP_IDLE_TIMEOUT'),
      // #4158: normalized to 'tls' (LDAPS), 'starttls' or 'off'. Accepts the
      // documented 'true'/'starttls'/'false' plus the legacy 'ssl'/'tls'
      // (deprecated but still working); anything else warns and means 'off'.
      encryption                         : normalizeLdapEncryption(this.constructor.settings_get('LDAP_ENCRYPTION')).mode,
      ca_cert                            : this.constructor.settings_get('LDAP_CA_CERT'),
      reject_unauthorized                : this.constructor.settings_get('LDAP_REJECT_UNAUTHORIZED') !== undefined ? this.constructor.settings_get('LDAP_REJECT_UNAUTHORIZED') : true,
      Authentication                     : this.constructor.settings_get('LDAP_AUTHENTIFICATION'),
      Authentication_UserDN              : this.constructor.settings_get('LDAP_AUTHENTIFICATION_USERDN'),
      Authentication_Password            : this.constructor.settings_get('LDAP_AUTHENTIFICATION_PASSWORD'),
      Authentication_Fallback            : this.constructor.settings_get('LDAP_LOGIN_FALLBACK'),
      BaseDN                             : this.constructor.settings_get('LDAP_BASEDN'),
      Internal_Log_Level                 : this.constructor.settings_get('INTERNAL_LOG_LEVEL'), //this setting does not have any effect any more and should be deprecated
      User_Authentication                : this.constructor.settings_get('LDAP_USER_AUTHENTICATION'),
      User_Authentication_Field          : this.constructor.settings_get('LDAP_USER_AUTHENTICATION_FIELD'),
      User_Attributes                    : this.constructor.settings_get('LDAP_USER_ATTRIBUTES'),
      User_Search_Filter                 : escapedToHex(this.constructor.settings_get('LDAP_USER_SEARCH_FILTER')),
      User_Search_Scope                  : this.constructor.settings_get('LDAP_USER_SEARCH_SCOPE'),
      User_Search_Field                  : this.constructor.settings_get('LDAP_USER_SEARCH_FIELD'),
      Search_Page_Size                   : this.constructor.settings_get('LDAP_SEARCH_PAGE_SIZE'),
      Search_Size_Limit                  : this.constructor.settings_get('LDAP_SEARCH_SIZE_LIMIT'),
      group_filter_enabled               : this.constructor.settings_get('LDAP_GROUP_FILTER_ENABLE'),
      group_filter_object_class          : this.constructor.settings_get('LDAP_GROUP_FILTER_OBJECTCLASS'),
      group_filter_group_id_attribute    : this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE'),
      group_filter_group_member_attribute: this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE'),
      group_filter_group_member_format   : this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT'),
      group_filter_group_name            : this.constructor.settings_get('LDAP_GROUP_FILTER_GROUP_NAME'),
      AD_Simple_Auth                     : this.constructor.settings_get('LDAP_AD_SIMPLE_AUTH'),
      Default_Domain                     : this.constructor.settings_get('LDAP_DEFAULT_DOMAIN'),
    };
  }

  static settings_get(name, ...args) {
    let value = process.env[name];
    if (value !== undefined) {
      if (value === 'true' || value === 'false') {
        value = JSON.parse(value);
      } else if (value !== '' && !isNaN(value)) {
        value = Number(value);
      }
      return value;
    } else {
      //Log.warn(`Lookup for unset variable: ${name}`);
    }
  }

  async connect() {
    Log.info('Init setup');

    const tlsOptions = {
      rejectUnauthorized: this.options.reject_unauthorized,
    };

    if (this.options.ca_cert && this.options.ca_cert !== '') {
      // Split CA cert into array of strings
      const chainLines = this.constructor.settings_get('LDAP_CA_CERT').replace(/\\n/g,'\n').split('\n');
      let cert         = [];
      const ca         = [];
      chainLines.forEach((line) => {
        cert.push(line);
        if (line.match(/-END CERTIFICATE-/)) {
          ca.push(cert.join('\n'));
          cert = [];
        }
      });
      tlsOptions.ca = ca;
    }

    // #4158: surface a deprecation notice for legacy values ('ssl', 'tls')
    // and a clear warning for unknown values instead of failing silently.
    warnOnceAboutEncryption(
      normalizeLdapEncryption(this.constructor.settings_get('LDAP_ENCRYPTION')).warning,
    );

    let url;
    if (this.options.encryption === 'tls') {
      url = `ldaps://${this.options.host}:${this.options.port}`;
    } else {
      url = `ldap://${this.options.host}:${this.options.port}`;
    }

    Log.info(`Connecting ${url}`);

    const clientOptions = {
      url,
      timeout       : this.options.timeout,
      connectTimeout: this.options.connect_timeout,
      strictDN      : false,
    };

    if (this.options.encryption === 'tls') {
      clientOptions.tlsOptions = tlsOptions;
    }

    Log.debug(`clientOptions ${JSON.stringify(clientOptions)}`);

    this.client = new Client(clientOptions);

    if (this.options.encryption === 'starttls') {
      // Set host parameter for tls.connect which is used by starttls. This shouldn't be needed in newer nodejs versions (e.g v5.6.0).
      // https://github.com/RocketChat/Rocket.Chat/issues/2035
      tlsOptions.host = this.options.host;

      Log.info('Starting TLS');
      Log.debug(`tlsOptions ${JSON.stringify(tlsOptions)}`);

      await this.client.startTLS(tlsOptions);
      Log.info('TLS connected');
    }

    this.connected = true;
  }

  async bind(dn, password) {
    await this.client.bind(dn, password);
  }

  getBufferAttributes() {
    const fields = [];
    let uidField = this.constructor.settings_get('LDAP_UNIQUE_IDENTIFIER_FIELD');
    if (uidField && uidField !== '') {
      fields.push(...uidField.replace(/\s/g, '').split(','));
    }
    let searchField = this.constructor.settings_get('LDAP_USER_SEARCH_FIELD');
    if (searchField && searchField !== '') {
      fields.push(...searchField.replace(/\s/g, '').split(','));
    }
    return fields;
  }

  async searchAll(BaseDN, options) {
    const searchOptions = {
      filter: options.filter,
      scope : options.scope || 'sub',
    };

    if (options.attributes) {
      searchOptions.attributes = options.attributes;
    }

    if (options.sizeLimit) {
      searchOptions.sizeLimit = options.sizeLimit;
    }

    if (options.paged) {
      searchOptions.paged = {
        pageSize: options.paged.pageSize || 250,
      };
    }

    // Request unique identifier fields as Buffers so that
    // getLdapUserUniqueID() in sync.js can call .toString('hex')
    const bufferAttributes = this.getBufferAttributes();
    if (bufferAttributes.length > 0) {
      searchOptions.explicitBufferAttributes = bufferAttributes;
    }

    const { searchEntries } = await this.client.search(BaseDN, searchOptions);

    Log.info(`Search result count ${searchEntries.length}`);
    return searchEntries.map((entry) => this.extractLdapEntryData(entry));
  }

  extractLdapEntryData(entry) {
    const values = {
      _raw: {},
    };

    for (const key of Object.keys(entry)) {
      const value = entry[key];
      values._raw[key] = value;

      if (!['thumbnailPhoto', 'jpegPhoto'].includes(key)) {
        if (value instanceof Buffer) {
          values[key] = value.toString();
        } else {
          values[key] = value;
        }
      }
    }

    return values;
  }

  getUserFilter(username) {
    const filter = [];

    if (this.options.User_Search_Filter !== '') {
      if (this.options.User_Search_Filter[0] === '(') {
        filter.push(`${this.options.User_Search_Filter}`);
      } else {
        filter.push(`(${this.options.User_Search_Filter})`);
      }
    }

    // Escape the username to prevent LDAP injection
    const escapedUsername = escapedToHex(username);
    const usernameFilter = this.options.User_Search_Field.split(',').map((item) => `(${item}=${escapedUsername})`);

    if (usernameFilter.length === 0) {
      Log.error('LDAP_LDAP_User_Search_Field not defined');
    } else if (usernameFilter.length === 1) {
      filter.push(`${usernameFilter[0]}`);
    } else {
      filter.push(`(|${usernameFilter.join('')})`);
    }

    return `(&${filter.join('')})`;
  }

  async bindUserIfNecessary(username, password) {

    if (this.domainBinded === true) {
      return;
    }

    if (!this.options.User_Authentication) {
      return;
    }

    /* if SimpleAuth is configured, the BaseDN is not needed */
    if (!this.options.BaseDN && !this.options.AD_Simple_Auth) throw new Error('BaseDN is not provided');

    // Escape the username to prevent LDAP injection in DN construction
    const escapedUsername = escapedToHex(username);
    var userDn = "";
    if (this.options.AD_Simple_Auth === true || this.options.AD_Simple_Auth === 'true') {
      userDn = `${escapedUsername}@${this.options.Default_Domain}`;
    } else {
      userDn = `${this.options.User_Authentication_Field}=${escapedUsername},${this.options.BaseDN}`;
    }

    Log.info(`Binding with User ${userDn}`);

    await this.bind(userDn, password);
    this.domainBinded = true;
  }

  async bindIfNecessary() {
    if (this.domainBinded === true) {
      return;
    }

    if (this.options.Authentication !== true) {
      return;
    }

    Log.info(`Binding UserDN ${this.options.Authentication_UserDN}`);

    await this.bind(this.options.Authentication_UserDN, this.options.Authentication_Password);
    this.domainBinded = true;
  }

  async searchUsers(username) {
    await this.bindIfNecessary();
    const searchOptions = {
      filter   : this.getUserFilter(username),
      scope    : this.options.User_Search_Scope || 'sub',
      sizeLimit: this.options.Search_Size_Limit,
    };

    if (!!this.options.User_Attributes) searchOptions.attributes = this.options.User_Attributes.split(',');

    if (this.options.Search_Page_Size > 0) {
      searchOptions.paged = {
        pageSize: this.options.Search_Page_Size,
      };
    }

    Log.info(`Searching user ${username}`);
    Log.debug(`searchOptions ${searchOptions}`);
    Log.debug(`BaseDN ${this.options.BaseDN}`);

    return await this.searchAll(this.options.BaseDN, searchOptions);
  }

  async getUserById(id, attribute) {
    await this.bindIfNecessary();

    const escapedValue = hexToLdapEscaped(id);

    // #4654: the stored services.ldap.id may come from LDAP_UNIQUE_IDENTIFIER_FIELD
    // or, when that is unset/empty, from LDAP_USER_SEARCH_FIELD (see
    // getLdapUserUniqueID in sync.js), so search over both attribute lists.
    // The old code read only LDAP_UNIQUE_IDENTIFIER_FIELD and crashed
    // (undefined.split) or built the invalid filter "(|(=value))" when it was
    // unset/empty, so background sync never updated existing users.
    const filter = buildUserIdFilter(
      attribute,
      escapedValue,
      this.constructor.settings_get('LDAP_UNIQUE_IDENTIFIER_FIELD'),
      this.constructor.settings_get('LDAP_USER_SEARCH_FIELD'),
    );

    if (!filter) {
      Log.error('Can\'t search user by id: neither LDAP_UNIQUE_IDENTIFIER_FIELD nor LDAP_USER_SEARCH_FIELD is configured');
      return;
    }

    const searchOptions = {
      filter,
      scope: 'sub',
    };

    Log.info(`Searching by id ${id}`);
    Log.debug(`search filter ${searchOptions.filter}`);
    Log.debug(`BaseDN ${this.options.BaseDN}`);

    const result = await this.searchAll(this.options.BaseDN, searchOptions);

    if (!Array.isArray(result) || result.length === 0) {
      return;
    }

    if (result.length > 1) {
      Log.error(`Search by id ${id} returned ${result.length} records`);
    }

    return result[0];
  }

  async getUserByUsername(username) {
    await this.bindIfNecessary();

    const searchOptions = {
      filter: this.getUserFilter(username),
      scope : this.options.User_Search_Scope || 'sub',
    };

    Log.info(`Searching user ${username}`);
    Log.debug(`searchOptions ${searchOptions}`);
    Log.debug(`BaseDN ${this.options.BaseDN}`);

    const result = await this.searchAll(this.options.BaseDN, searchOptions);

    if (!Array.isArray(result) || result.length === 0) {
      return;
    }

    if (result.length > 1) {
      Log.error(`Search by username ${username} returned ${result.length} records`);
    }

    return result[0];
  }

  async getUserGroups(username, ldapUser) {
    // The LDAP group search is needed by three independent features:
    //   - the login restriction filter (LDAP_GROUP_FILTER_ENABLE, via isUserInGroup)
    //   - admin status sync (LDAP_SYNC_ADMIN_STATUS / LDAP_SYNC_ADMIN_GROUPS)
    //   - group->role sync (LDAP_SYNC_GROUP_ROLES)
    // Previously this short-circuited on group_filter_enabled only, which made
    // admin/role sync silently unreachable unless the login-restriction filter
    // was also enabled. Gate on any consumer being enabled so the concerns are
    // decoupled, while still skipping the query when no feature needs groups.
    const groupFilterEnabled = this.options.group_filter_enabled;
    const adminSyncEnabled    = this.constructor.settings_get('LDAP_SYNC_ADMIN_STATUS') === true;
    const groupRolesSync      = this.constructor.settings_get('LDAP_SYNC_GROUP_ROLES') === true;
    // #4737: org/team sync is another consumer of the user's groups.
    const orgTeamSync         =
      this.constructor.settings_get('LDAP_SYNC_ORGANIZATIONS') === true ||
      this.constructor.settings_get('LDAP_SYNC_TEAMS') === true;

    if (!groupFilterEnabled && !adminSyncEnabled && !groupRolesSync && !orgTeamSync) {
      return [];
    }

    const filter = ['(&'];

    if (this.options.group_filter_object_class !== '') {
      filter.push(`(objectclass=${this.options.group_filter_object_class})`);
    }

    if (this.options.group_filter_group_member_attribute !== '') {
      const format_value = ldapUser[this.options.group_filter_group_member_format];
      if (format_value) {
        filter.push(`(${this.options.group_filter_group_member_attribute}=${escapeLdapFilterValue(format_value)})`);
      }
    }

    filter.push(')');

    // Escape the username to prevent LDAP injection
    const escapedUsername = escapedToHex(username);
    const searchOptions = {
      filter: filter.join('').replace(/#{username}/g, escapedUsername),
      scope : 'sub',
    };

    Log.debug(`Group list filter LDAP: ${searchOptions.filter}`);

    const result = await this.searchAll(this.options.BaseDN, searchOptions);

    if (!Array.isArray(result) || result.length === 0) {
      return [];
    }

    const grp_identifier = this.options.group_filter_group_id_attribute || 'cn';
    const groups         = [];
    result.map((item) => {
      groups.push(item[grp_identifier]);
    });
    Log.debug(`Groups: ${groups.join(', ')}`);
    return groups;

  }

  async isUserInGroup(username, ldapUser) {
    if (!this.options.group_filter_enabled) {
      return true;
    }

    const grps = await this.getUserGroups(username, ldapUser);

    const filter = ['(&'];

    if (this.options.group_filter_object_class !== '') {
      filter.push(`(objectclass=${this.options.group_filter_object_class})`);
    }

    if (this.options.group_filter_group_member_attribute !== '') {
      const format_value = ldapUser[this.options.group_filter_group_member_format];
      if (format_value) {
        filter.push(`(${this.options.group_filter_group_member_attribute}=${escapeLdapFilterValue(format_value)})`);
      }
    }

    if (this.options.group_filter_group_id_attribute !== '') {
      // #4036: LDAP_GROUP_FILTER_GROUP_NAME accepts a comma-separated list, and
      // members of LDAP_SYNC_ADMIN_GROUPS may also log in when admin sync is on
      // (previously an admin only in the admin group was locked out entirely).
      const names = String(this.options.group_filter_group_name || '')
        .split(',').map((s) => s.trim()).filter(Boolean);
      if (this.constructor.settings_get('LDAP_SYNC_ADMIN_STATUS') === true) {
        names.push(...String(this.constructor.settings_get('LDAP_SYNC_ADMIN_GROUPS') || '')
          .split(',').map((s) => s.trim()).filter(Boolean));
      }
      const clauses = names.map((n) => `(${this.options.group_filter_group_id_attribute}=${n})`);
      if (clauses.length === 1) {
        filter.push(clauses[0]);
      } else if (clauses.length > 1) {
        filter.push(`(|${clauses.join('')})`);
      }
    }
    filter.push(')');

    // Escape the username to prevent LDAP injection
    const escapedUsername = escapedToHex(username);
    const searchOptions = {
      filter: filter.join('').replace(/#{username}/g, escapedUsername),
      scope : 'sub',
    };

    Log.debug(`Group filter LDAP: ${searchOptions.filter}`);

    const result = await this.searchAll(this.options.BaseDN, searchOptions);

    if (!Array.isArray(result) || result.length === 0) {
      return false;
    }
    return true;
  }

  async auth(dn, password) {
    Log.info(`Authenticating ${dn}`);

    try {
      if (password === '') {
        throw new Error('Password is not provided');
      }
      await this.bind(dn, password);
      Log.info(`Authenticated ${dn}`);
      return true;
    } catch (error) {
      Log.info(`Not authenticated ${dn}`);
      Log.debug('error', error);
      return false;
    }
  }

  async disconnect() {
    this.connected    = false;
    this.domainBinded = false;
    // #6467/#6469: disconnect() is now called in a finally on every login and
    // sync exit path, including paths where connect() was never reached or
    // failed early. Guard against a missing client so releasing the connection
    // is always a safe no-op and can never throw over the original result.
    if (!this.client) {
      return;
    }
    Log.info('Disconecting');
    try {
      await this.client.unbind();
    } catch (error) {
      Log.debug('Error during disconnect', error);
    }
  }
}

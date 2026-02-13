import { Client } from 'ldapts';
import { Log } from 'meteor/logging';

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
      encryption                         : this.constructor.settings_get('LDAP_ENCRYPTION'),
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

    let url;
    if (this.options.encryption === 'ssl') {
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

    if (this.options.encryption === 'ssl') {
      clientOptions.tlsOptions = tlsOptions;
    }

    Log.debug(`clientOptions ${JSON.stringify(clientOptions)}`);

    this.client = new Client(clientOptions);

    if (this.options.encryption === 'tls') {
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

    const Unique_Identifier_Field = this.constructor.settings_get('LDAP_UNIQUE_IDENTIFIER_FIELD').split(',');

    const escapedValue = hexToLdapEscaped(id);
    let filter;

    if (attribute) {
      filter = `(${attribute}=${escapedValue})`;
    } else {
      const filters = Unique_Identifier_Field.map((item) => `(${item}=${escapedValue})`);
      filter = `(|${filters.join('')})`;
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
    if (!this.options.group_filter_enabled) {
      return true;
    }

    const filter = ['(&'];

    if (this.options.group_filter_object_class !== '') {
      filter.push(`(objectclass=${this.options.group_filter_object_class})`);
    }

    if (this.options.group_filter_group_member_attribute !== '') {
      const format_value = ldapUser[this.options.group_filter_group_member_format];
      if (format_value) {
        filter.push(`(${this.options.group_filter_group_member_attribute}=${format_value})`);
      }
    }

    filter.push(')');

    // Escape the username to prevent LDAP injection
    const escapedUsername = escapedToHex(username);
    const searchOptions = {
      filter: filter.join('').replace(/#{username}/g, escapedUsername).replace("\\", "\\\\"),
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
        filter.push(`(${this.options.group_filter_group_member_attribute}=${format_value})`);
      }
    }

    if (this.options.group_filter_group_id_attribute !== '') {
      filter.push(`(${this.options.group_filter_group_id_attribute}=${this.options.group_filter_group_name})`);
    }
    filter.push(')');

    // Escape the username to prevent LDAP injection
    const escapedUsername = escapedToHex(username);
    const searchOptions = {
      filter: filter.join('').replace(/#{username}/g, escapedUsername).replace("\\", "\\\\"),
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
    Log.info('Disconecting');
    try {
      await this.client.unbind();
    } catch (error) {
      Log.debug('Error during disconnect', error);
    }
  }
}

import { SyncedCron } from 'meteor/quave:synced-cron';
import { DDP } from 'meteor/ddp';
import limax from 'limax';
import LDAP from './ldap';
import { slugifyPreservingHyphens } from './usernameSlug';
import { parseGroupAllowlist, filterGroupsByAllowlist } from './groupAllowlist';
import { runWithLdapDisconnect } from './connectionGuard';
import { log_debug, log_info, log_warn, log_error } from './logger';
import { getLdapPhotoBuffer } from './ldapPhoto';

Object.defineProperty(Object.prototype, "getLDAPValue", {
  value: function (prop) {
      const self = this;
      for (let key in self) {
          if (key.toLowerCase() == prop.toLowerCase()) {
              return self[key];
          }
      }
  },

  enumerable: false
});

export function slug(text) {
  if (LDAP.settings_get('LDAP_UTF8_NAMES_SLUGIFY') !== true) {
    return text;
  }
  // #4653: slugify each hyphen-separated segment and rejoin with '-' so a
  // username like "p.parta-partb" is NOT collapsed to "p.parta.partb" (limax's
  // '.' separator would otherwise swallow the hyphen and break login).
  return slugifyPreservingHyphens(text, part => limax(part, { separator: '.' }));
}

function templateVarHandler (variable, object) {

  const templateRegex = /#{([\w\-]+)}/gi;
  let match = templateRegex.exec(variable);
  let tmpVariable = variable;

  if (match == null) {
    if (!object.hasOwnProperty(variable)) {
      return;
    }
    return object[variable];
  } else {
    while (match != null) {
      const tmplVar = match[0];
      const tmplAttrName = match[1];

      if (!object.hasOwnProperty(tmplAttrName)) {
        return;
      }

      const attrVal = object[tmplAttrName];
      tmpVariable = tmpVariable.replace(tmplVar, attrVal);
      match = templateRegex.exec(variable);
    }
    return tmpVariable;
  }
}

export function getPropertyValue(obj, key) {
  try {
    return key.split('.').reduce((acc, el) => acc[el], obj);
  } catch (err) {
    return undefined;
  }
}

export function getLdapUsername(ldapUser) {
  const usernameField = LDAP.settings_get('LDAP_USERNAME_FIELD');

  if (usernameField.indexOf('#{') > -1) {
    return usernameField.replace(/#{(.+?)}/g, function(match, field) {
      return ldapUser.getLDAPValue(field);
    });
  }

  return ldapUser.getLDAPValue(usernameField);
}

export function getLdapEmail(ldapUser) {
  const emailField = LDAP.settings_get('LDAP_EMAIL_FIELD');

  if (emailField.indexOf('#{') > -1) {
    return emailField.replace(/#{(.+?)}/g, function(match, field) {
      return ldapUser.getLDAPValue(field);
    });
  }

  const ldapMail = ldapUser.getLDAPValue(emailField);
  if (typeof ldapMail === 'string') {
    return ldapMail;
  } else {
    return ldapMail[0].toString();
  }
}

export function getLdapFullname(ldapUser) {
  const fullnameField = LDAP.settings_get('LDAP_FULLNAME_FIELD');
  if (fullnameField.indexOf('#{') > -1) {
    return fullnameField.replace(/#{(.+?)}/g, function(match, field) {
      return ldapUser.getLDAPValue(field);
    });
  }
  return ldapUser.getLDAPValue(fullnameField);
}

export function getLdapUserUniqueID(ldapUser) {
  let Unique_Identifier_Field = LDAP.settings_get('LDAP_UNIQUE_IDENTIFIER_FIELD');

  if (Unique_Identifier_Field !== '') {
    Unique_Identifier_Field = Unique_Identifier_Field.replace(/\s/g, '').split(',');
  } else {
    Unique_Identifier_Field = [];
  }

  let User_Search_Field = LDAP.settings_get('LDAP_USER_SEARCH_FIELD');

  if (User_Search_Field !== '') {
    User_Search_Field = User_Search_Field.replace(/\s/g, '').split(',');
  } else {
    User_Search_Field = [];
  }

  Unique_Identifier_Field = Unique_Identifier_Field.concat(User_Search_Field);

  if (Unique_Identifier_Field.length > 0) {
    Unique_Identifier_Field = Unique_Identifier_Field.find((field) => {
      const val = ldapUser._raw.getLDAPValue(field);
      return val != null && val !== '' && !(Array.isArray(val) && val.length === 0);
    });
    if (Unique_Identifier_Field) {
		    log_debug(`Identifying user with: ${  Unique_Identifier_Field}`);
      Unique_Identifier_Field = {
        attribute: Unique_Identifier_Field,
        value: ldapUser._raw.getLDAPValue(Unique_Identifier_Field).toString('hex'),
      };
    }
    return Unique_Identifier_Field;
  }
}

export function getDataToSyncUserData(ldapUser, user) {
  const syncUserData = LDAP.settings_get('LDAP_SYNC_USER_DATA');
  const syncUserDataFieldMap = LDAP.settings_get('LDAP_SYNC_USER_DATA_FIELDMAP').trim();

  const userData = {};

  if (syncUserData && syncUserDataFieldMap) {
    const whitelistedUserFields = ['email', 'name', 'customFields'];
    const fieldMap = JSON.parse(syncUserDataFieldMap);
    const emailList = [];
    Object.entries(fieldMap).forEach(function([ldapField, userField]) {
		    log_debug(`Mapping field ${ldapField} -> ${userField}`);
      switch (userField) {
      case 'email': {
        // #6481: read the mapped LDAP attribute case-insensitively via
        // getLDAPValue, the same accessor used everywhere else (getLdapEmail,
        // getLdapUsername, ...). The old `ldapUser.hasOwnProperty(ldapField)` /
        // `ldapUser[ldapField]` was case-SENSITIVE, so a fieldmap of `mail`
        // against an LDAP/AD server that returns the attribute as `Mail` (or any
        // other casing) yielded `email: undefined` even though the attribute was
        // present. This worked on older WeKan (ldapjs lowercased keys) and broke
        // after the move to ldapts, which preserves the server's attribute case.
        const ldapValue = ldapUser.getLDAPValue(ldapField);
        if (ldapValue === undefined || ldapValue === null || ldapValue === '') {
          log_debug(`user does not have attribute: ${ ldapField }`);
          return;
        }

        if (typeof ldapValue === 'object') {
          Array.from(ldapValue).forEach(function(item) {
            emailList.push({ address: item, verified: true });
          });
        } else {
          emailList.push({ address: ldapValue, verified: true });
        }
        break;
      }

      default:
        const [outerKey, innerKeys] = userField.split(/\.(.+)/);

        if (!whitelistedUserFields.includes(outerKey)) {
          log_debug(`user attribute not whitelisted: ${ userField }`);
          return;
        }

        if (outerKey === 'customFields') {
          let customFieldsMeta;

          try {
            customFieldsMeta = JSON.parse(LDAP.settings_get('Accounts_CustomFields'));
          } catch (e) {
            log_debug('Invalid JSON for Custom Fields');
            return;
          }

          if (!getPropertyValue(customFieldsMeta, innerKeys)) {
            log_debug(`user attribute does not exist: ${ userField }`);
            return;
          }
        }

        const tmpUserField = getPropertyValue(user, userField);
        const tmpLdapField = templateVarHandler(ldapField, ldapUser);

        if (tmpLdapField && tmpUserField !== tmpLdapField) {
          // creates the object structure instead of just assigning 'tmpLdapField' to
          // 'userData[userField]' in order to avoid the "cannot use the part (...)
          // to traverse the element" (MongoDB) error that can happen. Do not handle
          // arrays.
          // TODO: Find a better solution.
          const dKeys = userField.split('.');
          const lastKey = dKeys.at(-1);
          dKeys.reduce((obj, currKey) =>
            (currKey === lastKey)
              ? obj[currKey] = tmpLdapField
              : obj[currKey] = obj[currKey] || {}
            , userData);
          log_debug(`user.${ userField } changed to: ${ tmpLdapField }`);
        }
      }
    });

    if (emailList.length > 0) {
      if (JSON.stringify(user.emails) !== JSON.stringify(emailList)) {
        userData.emails = emailList;
      }
    }
  }

  const uniqueId = getLdapUserUniqueID(ldapUser);

  if (uniqueId && (!user.services || !user.services.ldap || user.services.ldap.id !== uniqueId.value || user.services.ldap.idAttribute !== uniqueId.attribute)) {
    userData['services.ldap.id'] = uniqueId.value;
    userData['services.ldap.idAttribute'] = uniqueId.attribute;
  }

  if (user.authenticationMethod !== 'ldap') {
    userData.ldap = true;
  }

  if (Object.keys(userData).length > 0) {
    return userData;
  }
}


export async function syncUserData(user, ldapUser) {
  log_info('Syncing user data');
  log_debug('user', {'email': user.email, '_id': user._id});
  // log_debug('ldapUser', ldapUser.object);

  if (LDAP.settings_get('LDAP_USERNAME_FIELD') !== '') {
    const username = slug(getLdapUsername(ldapUser));
    if (user && user._id && username !== user.username) {
      log_info('Syncing user username', user.username, '->', username);
      // #4654: this was findOne/findOneAsync with the $set passed as the
      // options argument, which performs no write — username changes in the
      // directory were logged as synced but never saved.
      await Meteor.users.updateAsync({ _id: user._id }, { $set: { username }});
    }
  }

  if (LDAP.settings_get('LDAP_FULLNAME_FIELD') !== '') {
    const fullname= getLdapFullname(ldapUser);
    log_debug('fullname=',fullname);
    if (user && user._id && fullname !== '') {
      log_info('Syncing user fullname:', fullname);
      await Meteor.users.updateAsync({ _id:  user._id }, { $set: { 'profile.fullname' : fullname, }});
    }
  }

  if (LDAP.settings_get('LDAP_EMAIL_FIELD') !== '') {
    const email = getLdapEmail(ldapUser);
    log_debug('email=', email);

    if (user && user._id && email !== '') {
      log_info('Syncing user email:', email);
      await Meteor.users.updateAsync({
        _id: user._id
      }, {
        $set: {
          'emails.0.address': email,
        }
      });
    }
  }

  // Import the LDAP photo (jpegPhoto / thumbnailPhoto) as the user's WeKan avatar so it
  // shows in WeKan and is carried by board export/import. The photo is binary, so store
  // it as a self-contained data: URI in profile.avatarUrl (displays immediately, no
  // coupling to app code from this package); the app's board-open trigger then copies it
  // into a real files/avatars file via the SSRF-safe localizer and repoints avatarUrl.
  // Only set it when the user does not already have a locally-stored WeKan avatar, so a
  // user's own uploaded avatar is not clobbered on every login.
  try {
    const photo = getLdapPhotoBuffer(ldapUser);
    if (photo && user && user._id) {
      const current = (user.profile && user.profile.avatarUrl) || '';
      const alreadyLocal = current.includes('/cdn/storage/avatars/') || current.includes('/cfs/files/avatars/');
      if (!alreadyLocal) {
        const dataUri = 'data:image/jpeg;base64,' + photo.toString('base64');
        log_info('Syncing user LDAP avatar photo');
        await Meteor.users.updateAsync({ _id: user._id }, { $set: { 'profile.avatarUrl': dataUri } });
      }
    }
  } catch (e) {
    log_debug('LDAP photo import skipped:', e && e.message);
  }

}

export async function addLdapUser(ldapUser, username, password) {
  const uniqueId = getLdapUserUniqueID(ldapUser);

  const userObject = {
  };

  if (username) {
    userObject.username = username;
  }

  const userData = getDataToSyncUserData(ldapUser, {});

  if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
    if (Array.isArray(userData.emails[0].address)) {
      userObject.email = userData.emails[0].address[0];
    } else {
      userObject.email = userData.emails[0].address;
    }
  } else if (ldapUser.getLDAPValue('mail') && String(ldapUser.getLDAPValue('mail')).indexOf('@') > -1) {
    // #6481: case-insensitive, matching the fieldmap path above.
    userObject.email = ldapUser.getLDAPValue('mail');
  } else if (LDAP.settings_get('LDAP_DEFAULT_DOMAIN') !== '') {
    userObject.email = `${ username || uniqueId.value }@${ LDAP.settings_get('LDAP_DEFAULT_DOMAIN') }`;
  } else {
    const error = new Meteor.Error('LDAP-login-error', 'LDAP Authentication succeded, there is no email to create an account. Have you tried setting your Default Domain in LDAP Settings?');
    log_error(error);
    throw error;
  }

  log_debug('New user data', userObject);

  if (password) {
    userObject.password = password;
  }

  try {
    // This creates the account with password service
    userObject.ldap = true;
    userObject._id = await Accounts.createUserAsync(userObject);

    // Add the services.ldap identifiers. #4654: also persist idAttribute so
    // the background sync (getUserById in ldap.js) can search by the exact
    // attribute the id was taken from instead of guessing from settings.
    await Meteor.users.updateAsync({ _id:  userObject._id }, {
		    $set: {
		        'services.ldap': { id: uniqueId.value, idAttribute: uniqueId.attribute },
		        'emails.0.verified': true,
		        'authenticationMethod': 'ldap',
		    }});
  } catch (error) {
    log_error('Error creating user', error);
    return error;
  }

  await syncUserData(userObject, ldapUser);

  return {
    userId: userObject._id,
  };
}

export async function importNewUsers(ldap) {
  if (LDAP.settings_get('LDAP_ENABLE') !== true) {
    log_error('Can\'t run LDAP Import, LDAP is disabled');
    return;
  }

  // #6467/#6469: when called standalone (no shared connection passed in),
  // importNewUsers owns the connection it opens and must release it. When the
  // background sync() passes in its own `ldap`, ownership stays with sync() (it
  // disconnects in its finally), so we must NOT close a borrowed connection.
  let ownConnection = false;
  if (!ldap) {
    ldap = new LDAP();
    await ldap.connect();
    ownConnection = true;
  }

  try {
    let count = 0;
    const ldapUsers = await ldap.searchUsers('*');

    for (const ldapUser of ldapUsers) {
      count++;

      const uniqueId = getLdapUserUniqueID(ldapUser);
      // Look to see if user already exists
      const userQuery = {
        'services.ldap.id': uniqueId.value,
      };

      log_debug('userQuery', userQuery);

      let username;
      if (LDAP.settings_get('LDAP_USERNAME_FIELD') !== '') {
        username = slug(getLdapUsername(ldapUser));
      }

      // Add user if it was not added before
      let user = await Meteor.users.findOneAsync(userQuery);

      if (!user && username && LDAP.settings_get('LDAP_MERGE_EXISTING_USERS') === true) {
        const userQuery = {
          username,
        };

        log_debug('userQuery merge', userQuery);

        user = await Meteor.users.findOneAsync(userQuery);
        if (user) {
          await syncUserData(user, ldapUser);
        }
      }

      if (!user) {
        await addLdapUser(ldapUser, username);
      }

      if (count % 100 === 0) {
        log_info('Import running. Users imported until now:', count);
      }
    }

    log_info('Import finished. Users imported:', count);
  } finally {
    if (ownConnection) {
      await ldap.disconnect();
    }
  }
}

// #6461: invoke the app-side LDAP org/team sync as a true server-to-server call.
// A plain Meteor.callAsync here would inherit the CURRENT method invocation —
// the server's applyAsync copies its userId AND connection into the nested call
// — and during login that is the client's `login` method call, so the admin
// guard in setUserOrgsTeamsFromLdap saw a client connection with no logged-in
// user yet and rejected the sync with 'forbidden'. Clearing the invocation
// context makes applyAsync use userId:null/connection:null — the documented
// internal path the method's guard allows — while still going through the
// normal method dispatch (check() audits, EJSON argument cloning).
async function callLdapOrgTeamSyncInternal(userId, groupNames, asOrganization) {
  return await DDP._CurrentMethodInvocation.withValue(undefined, () =>
    Meteor.callAsync('setUserOrgsTeamsFromLdap', userId, groupNames, asOrganization),
  );
}

// #4737: optionally sync a user's LDAP groups as Wekan Organizations and/or
// Teams. Opt-in via LDAP_SYNC_ORGANIZATIONS / LDAP_SYNC_TEAMS (default off). The
// optional comma-separated allowlists LDAP_SYNC_ORGANIZATIONS_GROUPS /
// LDAP_SYNC_TEAMS_GROUPS restrict which of the user's groups become orgs/teams;
// when empty, all of the user's groups are used. The actual create/assign runs
// in the app (server method setUserOrgsTeamsFromLdap) and is add-only, so it
// never removes a user's existing memberships. Shared by the background sync
// and the login handler.
export async function syncUserGroupsToOrgsTeams(ldap, ldapUser, userId) {
  const syncOrgs  = LDAP.settings_get('LDAP_SYNC_ORGANIZATIONS') === true;
  const syncTeams = LDAP.settings_get('LDAP_SYNC_TEAMS') === true;
  if (!syncOrgs && !syncTeams) {
    return;
  }

  const ldapUsername = getLdapUsername(ldapUser);
  const userGroups = await ldap.getUserGroups(ldapUsername, ldapUser);
  if (!Array.isArray(userGroups) || userGroups.length === 0) {
    return;
  }

  if (syncOrgs) {
    const allow = parseGroupAllowlist(LDAP.settings_get('LDAP_SYNC_ORGANIZATIONS_GROUPS'));
    const names = filterGroupsByAllowlist(userGroups, allow);
    if (names.length > 0) {
      await callLdapOrgTeamSyncInternal(userId, names, true);
    }
  }

  if (syncTeams) {
    const allow = parseGroupAllowlist(LDAP.settings_get('LDAP_SYNC_TEAMS_GROUPS'));
    const names = filterGroupsByAllowlist(userGroups, allow);
    if (names.length > 0) {
      await callLdapOrgTeamSyncInternal(userId, names, false);
    }
  }
}

async function sync() {
  if (LDAP.settings_get('LDAP_ENABLE') !== true) {
    return;
  }

  const ldap = new LDAP();

  try {
    await ldap.connect();

    let users;
    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED') === true) {
      users = Meteor.users.find({ 'services.ldap': { $exists: true }});
    }

    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS') === true) {
      await importNewUsers(ldap);
    }

    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED') === true) {
      for await (const user of users) {
        let ldapUser;

        if (user.services && user.services.ldap && user.services.ldap.id) {
          ldapUser = await ldap.getUserById(user.services.ldap.id, user.services.ldap.idAttribute);
        } else {
          ldapUser = await ldap.getUserByUsername(user.username);
        }

        if (ldapUser) {
          await syncUserData(user, ldapUser);

          // #4739: keep admin status updated during background sync, not only
          // at login. Mirrors the LDAP_SYNC_ADMIN_STATUS logic in loginHandler
          // so an admin-group change in LDAP is applied to existing users even
          // if they do not log in. Gated by the existing LDAP_SYNC_ADMIN_STATUS
          // flag (default off), so default behaviour is unchanged.
          if (LDAP.settings_get('LDAP_SYNC_ADMIN_STATUS') === true) {
            const targetGroups = LDAP.settings_get('LDAP_SYNC_ADMIN_GROUPS').split(',');
            const ldapUsername = getLdapUsername(ldapUser);
            const groups = (await ldap.getUserGroups(ldapUsername, ldapUser)).filter((value) => targetGroups.includes(value));
            const isAdmin = groups.length > 0;
            await Meteor.users.updateAsync({ _id: user._id }, { $set: { isAdmin } });
          }

          // #4737: optionally sync LDAP groups as Wekan Organizations and/or
          // Teams (shared with the login path).
          await syncUserGroupsToOrgsTeams(ldap, ldapUser, user._id);

          // #4738: when LDAP is authoritative for active status, re-enable a
          // user that is present in LDAP again (recovers from a removal or a
          // transient outage). Gated by the same opt-in flag as the disable
          // below; off by default.
          if (
            LDAP.settings_get('LDAP_BACKGROUND_SYNC_DISABLE_NONEXISTANT_USERS') === true &&
            user.loginDisabled === true
          ) {
            log_info('Re-enabling user present in LDAP again', user.username);
            await Meteor.users.updateAsync({ _id: user._id }, { $set: { loginDisabled: false } });
          }
        } else {
          // #4738: optionally disable Wekan users that no longer exist in the
          // LDAP directory. Opt-in via LDAP_BACKGROUND_SYNC_DISABLE_NONEXISTANT_USERS
          // (default off); when off, behaviour is unchanged (just log). Only
          // LDAP-sourced users are iterated here. With the flag on, LDAP is the
          // authoritative source of active status: users missing from LDAP are
          // disabled and reappearing users are re-enabled (see the if-branch
          // above), which also overrides a manual disable of an LDAP user.
          // Caveat: a transient LDAP lookup failure looks the same as a removed
          // user, so an account may be briefly disabled until it reappears.
          if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_DISABLE_NONEXISTANT_USERS') === true) {
            if (!user.loginDisabled) {
              log_info('Disabling user no longer present in LDAP', user.username);
              await Meteor.users.updateAsync({ _id: user._id }, { $set: { loginDisabled: true } });
            }
          } else {
            log_info('Can\'t sync user', user.username);
          }
        }
      }
    }

    // #5850 / #4737: after the user sync, propagate org/team members to the
    // boards that list a flagged org/team (orgPropagateMembersToBoards /
    // teamPropagateMembersToBoards). This gives the feature a periodic trigger;
    // it is also admin-callable. Add-only, and template boards are skipped.
    // Wrapped in its own try/catch so a failure here never fails the whole sync.
    try {
      await Meteor.callAsync('propagateOrgTeamMembersToBoards');
    } catch (propagateError) {
      log_error(propagateError);
    }
  } catch (error) {
    log_error(error);
    return error;
  } finally {
    // #6467/#6469: the background sync runs on a cron (every minute by default)
    // and each run opened a new LDAP connection; without this finally every run
    // leaked a connection to the directory server, so a long-running WeKan
    // steadily exhausted the LDAP/AD server's connection limit even with nobody
    // logging in. Release it on every exit path.
    await ldap.disconnect();
  }
  return true;
}

const jobName = 'LDAP_Sync';

function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; fn.apply(this, args); }, wait);
  };
}

const addCronJob = debounce(function addCronJobDebounced() {
  let sc = SyncedCron;
  if (LDAP.settings_get('LDAP_BACKGROUND_SYNC') !== true) {
    log_info('Disabling LDAP Background Sync');
    if (sc.nextScheduledAtDate(jobName)) {
      sc.remove(jobName);
    }
    return;
  }

  log_info('Enabling LDAP Background Sync');
  sc.add({
    name: jobName,
    schedule: function(parser) {
    if (LDAP.settings_get('LDAP_BACKGROUND_SYNC_INTERVAL')) {
       return parser.text(LDAP.settings_get('LDAP_BACKGROUND_SYNC_INTERVAL'));
    }
    else {
       return parser.recur().on(0).minute();
    }},
    job: async function() {
      await sync();
    },
  });
  sc.start();

}, 500);

Meteor.startup(() => {
  Meteor.defer(() => {
    if(LDAP.settings_get('LDAP_BACKGROUND_SYNC')){addCronJob();}
  });
});

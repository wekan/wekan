import {slug, getLdapUsername, getLdapEmail, getLdapUserUniqueID, syncUserData, addLdapUser, syncUserGroupsToOrgsTeams} from './sync';
import LDAP from './ldap';
import { runWithLdapDisconnect } from './connectionGuard';
import { log_debug, log_info, log_warn, log_error } from './logger';
import { isAdminByGroups } from './adminGroups';
import { requireUserCredentials } from './userCredentials';

// Org/team sync is optional enrichment; failed sync must not block login.
async function syncUserGroupsToOrgsTeamsSafe(ldap, ldapUser, userId) {
  try {
    await syncUserGroupsToOrgsTeams(ldap, ldapUser, userId);
  } catch (error) {
    const reason = error && (error.reason || error.message || error.error);
    log_warn('LDAP org/team sync failed during login; continuing without org/team sync', reason);
  }
}

function fallbackDefaultAccountSystem(bind, username, password) {
  if (typeof username === 'string') {
    if (username.indexOf('@') === -1) {
      username = {username};
    } else {
      username = {email: username};
    }
  }

  log_info('Fallback to default account system: ', username );

  const loginRequest = {
    user: username,
    password: {
      digest: SHA256(password),
      algorithm: 'sha-256',
    },
  };
  log_debug('Fallback options: ', loginRequest);

  return Accounts._runLoginHandlers(bind, loginRequest);
}

Accounts.registerLoginHandler('ldap', async function(loginRequest) {
  if (!loginRequest.ldap || !loginRequest.ldapOptions) {
    return undefined;
  }

  // DDP and REST both reach this handler. Reject malformed credentials before
  // connecting, looking up an account, or entering the local-login fallback.
  try {
    requireUserCredentials(loginRequest.username, loginRequest.ldapPass);
  } catch (error) {
    throw new Meteor.Error('LDAP-login-error', 'LDAP authentication failed');
  }

  log_info('Init LDAP login', loginRequest.username);

  if (LDAP.settings_get('LDAP_ENABLE') !== true) {
    return fallbackDefaultAccountSystem(this, loginRequest.username, loginRequest.ldapPass);
  }

  const self = this;
  const ldap = new LDAP();

  // #6467/#6469: run the whole login flow through runWithLdapDisconnect so the
  // connection opened by ldap.connect() below is ALWAYS released, on every exit
  // path (success, fallback, thrown Meteor.Error). Previously disconnect() was
  // never called, so every login attempt leaked a connection to the directory
  // server until it hit "too many open connections" and fell over.
  return await runWithLdapDisconnect(ldap, async () => {
    let ldapUser;
    const userAuthentication = !!LDAP.settings_get('LDAP_USER_AUTHENTICATION');

    try {
      await ldap.connect();
      if (userAuthentication) {
        await ldap.bindUserIfNecessary(loginRequest.username, loginRequest.ldapPass);
      }
      const users = await ldap.searchUsers(loginRequest.username);
      if (users.length !== 1) throw new Error('User not uniquely identified');
      ldapUser = users[0];
    } catch (error) {
      ldapUser = null;
      log_error(error);
    }

    if (!ldapUser) {
      if (LDAP.settings_get('LDAP_LOGIN_FALLBACK') === true) {
        return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
      }

      throw new Meteor.Error('LDAP-login-error', `LDAP Authentication failed with provided username [${ loginRequest.username }]`);
    }

    // The directory group policy applies to both user-bind and service-bind
    // authentication. A verified identity outside the allowed group must not
    // fall back to a cached local password and bypass this policy.
    if (!(await ldap.isUserInGroup(loginRequest.username, ldapUser))) {
      try {
        if (typeof global.__wekanTripCanary === 'function') {
          global.__wekanTripCanary('ldap.group-denied');
        }
      } catch (e) { /* logging must never break the guard */ }
      throw new Meteor.Error('LDAP-login-error', 'LDAP authentication failed');
    }

    // In service-search mode the group lookup must still use the service
    // identity, before auth() switches the connection to the user's bind.
    if (!userAuthentication && await ldap.auth(ldapUser.dn, loginRequest.ldapPass) !== true) {
      if (LDAP.settings_get('LDAP_LOGIN_FALLBACK') === true) {
        return fallbackDefaultAccountSystem(self, loginRequest.username, loginRequest.ldapPass);
      }
      throw new Meteor.Error('LDAP-login-error', 'LDAP authentication failed');
    }

    // Look to see if user already exists

    let userQuery;

    const Unique_Identifier_Field = getLdapUserUniqueID(ldapUser);
    let user;
     // Attempt to find user by unique identifier

    if (Unique_Identifier_Field) {
      userQuery = {
        'services.ldap.id': Unique_Identifier_Field.value,
      };

      log_info('Querying user');
      log_debug('userQuery', userQuery);

      user = await Meteor.users.findOneAsync(userQuery);
     }

    // Attempt to find user by username

    let username;
    let email;

     if (LDAP.settings_get('LDAP_USERNAME_FIELD') !== '') {
      username = slug(getLdapUsername(ldapUser));
    } else {
      username = slug(loginRequest.username);
    }

    if(LDAP.settings_get('LDAP_EMAIL_FIELD') !== '') {
      email = getLdapEmail(ldapUser);
    }


    if (!user) {
      if(email && LDAP.settings_get('LDAP_EMAIL_MATCH_REQUIRE') === true) {
        if(LDAP.settings_get('LDAP_EMAIL_MATCH_VERIFIED') === true) {
          userQuery = {
            '_id' : username,
            'emails.0.address' : email,
            'emails.0.verified' : true
          };
        } else {
          userQuery = {
            '_id' : username,
            'emails.0.address' : email
          };
        }
      } else {
        userQuery = {
          username
        };
      }

      log_debug('userQuery', userQuery);

      user = await Meteor.users.findOneAsync(userQuery);
    }

    // Attempt to find user by e-mail address only

    if (!user && email && LDAP.settings_get('LDAP_EMAIL_MATCH_ENABLE') === true) {

      log_info('No user exists with username', username, '- attempting to find by e-mail address instead');

      if(LDAP.settings_get('LDAP_EMAIL_MATCH_VERIFIED') === true) {
        userQuery = {
          'emails.0.address': email,
          'emails.0.verified' : true
        };
      } else {
        userQuery = {
          'emails.0.address' : email
        };
      }

      log_debug('userQuery', userQuery);

      user = await Meteor.users.findOneAsync(userQuery);

    }

    // Login user if they exist
    if (user) {
      if (user.authenticationMethod !== 'ldap' && LDAP.settings_get('LDAP_MERGE_EXISTING_USERS') !== true) {
        log_info('User exists without "authenticationMethod : ldap"');
        throw new Meteor.Error('LDAP-login-error', `LDAP Authentication succeded, but there's already a matching Wekan account in MongoDB`);
      }

      log_info('Logging user');

      // Return the verified identity only. Meteor's DDP login pipeline (or the
      // REST caller) validates account status before issuing a session token.
      if (LDAP.settings_get('LDAP_SYNC_ADMIN_STATUS') === true) {
        log_debug('Updating admin status');
        // #6540: trimmed, case-insensitive, and an empty configured list never
        // grants admin. See server/adminGroups.js for what went wrong.
        user.isAdmin = isAdminByGroups(
          await ldap.getUserGroups(username, ldapUser),
          LDAP.settings_get('LDAP_SYNC_ADMIN_GROUPS'),
        );
        await Meteor.users.updateAsync({_id: user._id}, {$set: {isAdmin: user.isAdmin}});
      }

      if( LDAP.settings_get('LDAP_SYNC_GROUP_ROLES') === true ) {
        log_debug('Updating Groups/Roles');
        const groups = await ldap.getUserGroups(username, ldapUser);

        if( groups.length > 0 ) {
          Roles.setUserRoles(user._id, groups );
          log_info(`Updated roles to:${  groups.join(',')}`);
        }
      }

      // #4737: sync LDAP groups as Organizations/Teams at login too (default off).
      await syncUserGroupsToOrgsTeamsSafe(ldap, ldapUser, user._id);

      await syncUserData(user, ldapUser);

      if (LDAP.settings_get('LDAP_LOGIN_FALLBACK') === true) {
        await Accounts.setPasswordAsync(user._id, loginRequest.ldapPass, {logout: false});
      }

      return {
        userId: user._id,
      };
    }

    // Create new user

    log_info('User does not exist, creating', username);

    if (LDAP.settings_get('LDAP_USERNAME_FIELD') === '') {
      username = undefined;
    }

    if (LDAP.settings_get('LDAP_LOGIN_FALLBACK') !== true) {
      loginRequest.ldapPass = undefined;
    }

    const result = await addLdapUser(ldapUser, username, loginRequest.ldapPass);

    if (result instanceof Error) {
      throw result;
    }

    if (LDAP.settings_get('LDAP_SYNC_ADMIN_STATUS') === true) {
      log_debug('Updating admin status');
      result.isAdmin = isAdminByGroups(
        await ldap.getUserGroups(username, ldapUser),
        LDAP.settings_get('LDAP_SYNC_ADMIN_GROUPS'),
      );
      await Meteor.users.updateAsync({_id: result.userId}, {$set: {isAdmin: result.isAdmin}});
    }

    if( LDAP.settings_get('LDAP_SYNC_GROUP_ROLES') === true ) {
      const groups = await ldap.getUserGroups(username, ldapUser);
      if( groups.length > 0 ) {
        Roles.setUserRoles(result.userId, groups );
        log_info(`Set roles to:${  groups.join(',')}`);
      }
    }

    // #4737: sync LDAP groups as Organizations/Teams for the new user (default off).
    await syncUserGroupsToOrgsTeamsSafe(ldap, ldapUser, result.userId);

    return result;
  });
});

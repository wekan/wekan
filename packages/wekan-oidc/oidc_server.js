import {addGroupsWithAttributes, addEmail, changeFullname, changeUsername, oauth2AdminStatusFromGroups} from './loginHandler';
import { fetch, Headers } from 'meteor/fetch';
import { URLSearchParams } from 'meteor/url';
import { Buffer } from 'node:buffer';
import https from 'https';
import fs from 'fs';

Oidc = {};
httpCa = false;

if (process.env.OAUTH2_CA_CERT !== undefined) {
    try {
        if (fs.existsSync(process.env.OAUTH2_CA_CERT)) {
          httpCa = fs.readFileSync(process.env.OAUTH2_CA_CERT);
        }
    } catch(e) {
	console.log('WARNING: failed loading: ' + process.env.OAUTH2_CA_CERT);
	console.log(e);
    }
}
OAuth.registerService('oidc', 2, null, async function (query) {
  var debug = process.env.DEBUG === 'true';

  // #4897: these MUST be fresh per-login objects. They used to be module-level
  // (`var serviceData = {}` etc. shared by every login of every user), so:
  //   * fields a login did not overwrite leaked in from the PREVIOUS login of a
  //     DIFFERENT user (e.g. refreshToken is only set when the provider sends
  //     one, and idTokenWhitelistFields were Object.assign-ed cumulatively), and
  //   * two logins running concurrently (this handler awaits the token,
  //     userinfo and two Meteor.callAsync calls) interleaved writes to the SAME
  //     object, so a user could intermittently be created/updated with another
  //     user's id/email/username — the "web interface shows different data than
  //     MongoDB" reports.
  var profile = {};
  var serviceData = {};
  var userinfo = {};

  var token = await getToken(query);
  if (debug) console.log('XXX: register token:', token);

  var accessToken = token.access_token || token.id_token;
  var expiresAt = (+new Date) + (1000 * parseInt(token.expires_in, 10));

  var claimsInAccessToken = (process.env.OAUTH2_ADFS_ENABLED === 'true'  ||
                             process.env.OAUTH2_ADFS_ENABLED === true    ||
                             process.env.OAUTH2_B2C_ENABLED  === 'true'  ||
                             process.env.OAUTH2_B2C_ENABLED  === true)   || false;

  if(claimsInAccessToken)
  {
    // hack when using custom claims in the accessToken. On premise ADFS. And Azure AD B2C.
    userinfo = getTokenContent(accessToken);
  }
  else
  {
    // normal behaviour, getting the claims from UserInfo endpoint.
    userinfo = await getUserInfo(accessToken);
  }

  if (userinfo.ocs) userinfo = userinfo.ocs.data; // Nextcloud hack
  if (userinfo.metadata) userinfo = userinfo.metadata // Openshift hack
  if (debug) console.log('XXX: userinfo:', userinfo);

  serviceData.id = userinfo[process.env.OAUTH2_ID_MAP]; // || userinfo["id"];
  serviceData.username = userinfo[process.env.OAUTH2_USERNAME_MAP]; // || userinfo["uid"];
  serviceData.fullname = userinfo[process.env.OAUTH2_FULLNAME_MAP]; // || userinfo["displayName"];
  // Capture the provider's avatar. `picture` is a standard OpenID Connect claim (a URL);
  // allow an override map for providers that use a different key. WeKan then localizes it
  // into files/avatars (app board-open trigger) so it shows and is carried by export.
  serviceData.picture = userinfo[process.env.OAUTH2_AVATAR_MAP || 'picture'] || userinfo['picture'] || null;
  serviceData.accessToken = accessToken;
  serviceData.expiresAt = expiresAt;


  // If on Oracle OIM email is empty or null, get info from username
  if (process.env.ORACLE_OIM_ENABLED === 'true' || process.env.ORACLE_OIM_ENABLED === true) {
    if (userinfo[process.env.OAUTH2_EMAIL_MAP]) {
      serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP];
    } else {
      serviceData.email = userinfo[process.env.OAUTH2_USERNAME_MAP];
    }
  }

  if (process.env.ORACLE_OIM_ENABLED !== 'true' && process.env.ORACLE_OIM_ENABLED !== true) {
    serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP]; // || userinfo["email"];
  }

  if (process.env.OAUTH2_B2C_ENABLED  === 'true'  || process.env.OAUTH2_B2C_ENABLED  === true) {
    serviceData.email = userinfo["emails"][0];
  }

  // SECURITY (GHSA-mp7g-hj5q-gxhq): Capture the provider's email_verified
  // claim so the Accounts.onCreateUser hook can refuse to link an OIDC login
  // to an existing local account on the basis of an unverified email.
  // Different providers use boolean true or the string "true".
  serviceData.email_verified =
    userinfo["email_verified"] === true || userinfo["email_verified"] === "true";

  if (accessToken) {
    var tokenContent = getTokenContent(accessToken);
    var config = await getConfiguration();
    if (tokenContent) {
      var fields = Object.fromEntries(
        Object.entries(tokenContent).filter(([k]) => (config.idTokenWhitelistFields || []).includes(k))
      );
      Object.assign(serviceData, fields);
    }
  }

  if (token.refresh_token)
    serviceData.refreshToken = token.refresh_token;
  if (debug) console.log('XXX: serviceData:', serviceData);

  profile.name = userinfo[process.env.OAUTH2_FULLNAME_MAP]; // || userinfo["displayName"];
  profile.email = userinfo[process.env.OAUTH2_EMAIL_MAP]; // || userinfo["email"];
  if (serviceData.picture) profile.avatarUrl = serviceData.picture; // localized on board open

  if (process.env.OAUTH2_B2C_ENABLED  === 'true'  || process.env.OAUTH2_B2C_ENABLED  === true) {
    profile.email = userinfo["emails"][0];
  }

  if (debug) console.log('XXX: profile:', profile);


  //temporarily store data from oidc in user.services.oidc.groups to update groups
  serviceData.groups = (userinfo["groups"] && userinfo["wekanGroups"]) ? userinfo["wekanGroups"] : userinfo["groups"];
  // groups arriving as array of strings indicate there is no scope set in oidc privider
  // to assign teams and keep admin privileges
  // data needs to be treated  differently.
  // use case: in oidc provider no scope is set, hence no group attributes.
  //    therefore: keep admin privileges for wekan as before
  if(Array.isArray(serviceData.groups) && serviceData.groups.length && typeof serviceData.groups[0] === "string" )
  {
    // #4897: `user` was an implicit global shared by concurrent logins.
    const user = await Meteor.users.findOneAsync({'_id':  serviceData.id});

    serviceData.groups.forEach(function(groupName, i)
    {
      if(user?.isAdmin && i == 0)
      {
        // keep information of user.isAdmin since in loginHandler the user will // be updated regarding group admin privileges provided via oidc
        serviceData.groups[i] = {"isAdmin": true};
        serviceData.groups[i]["displayName"]= groupName;
      }
      else
      {
        serviceData.groups[i] = {"displayName": groupName};
      }
    });
  }

  // Fix OIDC login loop for integer user ID. Thanks to danielkaiser.
  // https://github.com/wekan/wekan/issues/4795
  await Meteor.callAsync('groupRoutineOnLogin',serviceData, ""+serviceData.id);
  await Meteor.callAsync('boardRoutineOnLogin',serviceData, ""+serviceData.id);

  return {
    serviceData: serviceData,
    options: { profile: profile }
  };
});

var userAgent = "Meteor";
if (Meteor.release) {
  userAgent += "/" + Meteor.release;
}

if (process.env.ORACLE_OIM_ENABLED !== 'true' && process.env.ORACLE_OIM_ENABLED !== true) {
  var getToken = async function (query) {
    var debug = process.env.DEBUG === 'true';
    var config = await getConfiguration();
    var serverTokenEndpoint;
    if(config.tokenEndpoint.includes('https://')){
      serverTokenEndpoint = config.tokenEndpoint;
    }else{
      serverTokenEndpoint = config.serverUrl + config.tokenEndpoint;
    }

    try {
      var body = new URLSearchParams({
        code: query.code,
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri('oidc', config),
        grant_type: 'authorization_code',
        state: query.state
      });

      var fetchOptions = {
        method: 'POST',
        headers: new Headers({
          'Accept': 'application/json',
          'User-Agent': userAgent,
          'Content-Type': 'application/x-www-form-urlencoded'
        }),
        body: body.toString()
      };

      if (httpCa) {
        fetchOptions.agent = new https.Agent({ ca: httpCa });
      }

      var response = await fetch(serverTokenEndpoint, fetchOptions);
      var data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + response.statusText);
      }
      if (data.error) {
        // if the http response was a json object with an error attribute
        throw new Error("Failed to complete handshake with OIDC " + serverTokenEndpoint + ": " + data.error);
      }
      if (debug) console.log('XXX: getToken response: ', data);
      return data;
    } catch (err) {
      throw Object.assign(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message),
        { response: err.response });
    }
  };
}

if (process.env.ORACLE_OIM_ENABLED === 'true' || process.env.ORACLE_OIM_ENABLED === true) {

  var getToken = async function (query) {
    var debug = process.env.DEBUG === 'true';
    var config = await getConfiguration();
    var serverTokenEndpoint;
    if(config.tokenEndpoint.includes('https://')){
      serverTokenEndpoint = config.tokenEndpoint;
    }else{
      serverTokenEndpoint = config.serverUrl + config.tokenEndpoint;
    }

    // OIM needs basic Authentication token in the header - ClientID + SECRET in base64
    var dataToken = process.env.OAUTH2_CLIENT_ID + ':' + process.env.OAUTH2_SECRET;
    var strBasicToken64 = Buffer.from(dataToken).toString('base64');

    // eslint-disable-next-line no-console
    if (debug) console.log('Basic Token: ', strBasicToken64);

    try {
      var body = new URLSearchParams({
        code: query.code,
        client_id: config.clientId,
        client_secret: OAuth.openSecret(config.secret),
        redirect_uri: OAuth._redirectUri('oidc', config),
        grant_type: 'authorization_code',
        state: query.state
      });

      var fetchOptions = {
        method: 'POST',
        headers: new Headers({
          'Accept': 'application/json',
          'User-Agent': userAgent,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + strBasicToken64
        }),
        body: body.toString()
      };

      if (httpCa) {
        fetchOptions.agent = new https.Agent({ ca: httpCa });
      }

      var response = await fetch(serverTokenEndpoint, fetchOptions);
      var data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + response.statusText);
      }
      if (data.error) {
        // if the http response was a json object with an error attribute
        throw new Error("Failed to complete handshake with OIDC " + serverTokenEndpoint + ": " + data.error);
      }
      // eslint-disable-next-line no-console
      if (debug) console.log('XXX: getToken response: ', data);
      return data;
    } catch (err) {
      throw Object.assign(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message),
        { response: err.response });
    }
  };
}


var getUserInfo = async function (accessToken) {
  var debug = process.env.DEBUG === 'true';
  var config = await getConfiguration();
  // Some userinfo endpoints use a different base URL than the authorization or token endpoints.
  // This logic allows the end user to override the setting by providing the full URL to userinfo in their config.
  var serverUserinfoEndpoint;
  if (config.userinfoEndpoint.includes("https://")) {
    serverUserinfoEndpoint = config.userinfoEndpoint;
  } else {
    serverUserinfoEndpoint = config.serverUrl + config.userinfoEndpoint;
  }

  try {
    var fetchOptions = {
      method: 'GET',
      headers: new Headers({
        'User-Agent': userAgent,
        'Authorization': 'Bearer ' + accessToken
      })
    };

    if (httpCa) {
      fetchOptions.agent = new https.Agent({ ca: httpCa });
    }

    var response = await fetch(serverUserinfoEndpoint, fetchOptions);

    if (!response.ok) {
      throw new Error("Failed to fetch userinfo from OIDC " + serverUserinfoEndpoint + ": " + response.statusText);
    }

    var data = await response.json();
    if (debug) console.log('XXX: getUserInfo response: ', data);
    return data;
  } catch (err) {
    throw Object.assign(new Error("Failed to fetch userinfo from OIDC " + serverUserinfoEndpoint + ": " + err.message),
                   {response: err.response});
  }
};

var getConfiguration = async function () {
  var config = await ServiceConfiguration.configurations.findOneAsync({ service: 'oidc' });
  if (!config) {
    throw new ServiceConfiguration.ConfigError('Service oidc not configured.');
  }
  return config;
};

var getTokenContent = function (token) {
  var content = null;
  if (token) {
    try {
      var parts = token.split('.');
      var header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      content = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      var signature = Buffer.from(parts[2], 'base64');
      var signed = parts[0] + '.' + parts[1];
    } catch (err) {
      content = {
        exp: 0
      };
    }
  }
  return content;
}
Meteor.methods({
  'groupRoutineOnLogin': async function(info, userId)
  {
    // SECURITY (GHSA-cv95-8h7c-2ffq): This method is invoked only server-side
    // during the OIDC login flow (via Meteor.callAsync from the
    // OAuth.registerService('oidc') callback above). With PROPAGATE_OIDC_DATA
    // enabled it grants isAdmin based on the caller-supplied group data, so if
    // it were callable directly over DDP any authenticated user could promote
    // themselves to global admin. A server-side method call has
    // this.connection === null; a direct client call has a non-null
    // connection. Reject the latter.
    if (this.connection !== null) {
      throw new Meteor.Error('not-authorized');
    }
    check(info, Object);
    check(userId, String);

    // #5876: optional OAUTH2_ADMIN_GROUPS. When set (comma/whitespace separated
    // list of group names), grant/revoke Wekan admin for the logging-in OIDC
    // user based on whether their OIDC `groups` claim intersects that list.
    // This mirrors LDAP_SYNC_ADMIN_GROUPS and is independent of
    // PROPAGATE_OIDC_DATA. When OAUTH2_ADMIN_GROUPS is empty/unset (default),
    // isAdmin is left untouched, so existing behavior is unchanged.
    {
      const adminStatus = oauth2AdminStatusFromGroups(info.groups);
      if (adminStatus.manage) {
        const adminUser = await Meteor.users.findOneAsync({'services.oidc.id': userId});
        if (adminUser) {
          await Meteor.users.updateAsync({_id: adminUser._id}, {$set: {isAdmin: adminStatus.isAdmin}});
        }
      }
    }

    var propagateOidcData = process.env.PROPAGATE_OIDC_DATA || false;
    if (propagateOidcData) {
      // #4897: `users`/`user` were implicit globals shared by concurrent
      // logins; between the awaits below another login could reassign `user`,
      // so this login's email/fullname/username got written onto ANOTHER
      // user's document. loginHandler.js now uses Meteor.users directly.
      const user = await Meteor.users.findOneAsync({'services.oidc.id':  userId});

      if(user) {
        //updates/creates Groups and user admin privileges accordingly if not undefined
        if (info.groups) {
          await addGroupsWithAttributes(user, info.groups);
        }

        if(info.email) await addEmail(user, info.email);
        if(info.fullname) await changeFullname(user, info.fullname);
        if(info.username) await changeUsername(user, info.username);
      }
    }
  }
});

Meteor.methods({
  'boardRoutineOnLogin': async function(info, oidcUserId)
  {
    // SECURITY (GHSA-cv95-8h7c-2ffq): Invoked only server-side during the OIDC
    // login flow (via Meteor.callAsync from the OAuth.registerService('oidc')
    // callback above). It adds the OIDC user to the default board (optionally
    // as board admin) with no per-user authorization, so reject direct
    // client/DDP calls (this.connection non-null).
    if (this.connection !== null) {
      throw new Meteor.Error('not-authorized');
    }
    check(info, Object);
    check(oidcUserId, String);

    const defaultBoardParams = (process.env.DEFAULT_BOARD_ID || '').split(':');
    const defaultBoardId = defaultBoardParams.shift()
    if (!defaultBoardId) return

    const board = await Boards.findOneAsync(defaultBoardId)
    const user = await Users.findOneAsync({ 'services.oidc.id': oidcUserId })
    const userId = user?._id
    const memberIndex = (board?.members || []).map(m => m.userId).indexOf(userId);
    if(!board || !userId || memberIndex > -1) return

    await board.addMember(userId)
    await board.setMemberPermission(
      userId,
      defaultBoardParams.contains("isAdmin"),
      defaultBoardParams.contains("isNoComments"),
      defaultBoardParams.contains("isCommentsOnly"),
      defaultBoardParams.contains("isWorker")
    )
  }
});

Oidc.retrieveCredential = function (credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

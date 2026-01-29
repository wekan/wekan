import {addGroupsWithAttributes, addEmail, changeFullname, changeUsername} from './loginHandler';
import { fetch, Headers } from 'meteor/fetch';
import https from 'https';

Oidc = {};
httpCa = false;

if (process.env.OAUTH2_CA_CERT !== undefined) {
    try {
        const fs = Npm.require('fs');
        if (fs.existsSync(process.env.OAUTH2_CA_CERT)) {
          httpCa = fs.readFileSync(process.env.OAUTH2_CA_CERT);
        }
    } catch(e) {
	console.log('WARNING: failed loading: ' + process.env.OAUTH2_CA_CERT);
	console.log(e);
    }
}
var profile = {};
var serviceData = {};
var userinfo = {};

OAuth.registerService('oidc', 2, null, async function (query) {
  var debug = process.env.DEBUG === 'true';

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

  if (accessToken) {
    var tokenContent = getTokenContent(accessToken);
    var config = await getConfiguration();
    var fields = _.pick(tokenContent, config.idTokenWhitelistFields);
    _.extend(serviceData, fields);
  }

  if (token.refresh_token)
    serviceData.refreshToken = token.refresh_token;
  if (debug) console.log('XXX: serviceData:', serviceData);

  profile.name = userinfo[process.env.OAUTH2_FULLNAME_MAP]; // || userinfo["displayName"];
  profile.email = userinfo[process.env.OAUTH2_EMAIL_MAP]; // || userinfo["email"];

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
    user = await Meteor.users.findOneAsync({'_id':  serviceData.id});

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
      throw _.extend(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message),
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
      throw _.extend(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message),
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
    throw _.extend(new Error("Failed to fetch userinfo from OIDC " + serverUserinfoEndpoint + ": " + err.message),
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
      this.content = {
        exp: 0
      };
    }
  }
  return content;
}
Meteor.methods({
  'groupRoutineOnLogin': async function(info, userId)
  {
    check(info, Object);
    check(userId, String);
    var propagateOidcData = process.env.PROPAGATE_OIDC_DATA || false;
    if (propagateOidcData) {
      users= Meteor.users;
      user = await users.findOneAsync({'services.oidc.id':  userId});

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
    check(info, Object);
    check(oidcUserId, String);

    const defaultBoardParams = (process.env.DEFAULT_BOARD_ID || '').split(':');
    const defaultBoardId = defaultBoardParams.shift()
    if (!defaultBoardId) return

    const board = await Boards.findOneAsync(defaultBoardId)
    const user = await Users.findOneAsync({ 'services.oidc.id': oidcUserId })
    const userId = user?._id
    const memberIndex = _.pluck(board?.members, 'userId').indexOf(userId);
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

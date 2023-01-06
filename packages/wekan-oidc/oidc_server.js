import {addGroupsWithAttributes, addEmail, changeFullname, changeUsername} from './loginHandler';

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

OAuth.registerService('oidc', 2, null, function (query) {
  var debug = process.env.DEBUG || false;

  var token = getToken(query);
  if (debug) console.log('XXX: register token:', token);

  var accessToken = token.access_token || token.id_token;
  var expiresAt = (+new Date) + (1000 * parseInt(token.expires_in, 10));

  var claimsInAccessToken = (process.env.OAUTH2_ADFS_ENABLED === 'true' || process.env.OAUTH2_ADFS_ENABLED === true) || false;

  if(claimsInAccessToken)
  {
    // hack when using custom claims in the accessToken. On premise ADFS
    userinfo = getTokenContent(accessToken);
  }
  else
  {
    // normal behaviour, getting the claims from UserInfo endpoint.
    userinfo = getUserInfo(accessToken);
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

  if (accessToken) {
    var tokenContent = getTokenContent(accessToken);
    var fields = _.pick(tokenContent, getConfiguration().idTokenWhitelistFields);
    _.extend(serviceData, fields);
  }

  if (token.refresh_token)
    serviceData.refreshToken = token.refresh_token;
  if (debug) console.log('XXX: serviceData:', serviceData);

  profile.name = userinfo[process.env.OAUTH2_FULLNAME_MAP]; // || userinfo["displayName"];
  profile.email = userinfo[process.env.OAUTH2_EMAIL_MAP]; // || userinfo["email"];
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
    user = Meteor.users.findOne({'_id':  serviceData.id});

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
  Meteor.call('groupRoutineOnLogin',serviceData, ""+serviceData.id);

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
  var getToken = function (query) {
    var debug = process.env.DEBUG || false;
    var config = getConfiguration();
    if(config.tokenEndpoint.includes('https://')){
      var serverTokenEndpoint = config.tokenEndpoint;
    }else{
      var serverTokenEndpoint = config.serverUrl + config.tokenEndpoint;
    }
    var requestPermissions = config.requestPermissions;
    var response;

    try {
      var postOptions = {
          headers: {
            Accept: 'application/json',
            "User-Agent": userAgent
          },
          params: {
            code: query.code,
            client_id: config.clientId,
            client_secret: OAuth.openSecret(config.secret),
            redirect_uri: OAuth._redirectUri('oidc', config),
            grant_type: 'authorization_code',
            state: query.state
          }
        };
      if (httpCa) {
	postOptions['npmRequestOptions'] = { ca: httpCa };
      }
      response = HTTP.post(serverTokenEndpoint, postOptions);
    } catch (err) {
      throw _.extend(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message),
        { response: err.response });
    }
    if (response.data.error) {
      // if the http response was a json object with an error attribute
      throw new Error("Failed to complete handshake with OIDC " + serverTokenEndpoint + ": " + response.data.error);
    } else {
      if (debug) console.log('XXX: getToken response: ', response.data);
      return response.data;
    }
  };
}

if (process.env.ORACLE_OIM_ENABLED === 'true' || process.env.ORACLE_OIM_ENABLED === true) {

  var getToken = function (query) {
    var debug = (process.env.DEBUG === 'true' || process.env.DEBUG === true) || false;
    var config = getConfiguration();
    if(config.tokenEndpoint.includes('https://')){
      var serverTokenEndpoint = config.tokenEndpoint;
    }else{
      var serverTokenEndpoint = config.serverUrl + config.tokenEndpoint;
    }
    var requestPermissions = config.requestPermissions;
    var response;

    // OIM needs basic Authentication token in the header - ClientID + SECRET in base64
    var dataToken=null;
    var strBasicToken=null;
    var strBasicToken64=null;

    dataToken = process.env.OAUTH2_CLIENT_ID + ':' + process.env.OAUTH2_SECRET;
    strBasicToken = new Buffer(dataToken);
    strBasicToken64 = strBasicToken.toString('base64');

    // eslint-disable-next-line no-console
    if (debug) console.log('Basic Token: ', strBasicToken64);

    try {
      var postOptions = {
          headers: {
            Accept: 'application/json',
            "User-Agent": userAgent,
            "Authorization": "Basic " + strBasicToken64
          },
          params: {
            code: query.code,
            client_id: config.clientId,
            client_secret: OAuth.openSecret(config.secret),
            redirect_uri: OAuth._redirectUri('oidc', config),
            grant_type: 'authorization_code',
            state: query.state
          }
        };
      if (httpCa) {
	postOptions['npmRequestOptions'] = { ca: httpCa };
      }
      response = HTTP.post(serverTokenEndpoint, postOptions);
    } catch (err) {
      throw _.extend(new Error("Failed to get token from OIDC " + serverTokenEndpoint + ": " + err.message),
        { response: err.response });
    }
    if (response.data.error) {
      // if the http response was a json object with an error attribute
      throw new Error("Failed to complete handshake with OIDC " + serverTokenEndpoint + ": " + response.data.error);
    } else {
      // eslint-disable-next-line no-console
      if (debug) console.log('XXX: getToken response: ', response.data);
      return response.data;
    }
  };
}


var getUserInfo = function (accessToken) {
  var debug = process.env.DEBUG || false;
  var config = getConfiguration();
  // Some userinfo endpoints use a different base URL than the authorization or token endpoints.
  // This logic allows the end user to override the setting by providing the full URL to userinfo in their config.
  if (config.userinfoEndpoint.includes("https://")) {
    var serverUserinfoEndpoint = config.userinfoEndpoint;
  } else {
    var serverUserinfoEndpoint = config.serverUrl + config.userinfoEndpoint;
  }
  var response;
  try {
    var getOptions = {
        headers: {
          "User-Agent": userAgent,
          "Authorization": "Bearer " + accessToken
        }
      };
    if (httpCa) {
      getOptions['npmRequestOptions'] = { ca: httpCa };
    }
    response = HTTP.get(serverUserinfoEndpoint, getOptions);
  } catch (err) {
    throw _.extend(new Error("Failed to fetch userinfo from OIDC " + serverUserinfoEndpoint + ": " + err.message),
                   {response: err.response});
  }
  if (debug) console.log('XXX: getUserInfo response: ', response.data);
  return response.data;
};

var getConfiguration = function () {
  var config = ServiceConfiguration.configurations.findOne({ service: 'oidc' });
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
  'groupRoutineOnLogin': function(info, userId)
  {
    check(info, Object);
    check(userId, String);
    var propagateOidcData = process.env.PROPAGATE_OIDC_DATA || false;
    if (propagateOidcData)
    {
      users= Meteor.users;
      user = users.findOne({'services.oidc.id':  userId});

      if(user)
      {
        //updates/creates Groups and user admin privileges accordingly
        addGroupsWithAttributes(user, info.groups);
        if(info.email) addEmail(user, info.email);
        if(info.fullname) changeFullname(user, info.fullname);
        if(info.username) changeUsername(user, info.username);
      }
    }
  }
});

Oidc.retrieveCredential = function (credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};

import { addGroupsWithAttributes, addEmail, changeFullname, changeUsername } from './loginHandler';
const fs = Npm.require('fs');  // For file handling

Oidc = {};
httpCa = false;

// Load CA certificate if specified in the environment variable
if (process.env.OAUTH2_CA_CERT !== undefined) {
    try {
        if (fs.existsSync(process.env.OAUTH2_CA_CERT)) {
            httpCa = fs.readFileSync(process.env.OAUTH2_CA_CERT);
        }
    } catch (e) {
        console.log('WARNING: failed loading: ' + process.env.OAUTH2_CA_CERT);
        console.log(e);
    }
}

var profile = {};
var serviceData = {};
var userinfo = {};

// Function to read the allowed emails from a local file specified in the environment variable
var getAllowedEmailsFromFile = function() {
    var allowedEmails = [];
    const filePath = process.env.OAUTH2_ALLOWEDEMAILS_FILEPATH;  // Get the file path from environment variable

    if (!filePath) {
        throw new Error("OAUTH2_ALLOWEDEMAILS_FILEPATH environment variable is not set.");
    }

    try {
        // Read the allowed emails file
        const data = fs.readFileSync(filePath, 'utf-8');
        allowedEmails = data.split('\n').map(email => email.trim());
    } catch (error) {
        console.error("Error reading allowed emails file:", error);
    }
    return allowedEmails;
};

// OAuth service registration
OAuth.registerService('oidc', 2, null, function (query) {
    var debug = process.env.DEBUG === 'true';

    var token = getToken(query);
    if (debug) console.log('XXX: register token:', token);

    var accessToken = token.access_token || token.id_token;
    var expiresAt = (+new Date) + (1000 * parseInt(token.expires_in, 10));

    var claimsInAccessToken = (process.env.OAUTH2_ADFS_ENABLED === 'true' ||
        process.env.OAUTH2_ADFS_ENABLED === true ||
        process.env.OAUTH2_B2C_ENABLED === 'true' ||
        process.env.OAUTH2_B2C_ENABLED === true) || false;

    if (claimsInAccessToken) {
        userinfo = getTokenContent(accessToken);
    } else {
        userinfo = getUserInfo(accessToken);
    }

    if (userinfo.ocs) userinfo = userinfo.ocs.data;
    if (userinfo.metadata) userinfo = userinfo.metadata;
    if (debug) console.log('XXX: userinfo:', userinfo);

    serviceData.id = userinfo[process.env.OAUTH2_ID_MAP];
    serviceData.username = userinfo[process.env.OAUTH2_USERNAME_MAP];
    serviceData.fullname = userinfo[process.env.OAUTH2_FULLNAME_MAP];
    serviceData.accessToken = accessToken;
    serviceData.expiresAt = expiresAt;

    // Oracle OIM and B2C checks remain the same
    if (process.env.ORACLE_OIM_ENABLED === 'true' || process.env.ORACLE_OIM_ENABLED === true) {
        if (userinfo[process.env.OAUTH2_EMAIL_MAP]) {
            serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP];
        } else {
            serviceData.email = userinfo[process.env.OAUTH2_USERNAME_MAP];
        }
    }

    if (process.env.ORACLE_OIM_ENABLED !== 'true' && process.env.ORACLE_OIM_ENABLED !== true) {
        serviceData.email = userinfo[process.env.OAUTH2_EMAIL_MAP];
    }

    if (process.env.OAUTH2_B2C_ENABLED === 'true' || process.env.OAUTH2_B2C_ENABLED === true) {
        serviceData.email = userinfo["emails"][0];
    }

    if (accessToken) {
        var tokenContent = getTokenContent(accessToken);
        var fields = _.pick(tokenContent, getConfiguration().idTokenWhitelistFields);
        _.extend(serviceData, fields);
    }

    if (token.refresh_token)
        serviceData.refreshToken = token.refresh_token;
    if (debug) console.log('XXX: serviceData:', serviceData);

    profile.name = userinfo[process.env.OAUTH2_FULLNAME_MAP];
    profile.email = userinfo[process.env.OAUTH2_EMAIL_MAP];

    if (process.env.OAUTH2_B2C_ENABLED === 'true' || process.env.OAUTH2_B2C_ENABLED === true) {
        profile.email = userinfo["emails"][0];
    }

    if (debug) console.log('XXX: profile:', profile);

    // New code: Check if the user's email is in the allowed emails list (only if oauth2-checkemails is true)
    if (process.env.OAUTH2_CHECKEMAILS === 'true') {
        const allowedEmails = getAllowedEmailsFromFile();
        if (!allowedEmails.includes(profile.email)) {
            throw new Error("Email not allowed: " + profile.email);
        }
    }

    // Temporarily store data from oidc in user.services.oidc.groups to update groups
    serviceData.groups = (userinfo["groups"] && userinfo["wekanGroups"]) ? userinfo["wekanGroups"] : userinfo["groups"];

    if (Array.isArray(serviceData.groups) && serviceData.groups.length && typeof serviceData.groups[0] === "string") {
        user = Meteor.users.findOne({'_id': serviceData.id});

        serviceData.groups.forEach(function (groupName, i) {
            if (user?.isAdmin && i == 0) {
                serviceData.groups[i] = {"isAdmin": true};
                serviceData.groups[i]["displayName"] = groupName;
            } else {
                serviceData.groups[i] = {"displayName": groupName};
            }
        });
    }

    // Fix OIDC login loop for integer user ID. Thanks to danielkaiser.
    Meteor.call('groupRoutineOnLogin', serviceData, "" + serviceData.id);
    Meteor.call('boardRoutineOnLogin', serviceData, "" + serviceData.id);

    return {
        serviceData: serviceData,
        options: { profile: profile }
    };
});

// Function to retrieve token based on environment
var getToken = function (query) {
    var debug = process.env.DEBUG === 'true';
    var config = getConfiguration();
    var serverTokenEndpoint = config.tokenEndpoint.includes('https://') ?
        config.tokenEndpoint : config.serverUrl + config.tokenEndpoint;
    var response;

    try {
        var postOptions = {
            headers: {
                Accept: 'application/json',
                "User-Agent": "Meteor"
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
        throw new Error("Failed to complete handshake with OIDC " + serverTokenEndpoint + ": " + response.data.error);
    } else {
        return response.data;
    }
};

// Function to fetch user information from the OIDC service
var getUserInfo = function (accessToken) {
    var debug = process.env.DEBUG === 'true';
    var config = getConfiguration();
    var serverUserinfoEndpoint = config.userinfoEndpoint.includes("https://") ?
        config.userinfoEndpoint : config.serverUrl + config.userinfoEndpoint;

    var response;
    try {
        var getOptions = {
            headers: {
                "User-Agent": "Meteor",
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
    return response.data;
};

// Function to get the configuration of the OIDC service
var getConfiguration = function () {
    var config = ServiceConfiguration.configurations.findOne({ service: 'oidc' });
    if (!config) {
        throw new ServiceConfiguration.ConfigError('Service oidc not configured.');
    }
    return config;
};

// Function to decode the token content (JWT)
var getTokenContent = function (token) {
    var content = null;
    if (token) {
        try {
            var parts = token.split('.');
            var header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
            content = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        } catch (err) {
            content = { exp: 0 };
        }
    }
    return content;
}

// Meteor methods to update groups and boards on login
Meteor.methods({
    'groupRoutineOnLogin': function(info, userId) {
        check(info, Object);
        check(userId, String);
        var propagateOidcData = process.env.PROPAGATE_OIDC_DATA || false;
        if (propagateOidcData) {
            users = Meteor.users;
            user = users.findOne({'services.oidc.id':  userId});

            if (user) {
                if (info.groups) {
                    addGroupsWithAttributes(user, info.groups);
                }

                if(info.email) addEmail(user, info.email);
                if(info.fullname) changeFullname(user, info.fullname);
                if(info.username) changeUsername(user, info.username);
            }
        }
    }
});

Meteor.methods({
    'boardRoutineOnLogin': function(info, userId) {
        check(info, Object);
        check(userId, String);
        // Add board updates here if needed
    }
});
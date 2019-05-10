Template.configureLoginServiceDialogForOidc.helpers({
    siteUrl: function () {
        return Meteor.absoluteUrl();
    }
});

Template.configureLoginServiceDialogForOidc.fields = function () {
  return [
    { property: 'clientId', label: 'Client ID'},
    { property: 'secret', label: 'Client Secret'},
    { property: 'serverUrl', label: 'OIDC Server URL'},
    { property: 'authorizationEndpoint', label: 'Authorization Endpoint'},
    { property: 'tokenEndpoint', label: 'Token Endpoint'},
    { property: 'userinfoEndpoint', label: 'Userinfo Endpoint'},
    { property: 'idTokenWhitelistFields', label: 'Id Token Fields'}
  ];
};

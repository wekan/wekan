Accounts.oauth.registerService('oidc');

if (Meteor.isClient) {
  Meteor.loginWithOidc = function(options, callback) {
    // support a callback without options
    if (! callback && typeof options === "function") {
      callback = options;
      options = null;
    }
    console.log(options.loginStyle);
    console.log(callback);
    var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
    console.log("credentialCallback",credentialRequestCompleteCallback);
    Oidc.requestCredential(options, credentialRequestCompleteCallback);
  };
  }
  else {
  Accounts.addAutopublishFields({
    // not sure whether the OIDC api can be used from the browser,
    // thus not sure if we should be sending access tokens; but we do it
    // for all other oauth2 providers, and it may come in handy.
    forLoggedInUser: ['services.oidc'],
    forOtherUsers: ['services.oidc.id']
  });
}

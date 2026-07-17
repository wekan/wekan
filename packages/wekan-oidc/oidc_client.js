Oidc = {};

// Request OpenID Connect credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Oidc.requestCredential = function (options, credentialRequestCompleteCallback) {
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  Meteor.call("getServiceConfiguration", "oidc",(_, result) => {
    if (result) {
      var config = result;
      var credentialToken = Random.secret();
      // options
      options = options || {};
      // Fix #5695: OAUTH2_LOGIN_STYLE=redirect was never honored. The
      // useraccounts social-login button always passes
      // { loginStyle: 'popup' } (its client-side socialLoginStyle default),
      // and OAuth._loginStyle() lets a caller option override the loginStyle
      // stored in the service configuration. The admin's OAUTH2_LOGIN_STYLE
      // env var is authoritative for redirect: when the service is configured
      // with loginStyle 'redirect', drop the generic popup default so the
      // full-page redirect flow is used. An explicit
      // { loginStyle: 'redirect' } from a caller (the OIDC_REDIRECTION_ENABLED
      // auto-login) keeps working regardless of the configured style, and
      // popup remains the default when OAUTH2_LOGIN_STYLE is unset or popup.
      if (config.loginStyle === 'redirect') {
        options.loginStyle = 'redirect';
      }
      // OAuth._loginStyle still falls back to popup when sessionStorage is
      // unavailable (e.g. Safari private mode), which the redirect flow needs.
      var loginStyle = OAuth._loginStyle('oidc', config, options);
      // loginStyle is a Meteor-internal choice, not an OAuth2/OIDC parameter;
      // don't leak it to the provider in the authorization URL built below
      // (the URL used to contain "...&loginStyle=popup&...", see #5695).
      delete options.loginStyle;
      options.client_id = config.clientId;
      options.response_type = options.response_type || 'code';
      options.redirect_uri = OAuth._redirectUri('oidc', config);
      options.state = OAuth._stateParam(loginStyle, credentialToken, options.redirectUrl);
      options.scope = config.requestPermissions || 'openid profile email';

      if (config.loginStyle && config.loginStyle == 'popup') {
        options.display = 'popup';
      }

      var loginUrl = config.serverUrl + config.authorizationEndpoint;
      // check if the loginUrl already contains a "?"
      var first = loginUrl.indexOf('?') === -1;
      for (var k in options) {
        if (first) {
          loginUrl += '?';
          first = false;
        }
        else {
          loginUrl += '&'
        }
        loginUrl += encodeURIComponent(k) + '=' + encodeURIComponent(options[k]);
      }

      //console.log('XXX: loginURL: ' + loginUrl)

      options.popupOptions = options.popupOptions || {};
      var popupOptions = {
        width:  options.popupOptions.width || 320,
        height: options.popupOptions.height || 450
      };

      OAuth.launchLogin({
        loginService: 'oidc',
        loginStyle: loginStyle,
        loginUrl: loginUrl,
        credentialRequestCompleteCallback: credentialRequestCompleteCallback,
        credentialToken: credentialToken,
        popupOptions: popupOptions,
      });
    }
    else
    {
      credentialRequestCompleteCallback && credentialRequestCompleteCallback(
        new ServiceConfiguration.ConfigError('Service oidc not configured.'));
      return;
    }
  });


};

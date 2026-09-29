"use strict";

// Client side of SP-initiated SAML login. Popup flow (the default): open a popup at our own
// /_saml/authorize endpoint (which redirects to the identity provider),
// wait for it to close (the IdP posts back to our /_saml/validate ACS
// endpoint, which closes the popup - see saml_server.js), then exchange the
// credential token for a Meteor login via the server login handler. Mirrors
// wekan-accounts-cas's cas_client.js popup pattern.

var openCenteredPopup = function (url, width, height) {
  var screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft;
  var screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop;
  var outerWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.body.clientWidth;
  var outerHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : (document.body.clientHeight - 22);

  var left = screenX + (outerWidth - width) / 2;
  var top = screenY + (outerHeight - height) / 2;
  var features = 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',scrollbars=yes';

  var newwindow = window.open(url, '_blank', features);
  if (newwindow && newwindow.focus) newwindow.focus();
  return newwindow;
};

// SAML_LOGIN_FLOW=redirect (Admin Panel -> People -> SAML): the page itself
// goes to the identity provider and comes back to /sign-in?samlToken=<id>.
// The token is remembered in this tab before leaving, and only that token is
// exchanged on return: a samlToken this tab did not start - a link somebody
// sent - must not log the browser into the account behind it.
var SAML_PENDING_TOKEN = 'wekan-saml-pending-token';

function samlLoginFlow() {
  var config = ServiceConfiguration.configurations.findOne({ service: 'saml' });
  return config && config.loginFlow === 'redirect' ? 'redirect' : 'popup';
}

function reportSamlResult(error) {
  // The app shows it (client/components/main/layouts.js); the event can fire
  // before the sign-in form is on screen, so the app keeps the last one.
  window.dispatchEvent(new CustomEvent('wekan-saml-login', { detail: { error: error || null } }));
}

function storage() {
  try { return window.sessionStorage; } catch (e) { return null; }
}

Meteor.loginWithSaml = function (options, callback) {
  options = options || {};
  var provider = options.provider || 'default';
  var credentialToken = Random.id();

  if (samlLoginFlow() === 'redirect') {
    var store = storage();
    if (store) store.setItem(SAML_PENDING_TOKEN, credentialToken);
    window.location.assign(
      '/_saml/authorize?provider=' + encodeURIComponent(provider) +
      '&credentialToken=' + encodeURIComponent(credentialToken)
    );
    return;
  }

  var authorizeUrl =
    '/_saml/authorize?provider=' + encodeURIComponent(provider) +
    '&credentialToken=' + encodeURIComponent(credentialToken);

  var popup = openCenteredPopup(authorizeUrl, options.width || 800, options.height || 600);

  var checkPopupOpen = setInterval(function () {
    var popupClosed;
    var failureMessage;
    try {
      if (popup && popup.document) {
        var marker = popup.document.getElementById('popupCanBeClosed');
        if (marker) {
          failureMessage = marker.getAttribute('data-error');
          popup.close();
        }
      }
      popupClosed = !popup || popup.closed || popup.closed === undefined;
    } catch (e) {
      // Some browsers throw while the popup is navigating cross-origin to
      // the identity provider; treat that as "still open".
      return;
    }

    if (popupClosed) {
      clearInterval(checkPopupOpen);
      if (failureMessage) {
        if (callback) callback(new Meteor.Error('saml-login-failed', failureMessage));
        return;
      }
      Accounts.callLoginMethod({
        methodArguments: [{ saml: { credentialToken: credentialToken } }],
        userCallback: function (err) {
          if (callback) callback(err);
        },
      });
    }
  }, 100);
};

// Back from the identity provider in redirect mode. samlToken is the random
// credential id, not the assertion; both parameters are removed from the
// address bar before anything else happens.
Meteor.startup(function () {
  var params = new URLSearchParams(window.location.search);
  var credentialToken = params.get('samlToken');
  var samlError = params.get('samlError');
  if (!credentialToken && !samlError) return;
  params.delete('samlToken');
  params.delete('samlError');
  var query = params.toString();
  window.history.replaceState({}, document.title, window.location.pathname + (query ? '?' + query : ''));
  var store = storage();
  var expected = store && store.getItem(SAML_PENDING_TOKEN);
  if (store) store.removeItem(SAML_PENDING_TOKEN);
  if (samlError) {
    reportSamlResult({ reason: samlError });
    return;
  }
  if (!expected || expected !== credentialToken) {
    reportSamlResult({ error: 'saml-login-not-started' });
    return;
  }
  Accounts.callLoginMethod({
    methodArguments: [{ saml: { credentialToken: credentialToken } }],
    userCallback: function (err) {
      if (err) {
        reportSamlResult(err);
        return;
      }
      window.location.assign('/');
    },
  });
});


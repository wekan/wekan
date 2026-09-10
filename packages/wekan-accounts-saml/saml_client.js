"use strict";

// Client side of SP-initiated SAML login: open a popup at our own
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

Meteor.loginWithSaml = function (options, callback) {
  options = options || {};
  var provider = options.provider || 'default';
  var credentialToken = Random.id();

  var authorizeUrl =
    '/_saml/authorize?provider=' + encodeURIComponent(provider) +
    '&credentialToken=' + encodeURIComponent(credentialToken);

  var popup = openCenteredPopup(authorizeUrl, options.width || 800, options.height || 600);

  var checkPopupOpen = setInterval(function () {
    var popupClosed;
    try {
      if (popup && popup.document && popup.document.getElementById('popupCanBeClosed')) {
        popup.close();
      }
      popupClosed = !popup || popup.closed || popup.closed === undefined;
    } catch (e) {
      // Some browsers throw while the popup is navigating cross-origin to
      // the identity provider; treat that as "still open".
      return;
    }

    if (popupClosed) {
      clearInterval(checkPopupOpen);
      Accounts.callLoginMethod({
        methodArguments: [{ saml: { credentialToken: credentialToken } }],
        userCallback: function (err) {
          if (callback) callback(err);
        },
      });
    }
  }, 100);
};

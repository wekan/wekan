
function addParameterToURL(url, param){
  var urlSplit = url.split('?');
  return url+(urlSplit.length>0 ? '?':'&') + param;
}

// A login that comes back from the CAS server in this window (the redirect
// login, the default) carries ?casToken=. Completing it is this package's
// job, so it is done here at startup rather than left to every app; the
// result goes to the app as a 'wekan-cas-login' event, because the button's
// callback did not survive the page change.
// docs/Features/Login/CAS.md
function reportCasResult(error) {
  window.dispatchEvent(new CustomEvent('wekan-cas-login', { detail: { error: error || null } }));
}

// CAS logs in by full-page redirect unless the settings ask for the popup
// (`"popup": true`). A popup is blocked in iframes and on some phones, and a
// CAS server's Cross-Origin-Opener-Policy can cut it off from this window,
// so the login would never finish.
function casUsesPopup(settings) {
  return Boolean(settings && settings.popup === true);
}

Meteor.initCas = function(callback) {
    const casTokenMatch = window.location.href.match(/[?&]casToken=([^&]+)/);
    if (casTokenMatch == null) {
        return;
    }

    window.history.pushState('', document.title, window.location.href.replace(/([&?])casToken=[^&]+[&]?/, '$1').replace(/[?&]+$/g, ''));

    Accounts.callLoginMethod({
        methodArguments: [{ cas: { credentialToken: casTokenMatch[1] } }],
        userCallback: function(err){
            if (err == null) {
                // should we do anything on success?
            }
            if (callback != null) {
                callback(err);
            }
        }
    });
}

Meteor.loginWithCas = function(options, callback) {

    var credentialToken = Random.id();

    if (!Meteor.settings.public &&
        !Meteor.settings.public.cas &&
        !Meteor.settings.public.cas.loginUrl) {
        return;
    }

    var settings = Meteor.settings.public.cas;

    var backURL = window.location.href.replace('#', '');
    if (options != null && options.redirectUrl != null)
        backURL = options.redirectUrl;

    var serviceURL = addParameterToURL(backURL, 'casToken='+credentialToken);

    // Bind the token to THIS browser: the server accepts a CAS callback only
    // from the browser holding the matching cookie, so a casToken chosen by
    // somebody else and smuggled into a victim's CAS login is refused.
    document.cookie = 'wekan_cas_state=' + credentialToken + '; path=/; max-age=600; SameSite=Lax' +
      (window.location.protocol === 'https:' ? '; Secure' : '');

    var loginUrl = settings.loginUrl +
        "?" + (settings.serviceParam || "service") + "=" +
        encodeURIComponent(serviceURL)

    if (!casUsesPopup(settings)) {
      window.location = loginUrl;
      return;
    }

    var popup = openCenteredPopup(
        loginUrl,
        settings.width || 800,
        settings.height || 600
    );

    var checkPopupOpen = setInterval(function() {
        try {
	    if(popup && popup.document && popup.document.getElementById('popupCanBeClosed')) {
                popup.close();
      	    }
            // Fix for #328 - added a second test criteria (popup.closed === undefined)
            // to humour this Android quirk:
            // http://code.google.com/p/android/issues/detail?id=21061
            var popupClosed = popup.closed || popup.closed === undefined;
        } catch (e) {
            // For some unknown reason, IE9 (and others?) sometimes (when
            // the popup closes too quickly?) throws "SCRIPT16386: No such
            // interface supported" when trying to read 'popup.closed'. Try
            // again in 100ms.
            return;
        }

        if (popupClosed) {
            clearInterval(checkPopupOpen);

            // check auth on server.
            Accounts.callLoginMethod({
                methodArguments: [{ cas: { credentialToken: credentialToken } }],
                userCallback: err => {
                    if (typeof callback === 'function') callback(err);
                    // Fix redirect bug after login successfully
                    if (!err) {
                        window.location.href = '/';
                    }
                }
            });
        }
    }, 100);
};

var openCenteredPopup = function(url, width, height) {
  // #FIXME screenX and outerWidth are often different units on mobile screen or high DPI
    // see https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
  var screenX = typeof window.screenX !== 'undefined'
  ? window.screenX : window.screenLeft;
  var screenY = typeof window.screenY !== 'undefined'
  ? window.screenY : window.screenTop;
  var outerWidth = typeof window.outerWidth !== 'undefined'
  ? window.outerWidth : document.body.clientWidth;
  var outerHeight = typeof window.outerHeight !== 'undefined'
  ? window.outerHeight : (document.body.clientHeight - 22);
  // XXX what is the 22?

  // Use `outerWidth - width` and `outerHeight - height` for help in
  // positioning the popup centered relative to the current window
  var left = screenX + (outerWidth - width) / 2;
  var top = screenY + (outerHeight - height) / 2;
  var features = ('width=' + width + ',height=' + height +
      ',left=' + left + ',top=' + top + ',scrollbars=yes');

  var newwindow = window.open(url, '_blank', features);
  if (newwindow.focus)
    newwindow.focus();
  return newwindow;
};

Meteor.startup(function () {
  Meteor.initCas(reportCasResult);
});

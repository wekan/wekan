
Meteor.loginWithCas = function(callback) {

  var credentialToken = Random.id();

  if (!Meteor.settings.public &&
      !Meteor.settings.public.cas &&
      !Meteor.settings.public.cas.loginUrl) {
    return;
  }

  var settings = Meteor.settings.public.cas;

  var loginUrl = settings.loginUrl +
      "?" + (settings.service || "service") + "=" +
      Meteor.absoluteUrl('_cas/') +
      credentialToken;


  var fail = function (err) {
    Meteor._debug("Error from OAuth popup: " + JSON.stringify(err));
  };

  // When running on an android device, we sometimes see the
  // `pageLoaded` callback fire twice for the final page in the OAuth
  // popup, even though the page only loads once. This is maybe an
  // Android bug or maybe something intentional about how onPageFinished
  // works that we don't understand and isn't well-documented.
  var oauthFinished = false;

  var pageLoaded = function (event) {
    if (oauthFinished) {
      return;
    }

    if (event.url.indexOf(Meteor.absoluteUrl('_cas')) === 0) {

      oauthFinished = true;

      // On iOS, this seems to prevent "Warning: Attempt to dismiss from
      // view controller <MainViewController: ...> while a presentation
      // or dismiss is in progress". My guess is that the last
      // navigation of the OAuth popup is still in progress while we try
      // to close the popup. See
      // https://issues.apache.org/jira/browse/CB-2285.
      //
      // XXX Can we make this timeout smaller?
      setTimeout(function () {
        popup.close();
        // check auth on server.
        Accounts.callLoginMethod({
          methodArguments: [{ cas: { credentialToken: credentialToken } }],
          userCallback: callback
        });
      }, 100);
    }
  };

  var onExit = function () {
    popup.removeEventListener('loadstop', pageLoaded);
    popup.removeEventListener('loaderror', fail);
    popup.removeEventListener('exit', onExit);
  };

  var popup = window.open(loginUrl, '_blank', 'location=no,hidden=no');
  popup.addEventListener('loadstop', pageLoaded);
  popup.addEventListener('loaderror', fail);
  popup.addEventListener('exit', onExit);
  popup.show();

};
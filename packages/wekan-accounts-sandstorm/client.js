// Copyright (c) 2014 Sandstorm Development Group, Inc. and contributors
// Licensed under the MIT License:
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function loginWithSandstorm(connection, apiHost, apiToken) {
  // Log in the connection using Sandstorm authentication.
  //
  // After calling this, connection.sandstormUser() will reactively return an object containing
  // Sansdstorm user info, including permissions as authenticated by the server. Even if the user
  // is anonymous, this information is returned. `sandstormUser()` returns `null` up until the
  // point where login succeeds.

  // How this works:
  // 1. We create a cryptographically random token, which we're going to send to the server twice.
  // 2. We make a method call to log in with this token. The server initially has no idea who
  //    is calling and will block waiting for info. (The method is marked "wait" on the client side
  //    so that further method calls are blocked until login completes.)
  // 3. We also send an XHR with the same token. When the server receives the XHR, it harvests the
  //    Sandstorm headers, looks for the corresponding login method call, marks its connection as
  //    logged in, and then lets it return.
  //
  // We don't actually use Accounts.callLoginMethod() because we don't need or want the
  // "resume token" logic. On a disconnect, we need to re-authenticate, because the user's
  // permissions may have changed (indeed, this may be the reason for the disconnect).

  // If the connection doesn't already have a sandstormUser() method, add it now.
  if (!connection._sandstormUser) {
    connection._sandstormUser = new ReactiveVar(null);
    connection.sandstormUser = connection._sandstormUser.get.bind(connection._sandstormUser);
  }

  // Generate a random token which we'll send both over an XHR and over DDP at the same time.
  var token = Random.secret();

  var waiting = true;          // We'll keep retrying XHRs until the method returns.
  var reconnected = false;

  var onResultReceived = function (error, result) {
    waiting = false;

    if (error) {
      // ignore for now; loggedInAndDataReadyCallback() will get the error too
    } else {
      connection.onReconnect = function () {
        reconnected = true;
        loginWithSandstorm(connection, apiHost, apiToken);
      };
    }
  };

  var loggedInAndDataReadyCallback = function (error, result) {
    if (reconnected) {
      // Oh, we're already on a future connection attempt. Don't mess with anything.
      return;
    }

    if (error) {
      console.error("loginWithSandstorm failed:", error);
    } else {
      connection._sandstormUser.set(result.sandstorm);
      connection.setUserId(result.userId);
    }
  };

  Meteor.apply("loginWithSandstorm", [token],
      {wait: true, onResultReceived: onResultReceived},
      loggedInAndDataReadyCallback);

  var sendXhr = function () {
    if (!waiting) return;  // Method call finished.

    headers = {"Content-Type": "application/x-sandstorm-login-token"};

    var testInfo = localStorage.sandstormTestUserInfo;
    if (testInfo) {
      testInfo = JSON.parse(testInfo);
      if (testInfo.id) {
        headers["X-Sandstorm-User-Id"] = testInfo.id;
      }
      if (testInfo.name) {
        headers["X-Sandstorm-Username"] = encodeURI(testInfo.name);
      }
      if (testInfo.picture) {
        headers["X-Sandstorm-User-Picture"] = testInfo.picture;
      }
      if (testInfo.permissions) {
        headers["X-Sandstorm-Permissions"] = testInfo.permissions.join(",");
      }
      if (testInfo.preferredHandle) {
        headers["X-Sandstorm-Preferred-Handle"] = testInfo.preferredHandle;
      }
      if (testInfo.pronouns) {
        headers["X-Sandstorm-User-Pronouns"] = testInfo.pronouns;
      }
    }

    var postUrl = "/.sandstorm-login";
    // Sandstorm mobile apps need to point at a different host and use an Authorization token.
    if (apiHost) {
      postUrl = apiHost + postUrl;
      headers.Authorization = "Bearer " + apiToken;
    }

    // Send the token in an HTTP POST request which on the server side will allow us to receive the
    // Sandstorm headers.
    HTTP.post(postUrl,
        {content: token, headers: headers},
        function (error, result) {
      if (error) {
        console.error("couldn't get /.sandstorm-login:", error);

        if (waiting) {
          // Try again in a second.
          Meteor.setTimeout(sendXhr, 1000);
        }
      }
    });
  };

  // Wait until the connection is up before we start trying to send XHRs.
  var stopImmediately = false;  // Unfortunately, Tracker.autorun() runs the first time inline.
  var handle = Tracker.autorun(function () {
    if (!waiting) {
      if (handle) {
        handle.stop();
      } else {
        stopImmediately = true;
      }
      return;
    } else if (connection.status().connected) {
      if (handle) {
        handle.stop();
      } else {
        stopImmediately = true;
      }

      // Wait 10ms before our first attempt to send the rendezvous XHR because if it arrives
      // before the method call it will be rejected.
      Meteor.setTimeout(sendXhr, 10);
    }
  });
  if (stopImmediately) handle.stop();
}

if (__meteor_runtime_config__.SANDSTORM) {
  // Auto-login the main Meteor connection.
  loginWithSandstorm(Meteor.connection, __meteor_runtime_config__.SANDSTORM_API_HOST,
    __meteor_runtime_config__.SANDSTORM_API_TOKEN);

  if (Package["accounts-base"]) {
    // Make Meteor.loggingIn() work by calling a private method of accounts-base. If this breaks then
    // maybe we should just overwrite Meteor.loggingIn() instead.
    Tracker.autorun(function () {
      Package["accounts-base"].Accounts._setLoggingIn(!Meteor.connection.sandstormUser());
    });
  }

  Meteor.sandstormUser = function () {
    return Meteor.connection.sandstormUser();
  };

  SandstormAccounts = {
    setTestUserInfo: function (info) {
      localStorage.sandstormTestUserInfo = JSON.stringify(info);
      loginWithSandstorm(Meteor.connection, __meteor_runtime_config__.SANDSTORM_API_HOST,
         __meteor_runtime_config__.SANDSTORM_API_TOKEN);
    }
  };
}

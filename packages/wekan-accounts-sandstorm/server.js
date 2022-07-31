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

if (process.env.SANDSTORM) {
  __meteor_runtime_config__.SANDSTORM = true;
}

if (__meteor_runtime_config__.SANDSTORM) {
  if (Package["accounts-base"]) {
    // Highlander Mode: Disable all non-Sandstorm login mechanisms.
    Package["accounts-base"].Accounts.validateLoginAttempt(function (attempt) {
      if (!attempt.allowed) {
        return false;
      }
      if (attempt.type !== "sandstorm") {
        throw new Meteor.Error(403, "Non-Sandstorm login mechanisms disabled on Sandstorm.");
      }
      return true;
    });
    Package["accounts-base"].Accounts.validateNewUser(function (user) {
      if (!user.services.sandstorm) {
        throw new Meteor.Error(403, "Non-Sandstorm login mechanisms disabled on Sandstorm.");
      }
      return true;
    });
  }

  var Future = Npm.require("fibers/future");

  var inMeteor = Meteor.bindEnvironment(function (callback) {
    callback();
  });

  var logins = {};
  // Maps tokens to currently-waiting login method calls.

  if (Package["accounts-base"]) {
    Meteor.users.createIndex("services.sandstorm.id", {unique: 1, sparse: 1});
  }

  Meteor.onConnection(function (connection) {
    connection._sandstormUser = null;
    connection._sandstormSessionId = null;
    connection._sandstormTabId = null;
    connection.sandstormUser = function () {
      if (!connection._sandstormUser) {
        throw new Meteor.Error(400, "Client did not complete authentication handshake.");
      }
      return this._sandstormUser;
    };
    connection.sandstormSessionId = function () {
      if (!connection._sandstormUser) {
        throw new Meteor.Error(400, "Client did not complete authentication handshake.");
      }
      return this._sandstormSessionId;
    }
    connection.sandstormTabId = function () {
      if (!connection._sandstormUser) {
        throw new Meteor.Error(400, "Client did not complete authentication handshake.");
      }
      return this._sandstormTabId;
    }
  });

  Meteor.methods({
    loginWithSandstorm: function (token) {
      check(token, String);

      var future = new Future();

      logins[token] = future;

      var timeout = setTimeout(function () {
        future.throw(new Meteor.Error("timeout", "Gave up waiting for login rendezvous XHR."));
      }, 10000);

      var info;
      try {
        info = future.wait();
      } finally {
        clearTimeout(timeout);
        delete logins[token];
      }

      // Set connection info. The call to setUserId() resets all publishes. We update the
      // connection's sandstorm info first so that when the publishes are re-run they'll see the
      // new info. In theory we really want to update it exactly when this.userId is updated, but
      // we'd have to dig into Meteor internals to pull that off. Probably updating it a little
      // early is fine?
      //
      // Note that calling setUserId() with the same ID a second time still goes through the motions
      // of restarting all subscriptions, which is important if the permissions changed. Hopefully
      // Meteor won't decide to "optimize" this by returning early if the user ID hasn't changed.
      this.connection._sandstormUser = info.sandstorm;
      this.connection._sandstormSessionId = info.sessionId;
      this.connection._sandstormTabId = info.tabId;
      this.setUserId(info.userId);

      return info;
    }
  });

  WebApp.rawConnectHandlers.use(function (req, res, next) {
    if (req.url === "/.sandstorm-login") {
      handlePostToken(req, res);
      return;
    }
    return next();
  });

  function readAll(stream) {
    var future = new Future();

    var chunks = [];
    stream.on("data", function (chunk) {
      chunks.push(chunk.toString());
    });
    stream.on("error", function (err) {
      future.throw(err);
    });
    stream.on("end", function () {
      future.return();
    });

    future.wait();

    return chunks.join("");
  }

  var handlePostToken = Meteor.bindEnvironment(function (req, res) {
    inMeteor(function () {
      try {
        // Note that cross-origin POSTs cannot set arbitrary Content-Types without explicit CORS
        // permission, so this effectively prevents XSRF.
        if (req.headers["content-type"].split(";")[0].trim() !== "application/x-sandstorm-login-token") {
          throw new Error("wrong Content-Type for .sandstorm-login: " + req.headers["content-type"]);
        }

        var token = readAll(req);

        var future = logins[token];
        if (!future) {
          throw new Error("no current login request matching token");
        }

        var permissions = req.headers["x-sandstorm-permissions"];
        if (permissions && permissions !== "") {
          permissions = permissions.split(",");
        } else {
          permissions = [];
        }

        var sandstormInfo = {
          id: req.headers["x-sandstorm-user-id"] || null,
          name: decodeURIComponent(req.headers["x-sandstorm-username"]),
          permissions: permissions,
          picture: req.headers["x-sandstorm-user-picture"] || null,
          preferredHandle: req.headers["x-sandstorm-preferred-handle"] || null,
          pronouns: req.headers["x-sandstorm-user-pronouns"] || null,
        };

        var userInfo = {sandstorm: sandstormInfo};
        if (Package["accounts-base"]) {
          if (sandstormInfo.id) {
            // The user is logged into Sandstorm. Create a Meteor account for them, or find the
            // existing one, and record the user ID.
            var login = Package["accounts-base"].Accounts.updateOrCreateUserFromExternalService(
              "sandstorm", sandstormInfo, {profile: {name: sandstormInfo.name}});
            userInfo.userId = login.userId;
          } else {
            userInfo.userId = null;
          }
        } else {
          // Since the app isn't using regular Meteor accounts, we can define Meteor.userId()
          // however we want.
          userInfo.userId = sandstormInfo.id;
        }

        userInfo.sessionId = req.headers["x-sandstorm-session-id"] || null;
        userInfo.tabId = req.headers["x-sandstorm-tab-id"] || null;
        future.return(userInfo);
        res.writeHead(204, {});
        res.end();
      } catch (err) {
        res.writeHead(500, {
          "Content-Type": "text/plain"
        });
        res.end(err.stack);
      }
    });
  });
}

// Login and register REST endpoints.
// Replaces communitypackages:rest-accounts-password.
// Logic copied from the package source to maintain identical API behavior.

const { Meteor } = require('meteor/meteor');
const { Accounts } = require('meteor/accounts-base');
const { WebApp } = require('meteor/webapp');
const { check, Match } = require('meteor/check');
const { sendJsonResult } = require('/server/apiMiddleware');
const { buildLogoutPlan } = require('/models/lib/apiLogout');
const {
  LoginAttemptThrottle,
  resolveClientKey,
} = require('/server/lib/loginAttemptThrottle');
const {
  hasLocalPassword,
  equalizeMissingUserTiming,
} = require('/server/lib/loginTimingDefense');
const { ReactiveCache } = require('/imports/reactiveCache');
const {
  useLdapForRestLogin,
  ldapRestLoginRequest,
} = require('/server/lib/restAuthenticationMethod');
const {
  shouldRejectPasswordLogin,
} = require('/server/lib/ldapPasswordLoginGuard');

const NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length > 0;
});

// GHSA-2g94-9x3m-hv37: this REST login path does NOT go through the DDP
// accounts-lockout validateLoginAttempt hooks, so on its own it had no
// brute-force protection. Throttle failed attempts per client address. Env-
// tunable, with the same defaults as the module. Only failures count and a
// success resets the key, so correct-credential clients are never impeded.
const restLoginThrottle = new LoginAttemptThrottle({
  maxFailures: parseInt(process.env.REST_LOGIN_MAX_FAILURES, 10) || undefined,
  windowMs:
    (parseInt(process.env.REST_LOGIN_FAILURE_WINDOW_SECONDS, 10) || 0) * 1000 ||
    undefined,
  lockoutMs:
    (parseInt(process.env.REST_LOGIN_LOCKOUT_SECONDS, 10) || 0) * 1000 ||
    undefined,
});

// One uniform failure, thrown for BOTH "no such user" and "wrong password", so
// neither the status code, the message NOR the timing reveals which accounts
// exist (the old code threw a distinct 'not-found' message for missing users).
function uniformLoginError() {
  const error = new Meteor.Error(
    'login-failed',
    'Incorrect username, email address or password.',
  );
  error.statusCode = 401;
  return error;
}

function restLoginClientKey(req) {
  return resolveClientKey({
    headers: req.headers,
    socketAddress:
      (req.socket && req.socket.remoteAddress) ||
      (req.connection && req.connection.remoteAddress),
    forwardedCount: process.env.HTTP_FORWARDED_COUNT,
  });
}

// ---------------------------------------------------------------------------
// POST /users/login
// ---------------------------------------------------------------------------
WebApp.handlers.options('/users/login', function (req, res) {
  sendJsonResult(res);
});

WebApp.handlers.post('/users/login', async function (req, res) {
  const clientKey = restLoginClientKey(req);
  const now = Number(new Date());
  try {
    // GHSA-2g94-9x3m-hv37: refuse further attempts while this client is locked
    // out, before doing any user lookup or password work.
    const gate = restLoginThrottle.check(clientKey, now);
    if (gate.blocked) {
      // A canary: being locked out means this address already failed the
      // configured number of logins in a row, which nobody typing their own
      // password does. The 429 below is unchanged - the attacker learns only
      // what the throttle already told them (docs/Security/Remediation/WeKan.md §12).
      try {
        require('/server/lib/canary').tripCanary('brute.login-lockout', {
          req,
          detail: 'REST login refused while locked out',
        });
      } catch (e) {
        /* a canary must never break the login path */
      }
      const retryAfterSeconds = Math.ceil(gate.retryAfterMs / 1000);
      const error = new Meteor.Error(
        'too-many-requests',
        'Too many failed login attempts. Try again later.',
      );
      error.statusCode = 429;
      error.retryAfterSeconds = retryAfterSeconds;
      throw error;
    }

    const options = req.body;

    let user;
    if (options.email) {
      check(options, {
        email: String,
        password: String,
        code: Match.Optional(NonEmptyString),
      });
      user = await Meteor.users.findOneAsync({
        'emails.address': options.email,
      });
    } else {
      check(options, {
        username: String,
        password: String,
        code: Match.Optional(NonEmptyString),
      });
      user = await Meteor.users.findOneAsync({ username: options.username });
    }

    // #3707: LDAP credentials must run through the registered LDAP login
    // handler. A direct _checkPasswordAsync call can only authenticate a local
    // bcrypt password and rejected every LDAP-only account. _runLoginHandlers
    // is Meteor's server API for checking credentials without attaching them
    // to a DDP connection; token creation remains below in this REST route.
    const useLdap = useLdapForRestLogin({
      user,
      ldapEnabled:
        process.env.LDAP_ENABLE === 'true' || process.env.LDAP_ENABLE === true,
      usernameProvided: Boolean(options.username),
    });

    let result;
    if (useLdap) {
      result = await Accounts._runLoginHandlers(
        { connection: null },
        ldapRestLoginRequest(options.username, options.password),
      );
      if (result && result.userId) {
        user = await Meteor.users.findOneAsync(result.userId);
      }
    } else if (
      shouldRejectPasswordLogin({
        serviceName: 'password',
        user,
        env: process.env,
      })
    ) {
      // #4419: email-form REST login cannot be sent through LDAP because LDAP
      // directories authenticate their configured username field. It must not
      // fall through to a stale local hash on an LDAP-migrated account either.
      // Burn the same bcrypt work as an ordinary failure, then answer with the
      // route's uniform error so this guard reveals no account metadata.
      await equalizeMissingUserTiming(Accounts._checkPasswordAsync);
      restLoginThrottle.recordFailure(clientKey, now);
      throw uniformLoginError();
    } else if (!hasLocalPassword(user)) {
      // GHSA-2g94-9x3m-hv37: a missing user — or a non-LDAP user with no local
      // password — would otherwise return with no bcrypt work, leaking
      // existence by timing. Burn one dummy bcrypt comparison and fail with
      // the same uniform error as a wrong password.
      await equalizeMissingUserTiming(Accounts._checkPasswordAsync);
      restLoginThrottle.recordFailure(clientKey, now);
      throw uniformLoginError();
    } else {
      result = await Accounts._checkPasswordAsync(user, options.password);
    }

    if (!result || result.error || !result.userId || !user) {
      restLoginThrottle.recordFailure(clientKey, now);
      throw uniformLoginError();
    }

    // 2FA support. The password already checked out here, so a demand for the
    // second factor is not an enumeration signal; a WRONG second factor is a
    // real failed attempt and is throttled.
    if (Accounts._check2faEnabled && Accounts._check2faEnabled(user)) {
      if (!options.code) {
        Accounts._handleError('2FA code must be informed', true, 'no-2fa-code');
      }
      if (
        !Accounts._isTokenValid(
          user.services.twoFactorAuthentication.secret,
          options.code,
        )
      ) {
        restLoginThrottle.recordFailure(clientKey, now);
        Accounts._handleError('Invalid 2FA code', true, 'invalid-2fa-code');
      }
    }

    const stampedLoginToken = Accounts._generateStampedLoginToken();
    check(stampedLoginToken, { token: String, when: Date });

    await Accounts._insertLoginToken(result.userId, stampedLoginToken);

    const tokenExpiration = Accounts._tokenExpiration(stampedLoginToken.when);
    check(tokenExpiration, Date);

    // A successful login clears this client's failure counter.
    restLoginThrottle.recordSuccess(clientKey);
    restLoginThrottle.prune(now);

    sendJsonResult(res, {
      data: {
        id: result.userId,
        token: stampedLoginToken.token,
        tokenExpires: tokenExpiration,
      },
    });
  } catch (error) {
    res.statusCode = error.statusCode || 401;
    if (error.retryAfterSeconds) {
      res.setHeader('Retry-After', String(error.retryAfterSeconds));
    }
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: error.error || error.message || 'Login failed',
        reason: error.reason || error.message,
      }),
    );
  }
});

// ---------------------------------------------------------------------------
// POST /users/logout
// Fixes #1437 ("Old tokens are not replaced or set invalid"): the API could
// mint tokens via /users/login but never revoke them, so old/leaked tokens
// stayed valid until their expiry. Authenticate with the token to revoke
// (Authorization: Bearer <token>); by default only that token is removed.
// Send { "all": true } in the body to revoke every login token of the user.
// ---------------------------------------------------------------------------
WebApp.handlers.options('/users/logout', function (req, res) {
  sendJsonResult(res);
});

WebApp.handlers.post('/users/logout', async function (req, res) {
  try {
    // req.userId / req.authToken are set by the apiMiddleware bearer-token
    // and authenticateByToken middleware (loaded above via require).
    const hashedToken = req.authToken
      ? Accounts._hashLoginToken(req.authToken)
      : null;
    const plan = buildLogoutPlan({
      userId: req.userId,
      hashedToken,
      all: req.body && req.body.all,
    });

    if (!plan.ok) {
      sendJsonResult(res, {
        code: plan.status,
        data: { error: plan.error, reason: plan.reason },
      });
      return;
    }

    await Meteor.users.updateAsync(plan.selector, plan.modifier);

    sendJsonResult(res, {
      data: {
        message: plan.all
          ? 'All login tokens have been invalidated.'
          : "You've been logged out!",
      },
    });
  } catch (error) {
    res.statusCode = error.statusCode || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: error.error || error.message || 'Logout failed',
        reason: error.reason || error.message,
      }),
    );
  }
});

// ---------------------------------------------------------------------------
// POST /users/register
// ---------------------------------------------------------------------------
WebApp.handlers.options('/users/register', function (req, res) {
  sendJsonResult(res);
});

WebApp.handlers.post('/users/register', async function (req, res) {
  try {
    // SignupBleed: this asked `Accounts._options.forbidClientAccountCreation`,
    // which NOTHING IN WEKAN EVER SETS. The only `Accounts.config()` call
    // (server/accounts-common.js) sets loginExpirationInDays and nothing else;
    // `forbidClientAccountCreation: disableRegistration` goes to
    // `AccountsTemplates.configure()` in config/accounts.js, which is the
    // useraccounts package's own options object, not Meteor's. And that value is
    // read from an async `Meteor.call('isDisableRegistration')` callback that
    // fires AFTER configure() has already run - the file says so in a comment.
    //
    // So the guard was always falsy and this endpoint NEVER refused anyone.
    // "Registration disabled" in the Admin Panel closed the sign-up form and
    // left POST /users/register creating accounts for anybody who asked. The
    // setting is read from where it actually lives, the same way the
    // `isDisableRegistration` Meteor method does.
    const setting = await ReactiveCache.getCurrentSetting();
    if (setting?.disableRegistration === true) {
      // The refusal is recorded, so an attempt to register while registration is
      // off shows in Admin Panel / Problems. Every call that gets here is one:
      // the admin has turned registration off, so there is no legitimate caller.
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.register',
          action: 'blocked',
          source: 'POST /users/register',
          detail: 'refused account creation while registration is disabled',
        });
      } catch (e) {
        /* logging must never break the guard */
      }
      sendJsonResult(res, { code: 403 });
      return;
    }

    const options = req.body;
    check(options, {
      username: Match.Optional(String),
      email: Match.Optional(String),
      password: String,
    });

    const userOptions = { password: options.password };
    if (options.username) userOptions.username = options.username;
    if (options.email) userOptions.email = options.email;

    const userId = await Accounts.createUserAsync(userOptions);

    const stampedLoginToken = Accounts._generateStampedLoginToken();
    check(stampedLoginToken, { token: String, when: Date });

    await Accounts._insertLoginToken(userId, stampedLoginToken);

    const tokenExpiration = Accounts._tokenExpiration(stampedLoginToken.when);
    check(tokenExpiration, Date);

    sendJsonResult(res, {
      data: {
        token: stampedLoginToken.token,
        tokenExpires: tokenExpiration,
        id: userId,
      },
    });
  } catch (error) {
    res.statusCode = error.statusCode || 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: error.error || error.message || 'Registration failed',
        reason: error.reason || error.message,
      }),
    );
  }
});

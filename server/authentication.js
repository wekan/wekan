import { ReactiveCache } from '/imports/reactiveCache';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { tripCanary } from '/server/lib/canary';
import { authEnv, authEnvObject, onAuthConfigChange } from '/server/lib/authConfig';
const { requestPermissions: oauth2RequestPermissions } = require('/models/lib/oauth2Scopes');

const {
  shouldRejectPasswordLogin,
  LDAP_PASSWORD_LOGIN_DISABLED_REASON,
} = require('/server/lib/ldapPasswordLoginGuard');

// Which canary a refused board write trips. A read-only member writing is
// ReadOnlyBleed's shape; anything else without the write capability stays
// under the generic one (AssignedBleed). Kept outside checkBoardWriteAccess,
// which decides from the shared capability table alone.
function writeRefusalCanary(board, userId) {
  const member = (board && board.members || []).find(m => m && m.userId === userId && m.isActive);
  return member && member.isReadOnly ? 'board.readonly-write' : 'board.write-without-capability';
}

// Authentication helpers — exported for use by API routes and model files
export const Authentication = {
  // Despite the name, this is the SITE ADMIN check: a caller who is logged in
  // but not an admin is refused with 403. GHSA-r3c4-5xwp-vf54 read it as a login
  // check and reported GET /api/boards/:boardId/domains as open to every user;
  // it never was (tests/restBoardDomainsAccess.test.cjs). checkLoggedIn below is
  // the login check.
  async checkUserId(userId) {
    if (!userId) {
      const error = new Meteor.Error('Unauthorized', 'Unauthorized');
      error.statusCode = 401;
      throw error;
    }
    const admin = await ReactiveCache.getUser({ _id: userId, isAdmin: true });

    if (!admin) { // not `=== undefined`: a null from the cache must refuse too
      const error = new Meteor.Error('Forbidden', 'Forbidden');
      error.statusCode = 403;
      throw error;
    }
  },

  // This will only check if the user is logged in.
  // The authorization checks for the user will have to be done inside each API endpoint
  checkLoggedIn(userId) {
    if (!userId) {
      const error = new Meteor.Error('Unauthorized', 'Unauthorized');
      error.statusCode = 401;
      throw error;
    }
  },

  // An admin should be authorized to access everything, so we use a separate check for admins
  // This throws an error if otherReq is false and the user is not an admin
  async checkAdminOrCondition(userId, otherReq) {
    if (otherReq) return;
    const admin = await ReactiveCache.getUser({ _id: userId, isAdmin: true });
    if (!admin) { // not `=== undefined`: a null from the cache must refuse too
      const error = new Meteor.Error('Forbidden', 'Forbidden');
      error.statusCode = 403;
      throw error;
    }
  },

  // Helper function. Will throw an error if the user is not active BoardAdmin or active Normal user of the board.
  async checkBoardAccess(userId, boardId) {
    Authentication.checkLoggedIn(userId);
    const board = await ReactiveCache.getBoard(boardId);
    Authentication.checkBoardExists(board);
    // AssignedBleed sibling (2026-10-02): the routes behind this check read
    // the WHOLE board - every list, card, checklist, comment - and an
    // assigned-only member may see only the cards assigned to them. They were
    // let through, so REST handed them the cards the UI hides. They are
    // refused here until those routes scope to assigned cards (TODO Later);
    // not recorded, since an API client of such a member reaches it in
    // ordinary use.
    const normalAccess = board.members.some(e => e.userId === userId && e.isActive && !e.isNoComments && !e.isCommentOnly && !e.isWorker &&
      !e.isNormalAssignedOnly && !e.isCommentAssignedOnly && !e.isReadAssignedOnly);
    await Authentication.checkAdminOrCondition(userId, normalAccess);
  },

  // Helper function. Will throw an error if the user does not have the
  // canonical board write capability.
  async checkBoardWriteAccess(userId, boardId) {
    Authentication.checkLoggedIn(userId);
    const board = await ReactiveCache.getBoard(boardId);
    Authentication.checkBoardExists(board);
    // AssignedBleed (GHSA-f396-42fx-vr88): the old hand-written exclusion
    // omitted isCommentAssignedOnly, so that non-writing role could mutate
    // cards through every REST route using this helper. Read the same role
    // capability table as DDP permissions and the client instead.
    const writeAccess = allowIsBoardMemberWithWriteAccess(userId, board);
    if (!writeAccess) {
      const admin = await ReactiveCache.getUser({ _id: userId, isAdmin: true });
      if (!admin) { // not `=== undefined`: a null from the cache must refuse too
        tripCanary(writeRefusalCanary(board, userId), { userId });
      }
    }
    await Authentication.checkAdminOrCondition(userId, writeAccess);
  },

  // Helper function. Will throw an error if the user is not a board admin.
  async checkBoardAdmin(userId, boardId) {
    Authentication.checkLoggedIn(userId);
    const board = await ReactiveCache.getBoard(boardId);
    Authentication.checkBoardExists(board);
    const adminAccess = board.members.some(e => e.userId === userId && e.isActive && e.isAdmin);
    try {
      await Authentication.checkAdminOrCondition(userId, adminAccess);
    } catch (error) {
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.manage-board', action: 'blocked',
          source: 'rest:board-admin',
          detail: 'Board management denied because the caller is not an administrator.',
        });
      } catch (e) { /* logging must never break the guard */ }
      throw error;
    }
  },

  // Helper function. Throws a 404 error when the board does not exist, so REST
  // handlers return HTTP 404 instead of crashing on `board.members` of an
  // undefined board (which surfaced as a generic HTTP 500). See #5804.
  checkBoardExists(board) {
    if (!board) {
      const error = new Meteor.Error('NotFound', 'Board not found');
      error.statusCode = 404;
      throw error;
    }
  },
};

Meteor.startup(() => {
  // The per-account brake (server/lib/accountLoginDelay.js) for DDP password
  // logins. Meteor has checked the password by now, but an attempt outside the
  // account's slot is refused whatever the outcome, so the answer reveals
  // nothing and parallel connections gain nothing.
  Accounts.validateLoginAttempt(function(options) {
    if (options.type !== 'password' || !options.user) return true;
    const { accountLoginDelay, recordAccountDelay } = require('/server/lib/accountLoginDelay');
    const connection = options.connection || {};
    const address = require('/server/lib/loginAttemptThrottle').resolveClientKey({
      headers: connection.httpHeaders || {},
      socketAddress: connection.clientAddress,
      forwardedCount: process.env.HTTP_FORWARDED_COUNT,
    });
    const now = Date.now();
    const gate = accountLoginDelay.decide(options.user._id, address, now);
    if (!gate.allowed) {
      recordAccountDelay(options.user._id, address, gate.retryAfterMs, 'ddp-login:account-delay');
      throw new Meteor.Error('too-many-requests', 'Too many failed login attempts. Try again later.');
    }
    if (options.allowed) accountLoginDelay.recordSuccess(options.user._id, address, now);
    else accountLoginDelay.recordFailure(options.user._id, address, now);
    return true;
  });

  Accounts.validateLoginAttempt(function(options) {
    const user = options.user || {};
    return !options.user || require('/server/lib/activeUser').allowActiveUser(user, 'ddp-login');
  });

  // #4419 (Severity:Security): after a user is migrated from local password
  // login to LDAP (authenticationMethod: 'ldap'), the stale local password in
  // services.password would otherwise still work. Reject password-service
  // logins for LDAP users — but only while LDAP is actually enabled, never for
  // other services ('ldap', 'resume', 'oidc', 'cas', 'saml', …), never when
  // LDAP_LOGIN_FALLBACK=true (that feature intentionally routes LDAP logins
  // through the password service), and never when the operator opted out with
  // LDAP_MIGRATION_ALLOW_PASSWORD_LOGIN=true. Full decision logic and
  // rationale live in server/lib/ldapPasswordLoginGuard.js.
  Accounts.validateLoginAttempt(function(options) {
    if (
      shouldRejectPasswordLogin({
        serviceName: options.type,
        user: options.user,
        env: authEnvObject,
      })
    ) {
      throw new Meteor.Error(
        'ldap-password-login-disabled',
        LDAP_PASSWORD_LOGIN_DISABLED_REASON,
      );
    }
    return true;
  });

  // OAuth2/OIDC and CAS are configured by reconfigureOidc()/reconfigureCas()
  // below, from Admin Panel / People or the environment, at startup and again
  // whenever their settings change. SAML is applied by server/saml.js.
});

const isTrue = value => value === 'true';

// The OAuth2/OIDC login service (wekan-oidc). Oracle OIM uses the same
// service with its own token exchange (packages/wekan-oidc/oidc_server.js).
// Switched off, the service configuration is removed, so a login method turned
// off in the Admin Panel stops offering itself instead of keeping the last one.
export async function reconfigureOidc() {
  if (!isTrue(authEnv('ORACLE_OIM_ENABLED')) && !isTrue(authEnv('OAUTH2_ENABLED'))) {
    await ServiceConfiguration.configurations.removeAsync({ service: 'oidc' });
    return;
  }
  await ServiceConfiguration.configurations.upsertAsync(
    { service: 'oidc' },
    {
      $set: {
        // #5695: the client now honors a configured 'redirect' style, so
        // the fallback here must stay 'popup' to keep popup the default
        // behavior when OAUTH2_LOGIN_STYLE is not set.
        loginStyle: authEnv('OAUTH2_LOGIN_STYLE') === 'redirect' ? 'redirect' : 'popup',
        clientId: authEnv('OAUTH2_CLIENT_ID'),
        // Meteor's loginServiceConfiguration publication leaves `secret` out.
        secret: authEnv('OAUTH2_SECRET'),
        serverUrl: authEnv('OAUTH2_SERVER_URL'),
        authorizationEndpoint: authEnv('OAUTH2_AUTH_ENDPOINT'),
        userinfoEndpoint: authEnv('OAUTH2_USERINFO_ENDPOINT'),
        tokenEndpoint: authEnv('OAUTH2_TOKEN_ENDPOINT'),
        idTokenWhitelistFields: authEnv('OAUTH2_ID_TOKEN_WHITELIST_FIELDS') || [],
        // #6545: a value configured with surrounding quotes - which the snap
        // default and every wiki example used to have - reached the provider as
        // the scope `'openid` … `email'` and Keycloak refused the request.
        requestPermissions: oauth2RequestPermissions(authEnv('OAUTH2_REQUEST_PERMISSIONS')),
      },
    },
  );
}

export async function reconfigureCas() {
  if (!isTrue(authEnv('CAS_ENABLED'))) {
    await ServiceConfiguration.configurations.removeAsync({ service: 'cas' });
    return;
  }
  await ServiceConfiguration.configurations.upsertAsync(
    { service: 'cas' },
    {
      $set: {
        baseUrl: authEnv('CAS_BASE_URL'),
        loginUrl: authEnv('CAS_LOGIN_URL'),
        serviceParam: 'service',
        popupWidth: 810,
        popupHeight: 610,
        popup: true,
        autoClose: true,
        // CAS_VALIDATE_URL is the documented name; the code used to read only
        // the misspelling CASE_VALIDATE_URL, which authEnv still falls back to.
        validateUrl: authEnv('CAS_VALIDATE_URL'),
        casVersion: 3.0,
        attributes: {
          debug: process.env.DEBUG === 'true',
        },
      },
    },
  );
}

onAuthConfigChange('oidc', reconfigureOidc);
onAuthConfigChange('cas', reconfigureCas);


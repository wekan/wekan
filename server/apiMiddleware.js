// API middleware: body parsing, auth token handling, API gate, and JSON response helper.
// Replaces communitypackages:json-routes middleware chain.
// Must be imported before model files that register API routes.

const { Meteor } = require('meteor/meteor');
const { Accounts } = require('meteor/accounts-base');
const { WebApp } = require('meteor/webapp');
const bodyParser = require('body-parser');
const { safeJsonStringify } = require('/server/lib/apiResponseHelpers');

// ---------------------------------------------------------------------------
// 1. Body parsing (previously registered by json-routes)
// ---------------------------------------------------------------------------
WebApp.handlers.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
WebApp.handlers.use(bodyParser.json({ limit: '50mb' }));

// ---------------------------------------------------------------------------
// 2. API gate — check WITH_API env var (previously in models/users.js)
// ---------------------------------------------------------------------------
WebApp.handlers.use(function apiGate(req, res, next) {
  const api = req.url.startsWith('/api');
  if ((api && process.env.WITH_API === 'true') || !api) {
    return next();
  }
  // REFUSED, IN WORDS - not a redirect to the front page.
  //
  // This used to answer `301 Location: /`, and every export in the interface is
  // a download from an `/api/...` address: a board or a card to PDF, Excel,
  // JSON, .zip, CSV. The browser followed the redirect, got WeKan's own HTML
  // page, and wrote it to the file the download link had named - so "the API is
  // off" arrived as a PDF that no reader could open, with nothing anywhere
  // saying why. A 403 with a sentence in it cannot be mistaken for the file
  // that was asked for, and it says what to change.
  res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
  return res.end(
    'WeKan API is disabled, so this address answers nothing.\n'
    + '\n'
    + 'Exports use it too - a board or card exported to PDF, Excel, JSON, .zip\n'
    + 'or CSV is a download from /api/..., so with the API off none of them can\n'
    + 'work. Set the environment variable WITH_API=true and restart WeKan.\n',
  );
});

// ---------------------------------------------------------------------------
// 3. Bearer token parser (replaces communitypackages:rest-bearer-token-parser)
// ---------------------------------------------------------------------------
WebApp.handlers.use(function parseBearerToken(req, res, next) {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      req.authToken = match[1];
    }
  }

  // Fallback to access_token query param
  if (!req.authToken && req.query && req.query.access_token) {
    req.authToken = req.query.access_token;
  }

  next();
});

// ---------------------------------------------------------------------------
// 4. User authentication (replaces communitypackages:authenticate-user-by-token)
// ---------------------------------------------------------------------------
WebApp.handlers.use(async function authenticateByToken(req, res, next) {
  if (req.authToken) {
    try {
      const hashedToken = Accounts._hashLoginToken(req.authToken);
      const user = await Meteor.users.findOneAsync(
        { 'services.resume.loginTokens.hashedToken': hashedToken },
        { fields: { _id: 1 } },
      );
      if (user) {
        req.userId = user._id;
      }
    } catch (e) {
      // Ignore auth errors — routes handle missing userId themselves
    }
  }
  next();
});

// ---------------------------------------------------------------------------
// 4b. API usage counting (Admin Panel -> Problems -> API)
// ---------------------------------------------------------------------------
// After authentication, so a call has an account, and in front of the routes, so
// a route cannot be added without being counted. It counts on the response's
// `finish` event - by then Express has filled req.route.path, which is the route
// PATTERN and therefore one row per endpoint rather than one per board id.
WebApp.handlers.use(require('/server/lib/apiUsageLog').apiUsageMiddleware);

// ---------------------------------------------------------------------------
// 5. sendJsonResult — drop-in replacement for JsonRoutes.sendResult
// ---------------------------------------------------------------------------
function sendJsonResult(res, options) {
  options = options || {};

  // Default response headers (matching json-routes behavior)
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  // Custom headers
  if (options.headers) {
    Object.entries(options.headers).forEach(function ([key, value]) {
      res.setHeader(key, value);
    });
  }

  // Status code
  res.statusCode = options.code || 200;

  // JSON body
  if (options.data !== undefined) {
    const shouldPrettyPrint = process.env.NODE_ENV === 'development';
    const spacer = shouldPrettyPrint ? 2 : null;
    res.setHeader('Content-Type', 'application/json');
    // Use a crash-proof serializer: some error payloads (e.g. a circular
    // SimpleSchema validation error) would otherwise throw inside
    // JSON.stringify and surface as a generic HTTP 500. See #5804.
    res.write(safeJsonStringify(options.data, spacer));
  }

  res.end();
}

// GHSA-3gcg-g6rf-w2rx: an export route that throws must not escape as an unhandled
// promise rejection. This app turns one of those into a full process crash - the
// note in server/ldapGroupSync.js explains why - so a single crafted request could
// take the server down for everyone. Every route body wrapped in this answers with a
// 500 instead, and the request that caused it is logged.
//
// The guards inside the handlers are still the real fix; this is the net under them,
// so the next missing null check is one broken request rather than an outage.
function safeRoute(handler) {
  return async function safeRouteHandler(req, res, ...rest) {
    try {
      return await handler.call(this, req, res, ...rest);
    } catch (error) {
      console.error('[api] unhandled error while serving',
        (req && req.url) || 'a request', error);
      try {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        }
        res.end('Internal server error');
      } catch (_) {
        // The response is already gone; nothing left to answer with.
      }
      return undefined;
    }
  };
}

module.exports = { sendJsonResult, safeRoute };

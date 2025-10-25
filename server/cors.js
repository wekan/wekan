Meteor.startup(() => {
  // Set Permissions-Policy header to suppress browser warnings about experimental features
  WebApp.rawConnectHandlers.use(function(req, res, next) {
    // Disable experimental advertising and privacy features that cause browser warnings
    res.setHeader('Permissions-Policy', 
      'browsing-topics=(), ' +
      'run-ad-auction=(), ' +
      'join-ad-interest-group=(), ' +
      'private-state-token-redemption=(), ' +
      'private-state-token-issuance=(), ' +
      'private-aggregation=(), ' +
      'attribution-reporting=()'
    );
    return next();
  });

  if (process.env.CORS) {
    // Listen to incoming HTTP requests, can only be used on the server
    WebApp.rawConnectHandlers.use(function(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', process.env.CORS);
      return next();
    });
  }
  if (process.env.CORS_ALLOW_HEADERS) {
    WebApp.rawConnectHandlers.use(function(req, res, next) {
      res.setHeader(
        'Access-Control-Allow-Headers',
        process.env.CORS_ALLOW_HEADERS,
      );
      return next();
    });
  }
  if (process.env.CORS_EXPOSE_HEADERS) {
    WebApp.rawConnectHandlers.use(function(req, res, next) {
      res.setHeader(
        'Access-Control-Expose-Headers',
        process.env.CORS_EXPOSE_HEADERS,
      );
      return next();
    });
  }
});

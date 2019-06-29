Meteor.startup(() => {
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

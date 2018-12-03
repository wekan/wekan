Meteor.startup(() => {

  if ( process.env.CORS ) {
    // Listen to incoming HTTP requests, can only be used on the server
    WebApp.rawConnectHandlers.use(function(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', process.env.CORS);
      return next();
    });
  }

});

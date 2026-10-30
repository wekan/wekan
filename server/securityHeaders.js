import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { authEnv } from '/server/lib/authConfig';

// Strict-Transport-Security, X-Content-Type-Options and Referrer-Policy on
// every response; what they are and when HSTS is sent is
// models/lib/securityHeaders.js. A rawHandler runs before every other handler,
// static files included, and a route that sets one of these headers itself
// (the file routes do) overwrites it after this.
const { securityHeaders } = require('/models/lib/securityHeaders');

WebApp.rawHandlers.use((req, res, next) => {
  try {
    for (const [name, value] of securityHeaders(authEnv, process.env.ROOT_URL || Meteor.absoluteUrl())) {
      if (!res.headersSent) res.setHeader(name, value);
    }
  } catch (e) {
    // A header that cannot be computed must not fail the request.
  }
  next();
});

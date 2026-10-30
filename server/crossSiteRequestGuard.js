import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// A state-changing request that carries the login only as a cookie must come
// from WeKan's own origin (models/lib/crossSiteRequest.js says which requests
// and why). A rawHandler, so it runs before every route, whichever file
// registered the route and whenever it was imported.
const { crossSiteCookieRequest } = require('/models/lib/crossSiteRequest');

WebApp.rawHandlers.use((req, res, next) => {
  let decision;
  try {
    decision = crossSiteCookieRequest(req, process.env.ROOT_URL || Meteor.absoluteUrl());
  } catch (e) {
    decision = { block: false };
  }
  if (!decision.block) return next();
  try {
    // Nobody's account is named: the cookie is the victim's, not the sender's.
    require('/server/lib/securityLog').record({
      key: 'csrf.cross-site-cookie', action: 'blocked', req,
      source: `${req.method} ${String(req.url || '').split('?')[0]}`,
      detail: `Cross-site request refused: ${decision.reason} ${decision.origin}`,
    });
  } catch (e) { /* logging must never break the guard */ }
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'cross-site-request' }));
  return undefined;
});

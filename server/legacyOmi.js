import { WebApp } from 'meteor/webapp';
import {
  CAPABILITY_SCRIPT_PATH,
  capabilityScript,
  isDocumentRequest,
  renderLegacyOmiPage,
} from '/imports/lib/legacyOmi';

// Progressive enhancement starts with a usable document. A capable browser
// requests the normal Meteor document using a request header after the small
// external probe succeeds. No browser name, cookie or URL mode flag is used.
WebApp.handlers.get(CAPABILITY_SCRIPT_PATH, (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(capabilityScript);
});

WebApp.handlers.use((req, res, next) => {
  if (!isDocumentRequest(req)) return next();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'X-Wekan-Progressive-Client, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(renderLegacyOmiPage(req.url));
});

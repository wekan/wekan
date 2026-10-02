//import { BrowserPolicy } from 'meteor/browser-policy-common';
import { WebApp } from 'meteor/webapp';
const { framingHeaders } = require('/models/lib/framePolicy');

// FrameBleed (restored 2026-10-02): the framing restriction below was all
// commented out when browser-policy was removed in 2022, so WeKan's pages
// could be framed by any site. It is set here, as a raw header, for every
// response; a route that sets its own Content-Security-Policy (file
// responses) replaces it with a stricter one.
const FRAMING_HEADERS = framingHeaders({
  enabled: process.env.BROWSER_POLICY_ENABLED === 'true',
  trustedUrl: process.env.TRUSTED_URL,
  sandstorm: !!(Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm),
});
if (Object.keys(FRAMING_HEADERS).length) {
  WebApp.rawHandlers.use((req, res, next) => {
    for (const [name, value] of Object.entries(FRAMING_HEADERS)) res.setHeader(name, value);
    next();
  });
}

Meteor.startup(() => {
/*
  // Default allowed
  BrowserPolicy.content.allowInlineScripts();
  BrowserPolicy.content.allowEval();
  BrowserPolicy.content.allowInlineStyles();
  BrowserPolicy.content.allowOriginForAll('*');
  // Allow all images from anywhere
  BrowserPolicy.content.allowImageOrigin('*');
  BrowserPolicy.content.allowDataUrlForAll();
*/

  if (process.env.BROWSER_POLICY_ENABLED === 'true') {
    // Trusted URL that can embed Wekan in iFrame.
    const trusted = process.env.TRUSTED_URL;
    ////BrowserPolicy.framing.disallow();
    //Allow inline scripts, otherwise there is errors in browser/inspect/console
    //BrowserPolicy.content.disallowInlineScripts();
    //BrowserPolicy.content.disallowEval();
    //BrowserPolicy.content.allowInlineStyles();
    //BrowserPolicy.content.allowFontDataUrl();
    ////BrowserPolicy.framing.restrictToOrigin(trusted);
    //BrowserPolicy.content.allowScriptOrigin(trusted);
  } else {
    // Disable browser policy and allow all framing and including.
    // Use only at internal LAN, not at Internet.
    ////BrowserPolicy.framing.allowAll();
  }


  // If Matomo URL is set, allow it.
  const matomoUrl = process.env.MATOMO_ADDRESS;
  if (matomoUrl) {
    //BrowserPolicy.content.allowScriptOrigin(matomoUrl);
    //BrowserPolicy.content.allowImageOrigin(matomoUrl);
  }
});

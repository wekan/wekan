import { BrowserPolicy } from 'meteor/browser-policy-common';

Meteor.startup(() => {

  if ( process.env.BROWSER_POLICY_ENABLED === 'true' ) {
    // Trusted URL that can embed Wekan in iFrame.
    const trusted = process.env.TRUSTED_URL;
    BrowserPolicy.framing.disallow();
    //Allow inline scripts, otherwise there is errors in browser/inspect/console
    //BrowserPolicy.content.disallowInlineScripts();
    BrowserPolicy.content.disallowEval();
    BrowserPolicy.content.allowInlineStyles();
    BrowserPolicy.content.allowFontDataUrl();
    BrowserPolicy.framing.restrictToOrigin(trusted);
    BrowserPolicy.content.allowScriptOrigin(trusted);
  }
  else {
    // Disable browser policy and allow all framing and including.
    // Use only at internal LAN, not at Internet.
    BrowserPolicy.framing.allowAll();
    BrowserPolicy.content.allowDataUrlForAll();
  }

  // Allow all images from anywhere
  BrowserPolicy.content.allowImageOrigin('*');

  // If Matomo URL is set, allow it.
  const matomoUrl = process.env.MATOMO_ADDRESS;
  if (matomoUrl){
    BrowserPolicy.content.allowScriptOrigin(matomoUrl);
    BrowserPolicy.content.allowImageOrigin(matomoUrl);
  }

});

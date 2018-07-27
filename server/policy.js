import { BrowserPolicy } from 'meteor/browser-policy-common';

Meteor.startup(() => {
  const matomoUrl = process.env.MATOMO_ADDRESS;
  if (matomoUrl){
    BrowserPolicy.content.allowScriptOrigin(matomoUrl);
    BrowserPolicy.content.allowImageOrigin(matomoUrl);
  }
});

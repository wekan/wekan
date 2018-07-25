import { BrowserPolicy } from 'meteor/browser-policy-common';

Meteor.startup(() => {
  BrowserPolicy.content.allowScriptOrigin('https://piwik.sii.fr/');
  BrowserPolicy.content.allowImageOrigin('https://piwik.sii.fr/');
});

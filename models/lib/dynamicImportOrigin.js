'use strict';

// Where the browser fetches lazily loaded code from.
//
// Meteor's dynamic-import fetches every import() the first page load did not
// include from Meteor.absoluteUrl('__meteor__/dynamic-import/fetch') - that is,
// from ROOT_URL's HOST. A browser that reached WeKan by another name or an IP
// cannot always resolve or reach that host: on Univention (UCS) opened through
// 127.0.0.1:8443/wekan, the fetch went to the ROOT_URL host
// ucs-2275.wekan.intranet, failed with NS_ERROR_UNKNOWN_HOST ("Cross-Origin
// Request Blocked ... CORS request did not succeed"), and the parts of WeKan
// loaded that way never arrived.
//
// Meteor has the setting for this: dynamic-import's useLocationOrigin fetches
// from the page's own origin plus ROOT_URL's path prefix - the one address the
// browser has proved it can reach, since it loaded the page from it. This is
// loading WeKan's own code, not a link anybody shares, so it does not touch
// the rule in browserRootUrl.js that a real ROOT_URL wins for links.
//
// An administrator who set packages.dynamic-import.useLocationOrigin in
// METEOR_SETTINGS keeps their value, false included.
function applyDynamicImportOrigin(publicSettings) {
  const settings = publicSettings || {};
  if (!settings.packages || typeof settings.packages !== 'object') settings.packages = {};
  const current = settings.packages['dynamic-import'];
  const dynamicImport = current && typeof current === 'object' ? current : {};
  if (typeof dynamicImport.useLocationOrigin !== 'boolean') dynamicImport.useLocationOrigin = true;
  settings.packages['dynamic-import'] = dynamicImport;
  return settings;
}

module.exports = { applyDynamicImportOrigin };

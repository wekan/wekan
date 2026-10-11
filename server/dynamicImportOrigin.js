import { Meteor } from 'meteor/meteor';

// Lazily loaded code is fetched from the page's own origin, not ROOT_URL's host
// (models/lib/dynamicImportOrigin.js says why). Meteor.settings.public is the
// object sent to the browser as PUBLIC_SETTINGS, so setting it here is enough;
// it runs at load, before any page is served.
const { applyDynamicImportOrigin } = require('/models/lib/dynamicImportOrigin');

if (!Meteor.settings.public) Meteor.settings.public = {};
applyDynamicImportOrigin(Meteor.settings.public);

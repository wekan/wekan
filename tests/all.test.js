/* eslint-env mocha */

import '/imports/i18n/i18n.test.js';

if (Meteor.isServer) {
  require('/server/lib/tests/index');
}

if (Meteor.isClient) {
  require('/client/lib/tests');
}

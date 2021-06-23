/* eslint-env mocha */

// This is the main test file from which all tests can be imported top-down,
// creating a directed sequence for tests that sums up to our test-suite.
//
// You propably want to start with low-level code and follow up to higher-level
// code, like for example:
//
// infrastructure
// utils / helpers
// contexts
// api
// components
// ui

// If you want to run tests on both, server AND client, simply import them as
// they are. However, if you want to restict tests to server-only or client-only
// you need to wrap them inside a new describe-block

if (Meteor.isServer) {
  describe('server', function() {
    import '../server/lib/utils.tests';
  });
}

if (Meteor.isClient) {
  describe('lib', function() {
    import '../client/lib/tests';
  });
}

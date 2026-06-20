// Pure, dependency-free helper for rendering custom-field number values (#2091).
// The implementation lives in /imports/lib/customNumberFormat.js (an isomorphic
// file) so client and server share identical logic. This module re-exports the
// pure function at the documented test path and is itself free of any
// Meteor/Mongo runtime dependency.
export { formatNumberValue } from '/imports/lib/customNumberFormat';

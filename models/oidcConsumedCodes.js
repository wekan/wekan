import { Mongo } from 'meteor/mongo';

// SECURITY: records OIDC authorization `code` values already exchanged for a
// token. A captured /_oauth/oidc?state=...&code=... request must not be
// replayable into a brand-new, valid Wekan session (e.g. after the original
// user has logged out) even if the identity provider itself tolerates a
// repeated code exchange. RFC 6749 4.1.2 requires authorization codes be
// single-use; this collection lets Wekan enforce that itself instead of
// trusting the IdP alone. See packages/wekan-oidc/oidc_server.js.
const OidcConsumedCodes = new Mongo.Collection('oidc_consumed_codes');

export default OidcConsumedCodes;

'use strict';

// Use only the profile returned by node-saml after signature validation.
// Email and username are mutable attributes, never the subject's identity.
const fields = ['issuer', 'nameID', 'nameIDFormat', 'nameQualifier', 'spNameQualifier'];
function samlIdentity(profile) {
  if (!profile || typeof profile.issuer !== 'string' || !profile.issuer.trim() ||
      typeof profile.nameID !== 'string' || !profile.nameID.trim()) return null;
  const identity = {};
  for (const field of fields) {
    const value = profile[field];
    if (value != null && typeof value !== 'string') return null;
    identity[field] = value || '';
  }
  // Transient subjects cannot provide a durable account binding.
  if (identity.nameIDFormat === 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient') return null;
  return identity;
}
function samlIdentitySelector(identity) {
  return Object.fromEntries(fields.map(field => [`services.saml.${field}`, identity[field]]));
}
function samlEmailVerified(profile) {
  // SAML has no standard email-verification flag. Only an explicit boolean
  // attestation (XML uses a string) is accepted; absence and arrays fail closed.
  return profile.email_verified === true || profile.email_verified === 'true';
}
module.exports = { samlIdentity, samlIdentitySelector, samlEmailVerified };

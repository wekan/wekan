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

// Why a SAML login may NOT be linked to an existing local account, or null when
// it may. The refusal itself is unchanged and fails closed; what changed is
// that each condition has its own reason. They all used to throw the same
// "SAML identity does not match this account", so neither the user nor the
// administrator could tell a missing `email_verified` attribute from a real
// conflict, and nothing was logged.
//
// `userMessage` is set only for a fault in the ASSERTION (the IdP's attribute
// configuration), which the administrator fixes at the IdP. A refusal caused
// by the local account's own state keeps the generic message; its reason is
// for the server log.
const GENERIC_CONFLICT = 'SAML identity does not match this account. Contact your administrator.';
function samlLinkRefusal({ user, email, profile, mergeAllowed }) {
  // Never rebind an existing or legacy SAML identity, even with merging on.
  // Missing legacy scope can also be an ordinary login after upgrade.
  if (user.authenticationMethod === 'saml' || user.services?.saml) {
    return { reason: 'account-already-bound-to-saml', recordAttempt: Boolean(samlIdentity(user.services?.saml)) };
  }
  if (!mergeAllowed) return { reason: 'merge-disabled (SAML_MERGE_EXISTING_USERS is not true)', recordAttempt: true };
  if (!email) {
    return {
      reason: 'assertion-has-no-email',
      recordAttempt: true,
      userMessage: 'The SAML assertion has no email address, which linking an existing account requires. Contact your administrator.',
    };
  }
  if (!samlEmailVerified(profile)) {
    return {
      reason: 'assertion-has-no-email_verified=true attribute',
      recordAttempt: true,
      userMessage: 'The identity provider did not send the attribute email_verified=true, which linking an existing account requires. Contact your administrator.',
    };
  }
  if (!user.emails?.some(entry => entry.address === email && entry.verified === true)) {
    return { reason: 'assertion-email-is-not-a-verified-email-of-this-account', recordAttempt: true };
  }
  return null;
}

module.exports = { samlIdentity, samlIdentitySelector, samlEmailVerified, samlLinkRefusal, GENERIC_CONFLICT };

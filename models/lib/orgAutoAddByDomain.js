'use strict';

// Pure matching logic for the Organization setting
// "Automatically add users with the domain name"
// (org.orgAutoAddUsersWithDomainName).
//
// #5351: an organization can store an email domain in
// `orgAutoAddUsersWithDomainName`. When a new user signs up, every organization
// whose configured domain equals the domain part of the user's email must gain
// that user as a member. The sign-up hook never read this field, so the feature
// did nothing. This helper is the pure decision extracted from that hook so it
// can be unit-tested without Meteor: given an email and the list of orgs, it
// returns the ids of the orgs the user should be auto-added to.

// Return the lower-cased domain part of an email address (the text after the
// last '@'), or '' when there is no usable domain. Whitespace is trimmed.
function emailDomain(email) {
  if (typeof email !== 'string') return '';
  const at = email.lastIndexOf('@');
  if (at === -1) return '';
  return email
    .slice(at + 1)
    .trim()
    .toLowerCase();
}

// Normalise a configured org domain for comparison. Trims, lower-cases and
// tolerates an admin typing it with a leading '@' (e.g. "@example.com").
function normalizeOrgDomain(domain) {
  if (typeof domain !== 'string') return '';
  let d = domain.trim().toLowerCase();
  if (d.startsWith('@')) d = d.slice(1);
  return d.trim();
}

// Given a single email and a list of org documents, return the ids of the orgs
// that have a non-empty `orgAutoAddUsersWithDomainName` exactly matching the
// email's domain (case-insensitive, exact — a subdomain does NOT match). An
// empty/unset org domain matches nothing; an email without a domain matches
// nothing. Ids are de-duplicated so the same org is never returned twice.
function orgsToAutoAddForEmail(email, orgs) {
  const domain = emailDomain(email);
  if (!domain) return [];
  if (!Array.isArray(orgs)) return [];

  const ids = [];
  const seen = new Set();
  orgs.forEach(org => {
    if (!org) return;
    const orgDomain = normalizeOrgDomain(org.orgAutoAddUsersWithDomainName);
    if (!orgDomain) return;
    if (orgDomain !== domain) return;
    const id = org._id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });
  return ids;
}

module.exports = {
  emailDomain,
  normalizeOrgDomain,
  orgsToAutoAddForEmail,
};

'use strict';

// Match the email supplied by the configured identity provider, never a local
// profile field. No DNS lookup is necessary, including for intranet domains.
function isEmailDomainAllowed(email, configuration) {
  if (configuration === undefined || configuration === null || configuration === '') return true;
  if (typeof configuration !== 'string') return false;
  const domains = configuration.split(',').map(value => value.trim().toLowerCase());
  const validDomain = value => /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(value)
    && value.split('.').every(label => label && !label.startsWith('-') && !label.endsWith('-'));
  // A malformed configured restriction must never silently disable the policy.
  if (!domains.length || domains.some(domain => !validDomain(domain))) return false;
  if (typeof email !== 'string' || /\s/.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0] || !validDomain(parts[1].toLowerCase())) return false;
  return domains.includes(parts[1].toLowerCase());
}

module.exports = { isEmailDomainAllowed };

'use strict';

// Split an LDAP DN without treating an escaped separator as a new RDN.
function splitUnescaped(value, separator) {
  const parts = [''];
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c === '\\' && i + 1 < value.length) {
      parts[parts.length - 1] += c + value[++i];
    } else if (c === separator) parts.push('');
    else parts[parts.length - 1] += c;
  }
  return parts;
}

function commonNames(dn) {
  if (typeof dn !== 'string') return [];
  return splitUnescaped(splitUnescaped(dn, ',')[0], '+').flatMap(attribute => {
    const equal = attribute.indexOf('=');
    if (equal < 0 || attribute.slice(0, equal).trim().toLowerCase() !== 'cn') return [];
    const raw = attribute.slice(equal + 1).trim();
    const value = raw.replace(/(?:\\[0-9a-fA-F]{2})+|\\(.)/g, (escape, literal) =>
      literal === undefined
        ? Buffer.from(escape.replaceAll('\\', ''), 'hex').toString('utf8')
        : literal);
    return [value];
  });
}

function isCasGroupAllowed(allowed, memberships) {
  if (allowed === undefined || allowed === null || allowed === false) return true;
  // A configured empty or malformed allowlist grants nobody access.
  if (!Array.isArray(allowed) || !allowed.length ||
      allowed.some(name => typeof name !== 'string' || !name.trim())) return false;
  const names = new Set(allowed.map(name => name.trim().toLowerCase()));
  return (Array.isArray(memberships) ? memberships : []).some(dn =>
    commonNames(dn).some(name => names.has(name.toLowerCase())));
}

module.exports = { isCasGroupAllowed };

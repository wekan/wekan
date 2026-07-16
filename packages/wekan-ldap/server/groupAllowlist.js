'use strict';

// Parse a comma-separated LDAP group allowlist into trimmed non-empty patterns.
// Empty/unset means "no restriction".
function parseGroupAllowlist(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function normalizeGroupName(value) {
  if (typeof value === 'string') {
    const v = value.trim();
    return v === '' ? null : v;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizeGroupName(entry);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  if (value === undefined || value === null) {
    return null;
  }

  const v = String(value).trim();
  return v === '' ? null : v;
}

function escapeRegExpChar(ch) {
  return /[\\^$.*+?()[\]{}|]/.test(ch) ? `\\${ch}` : ch;
}

// Convert a simple glob pattern to RegExp.
// Supported wildcards:
//   *  -> any number of characters
//   ?  -> exactly one character
function globToRegExp(pattern) {
  let source = '^';
  for (const ch of String(pattern)) {
    if (ch === '*') {
      source += '.*';
    } else if (ch === '?') {
      source += '.';
    } else {
      source += escapeRegExpChar(ch);
    }
  }
  source += '$';
  return new RegExp(source);
}

function groupNameMatchesAllowPattern(groupName, pattern) {
  const normalizedGroupName = normalizeGroupName(groupName);
  if (!normalizedGroupName || typeof pattern !== 'string' || pattern === '') {
    return false;
  }

  if (!pattern.includes('*') && !pattern.includes('?')) {
    return normalizedGroupName === pattern;
  }

  return globToRegExp(pattern).test(normalizedGroupName);
}

function filterGroupsByAllowlist(userGroups, allowPatterns) {
  const groups = Array.isArray(userGroups)
    ? userGroups
      .map((groupName) => normalizeGroupName(groupName))
      .filter(Boolean)
    : [];
  if (!Array.isArray(allowPatterns) || allowPatterns.length === 0) {
    return groups;
  }

  return groups.filter((groupName) =>
    allowPatterns.some((pattern) => groupNameMatchesAllowPattern(groupName, pattern)),
  );
}

module.exports = {
  parseGroupAllowlist,
  normalizeGroupName,
  groupNameMatchesAllowPattern,
  filterGroupsByAllowlist,
};

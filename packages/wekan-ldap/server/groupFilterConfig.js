const GROUP_LOOKUP_SETTINGS = [
  ['group_filter_group_id_attribute', 'LDAP_GROUP_FILTER_GROUP_ID_ATTRIBUTE'],
  ['group_filter_group_member_attribute', 'LDAP_GROUP_FILTER_GROUP_MEMBER_ATTRIBUTE'],
  ['group_filter_group_member_format', 'LDAP_GROUP_FILTER_GROUP_MEMBER_FORMAT'],
];

function hasValue(value) {
  return typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null;
}

function missingGroupLookupSettings(options) {
  return GROUP_LOOKUP_SETTINGS
    .filter(([key]) => !hasValue(options[key]))
    .map(([, setting]) => setting);
}

function splitGroupNames(value) {
  const seen = new Set();
  return String(value || '')
    .split(',')
    .map(name => name.trim())
    .filter(name => {
      if (!name) return false;
      const normalized = name.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function loginGroupNames(options, adminSyncEnabled, adminGroupNames) {
  const names = splitGroupNames(options.group_filter_group_name);
  if (!adminSyncEnabled) return names;
  return splitGroupNames([names.join(','), adminGroupNames].filter(Boolean).join(','));
}

// #6744: Active Directory's LDAP_MATCHING_RULE_IN_CHAIN. `member=<dn>` matches
// only DIRECT members, so a user who gets access through a team group nested in
// the access group was refused. With this rule the directory follows the
// group-in-group chain to any depth and answers with every group the user is
// in, directly or not.
const AD_IN_CHAIN_RULE = '1.2.840.113556.1.4.1941';

// The one clause that names the user in a group search. `escapedValue` must
// already be escaped for an LDAP filter. LDAP_GROUP_FILTER_NESTED=true asks for
// nested membership; an attribute already written as an extensible match
// (`member:1.2.840.113556.1.4.1941:`, the workaround from #6744) is used as
// written, so turning the setting on beside it does not produce `member:...::`.
function groupMemberClause(options, escapedValue) {
  const attribute = String(options.group_filter_group_member_attribute || '').trim();
  if (options.group_filter_nested === true && !attribute.includes(':')) {
    return `(${attribute}:${AD_IN_CHAIN_RULE}:=${escapedValue})`;
  }
  return `(${attribute}=${escapedValue})`;
}

function missingLoginGroupFilterSettings(options, adminGroupNames = '') {
  const missing = missingGroupLookupSettings(options);
  if (splitGroupNames(
    [options.group_filter_group_name, adminGroupNames].filter(Boolean).join(','),
  ).length === 0) {
    missing.push('LDAP_GROUP_FILTER_GROUP_NAME');
  }
  return missing;
}

module.exports = {
  missingGroupLookupSettings,
  missingLoginGroupFilterSettings,
  splitGroupNames,
  loginGroupNames,
  groupMemberClause,
  AD_IN_CHAIN_RULE,
};

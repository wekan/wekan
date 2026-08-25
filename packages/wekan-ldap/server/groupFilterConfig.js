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
};

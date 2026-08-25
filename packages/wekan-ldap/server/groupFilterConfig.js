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

function missingLoginGroupFilterSettings(options, adminGroupNames = '') {
  const missing = missingGroupLookupSettings(options);
  if (!hasValue(options.group_filter_group_name) && !hasValue(adminGroupNames)) {
    missing.push('LDAP_GROUP_FILTER_GROUP_NAME');
  }
  return missing;
}

module.exports = {
  missingGroupLookupSettings,
  missingLoginGroupFilterSettings,
};

function ldapTextValue(value) {
  if (value === undefined || value === null) return '';
  if (Buffer.isBuffer(value)) return value.toString('utf8').trim();
  if (value.type === 'Buffer' && Array.isArray(value.data)) {
    return Buffer.from(value.data).toString('utf8').trim();
  }
  return String(value).trim();
}

function ldapTextValues(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.map(ldapTextValue).filter(Boolean);
}

function ldapEmailAddresses(value) {
  const seen = new Set();
  return ldapTextValues(value).filter(address => {
    const normalizedAddress = address.toLowerCase();
    if (seen.has(normalizedAddress)) return false;
    seen.add(normalizedAddress);
    return true;
  });
}

module.exports = { ldapTextValue, ldapTextValues, ldapEmailAddresses };

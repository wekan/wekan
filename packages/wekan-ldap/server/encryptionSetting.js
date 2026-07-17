'use strict';

// #4158 "Documentation/configuration of LDAP_ENCRYPTION". Historically the
// code only understood two magic strings, and both were misleadingly named:
//
//   - 'ssl' meant LDAPS (connect to e.g. port 636, TLS from the first byte),
//     which was only discoverable by reading the source;
//   - 'tls' meant STARTTLS (connect plaintext, then upgrade), even though the
//     wiki claimed 'tls' was "more secure than standard LDAPS" (untrue);
//   - the documented value 'true' NEVER worked: settings_get() JSON-parses
//     the env string 'true' into boolean true, which matched neither 'ssl'
//     nor 'tls', so WeKan silently connected WITHOUT encryption;
//   - any other value (typos, 'TRUE', 'StartTLS', ...) also silently meant
//     "no encryption".
//
// normalizeLdapEncryption() maps every raw LDAP_ENCRYPTION value onto one of
// three explicit connection modes and, where appropriate, a warning for the
// admin. It never throws and never silently guesses:
//
//   raw value (case-insensitive)   -> mode        warning
//   -----------------------------------------------------------------------
//   'true' / boolean true          -> 'tls'       -            (LDAPS)
//   'ssl'          (legacy)        -> 'tls'       deprecation: use 'true'
//   'starttls'                     -> 'starttls'  -
//   'tls'          (legacy)        -> 'starttls'  deprecation: use 'starttls'
//   'false' / boolean false / '' /
//   undefined / null               -> 'off'       -
//   anything else                  -> 'off'       clear warning listing the
//                                                 accepted values
//
// Backwards compatibility: the legacy values keep their historical meaning
// ('ssl' -> LDAPS, 'tls' -> STARTTLS); they only gain a one-line deprecation
// notice. Unknown values still result in an unencrypted connection (as
// before), but now log loudly instead of failing silent.
//
// The function is dependency-free (no Meteor, no Log) so it can be unit
// tested with plain Node; the caller (ldap.js) decides how to emit warnings.
//
// CommonJS module.exports so it can be `import`ed by the ecmascript package
// and `require`d directly by the plain-Node unit test.

const ACCEPTED_VALUES_HELP =
  "accepted values are 'true' (LDAPS), 'starttls' (STARTTLS) and 'false' (no encryption); " +
  "the legacy values 'ssl' (same as 'true') and 'tls' (same as 'starttls') also still work";

function normalizeLdapEncryption(value) {
  // settings_get() JSON-parses 'true'/'false' env strings into booleans, so
  // accept booleans as well as strings.
  if (value === true) {
    return { mode: 'tls' };
  }
  if (value === undefined || value === null || value === false) {
    return { mode: 'off' };
  }

  const normalized = String(value).trim().toLowerCase();

  switch (normalized) {
    case '':
    case 'false':
      return { mode: 'off' };
    case 'true':
      return { mode: 'tls' };
    case 'ssl':
      return {
        mode: 'tls',
        warning:
          "LDAP_ENCRYPTION='ssl' is deprecated, please use LDAP_ENCRYPTION='true' instead (both mean LDAPS; 'ssl' keeps working for now)",
      };
    case 'starttls':
      return { mode: 'starttls' };
    case 'tls':
      return {
        mode: 'starttls',
        warning:
          "LDAP_ENCRYPTION='tls' is deprecated, please use LDAP_ENCRYPTION='starttls' instead (both mean STARTTLS; 'tls' keeps working for now)",
      };
    default:
      return {
        mode: 'off',
        warning:
          `LDAP_ENCRYPTION='${value}' is not a valid value, connecting WITHOUT encryption; ${ACCEPTED_VALUES_HELP}`,
      };
  }
}

module.exports = { normalizeLdapEncryption, ACCEPTED_VALUES_HELP };

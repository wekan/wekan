// Shared field catalog for runtime resolution, Admin Panel controls and platform checks.
const { resolveConfigValue } = require('./configResolver');
const SAML_FIELDS = [
  ['enabled', 'SAML_ENABLED', 'boolean', false],
  ['provider', 'SAML_PROVIDER', 'text', 'default'],
  ['entryPoint', 'SAML_ENTRYPOINT', 'url', ''],
  ['issuer', 'SAML_ISSUER', 'text', ''],
  ['cert', 'SAML_CERT', 'textarea', ''],
  ['idpSLORedirectURL', 'SAML_IDPSLO_REDIRECTURL', 'url', ''],
  ['privateKeyFile', 'SAML_PRIVATE_KEYFILE', 'text', ''],
  ['publicCertFile', 'SAML_PUBLIC_CERTFILE', 'text', ''],
  ['identifierFormat', 'SAML_IDENTIFIER_FORMAT', 'text', 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'],
  ['localProfileMatchAttribute', 'SAML_LOCAL_PROFILE_MATCH_ATTRIBUTE', 'text', ''],
  ['attributesSAML', 'SAML_ATTRIBUTES', 'text', 'sn,givenName,mail'],
  ['mergeExistingUsers', 'SAML_MERGE_EXISTING_USERS', 'boolean', false],
  // Identity providers differ in WHAT they sign and in how the login page is
  // opened. A profile sets all of that at once; each field below it can still
  // be set on its own, and a field left at Default follows the profile.
  ['idpProfile', 'SAML_IDP_PROFILE', 'choice', 'standard', ['standard', 'signed-assertion-redirect']],
  ['wantResponseSigned', 'SAML_WANT_RESPONSE_SIGNED', 'boolean', null],
  ['wantAssertionsSigned', 'SAML_WANT_ASSERTIONS_SIGNED', 'boolean', null],
  ['loginFlow', 'SAML_LOGIN_FLOW', 'choice', null, ['popup', 'redirect']],
].map(([key, envVar, type, defaultValue, choices]) => ({ key, envVar, type, defaultValue, choices }));

// What each identity-provider profile means.
//   standard                  the Response is signed (node-saml's default and
//                             WeKan's behaviour so far).
//   signed-assertion-redirect the identity provider signs the Assertion and
//                             not the Response - SAML 2.0 allows either - so
//                             the Assertion signature is required instead.
// Both log in by full-page redirect: the browser leaves WeKan for the identity
// provider and comes back in the same window. It used to be a popup for
// `standard`; a popup is blocked in iframes and on some phones, and an
// identity provider's Cross-Origin-Opener-Policy can cut it off from WeKan so
// the login never finishes. SAML_LOGIN_FLOW=popup still chooses the popup.
const SAML_PROFILES = {
  standard: { wantResponseSigned: true, wantAssertionsSigned: false, loginFlow: 'redirect' },
  'signed-assertion-redirect': { wantResponseSigned: false, wantAssertionsSigned: true, loginFlow: 'redirect' },
};
const PROFILE_KEYS = ['wantResponseSigned', 'wantAssertionsSigned', 'loginFlow'];

function cleanSamlOverrides(input) {
  const clean = {};
  for (const [key, value] of Object.entries(input)) {
    const field = SAML_FIELDS.find(item => item.key === key);
    if (!field) throw new TypeError(`Unknown SAML setting: ${key}`);
    if (value === '' || value === null) continue; // restore environment/default
    if (field.type === 'boolean') {
      if (typeof value !== 'boolean') throw new TypeError(`Invalid ${field.envVar}`);
      clean[key] = value;
    } else if (field.type === 'choice') {
      if (!field.choices.includes(value)) throw new TypeError(`Invalid ${field.envVar}`);
      clean[key] = value;
    } else {
      if (typeof value !== 'string' || value.length > (key === 'cert' ? 65536 : 4096)) {
        throw new TypeError(`Invalid ${field.envVar}`);
      }
      if (value.trim()) clean[key] = value.trim();
    }
  }
  return clean;
}

function resolveSamlConfig(overrides = {}, env = process.env) {
  const config = {}, sources = {};
  for (const field of SAML_FIELDS) {
    const resolved = resolveConfigValue(field.envVar, overrides[field.key], { readEnv: key => env[key] });
    const value = resolved.value === undefined ? field.defaultValue : resolved.value;
    config[field.key] = field.type === 'boolean' && value !== null ? value === true || value === 'true' : value;
    sources[field.key] = { source: resolved.source, value: config[field.key] };
  }
  // Fields left at Default follow the chosen profile. An unknown profile name
  // (a mistyped environment variable) is kept so validation can refuse it.
  const profile = SAML_PROFILES[config.idpProfile];
  for (const key of PROFILE_KEYS) {
    if (config[key] === null || config[key] === undefined) {
      config[key] = profile ? profile[key] : SAML_PROFILES.standard[key];
      sources[key] = { source: 'profile', value: config[key] };
    }
  }
  return { config, sources };
}

function validateSamlConfig(config) {
  if (!/^[a-zA-Z0-9_-]+$/.test(config.provider)) throw new TypeError('Invalid SAML_PROVIDER');
  for (const key of ['entryPoint', 'idpSLORedirectURL']) {
    if (!config[key]) continue;
    const url = new URL(config[key]);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new TypeError(`Invalid SAML ${key} URL`);
    }
  }
  for (const key of ['privateKeyFile', 'publicCertFile']) {
    if (config[key] && (config[key].startsWith('/') || config[key].includes('\\') || config[key].split('/').includes('..'))) {
      throw new TypeError(`SAML ${key} must be a path inside private/`);
    }
  }
  for (const field of SAML_FIELDS) {
    if (field.type === 'choice' && !field.choices.includes(config[field.key])) {
      throw new TypeError(`Invalid ${field.envVar}`);
    }
  }
  // At least one signature must be required and verified. With neither, any
  // unsigned assertion naming any user would log in as that user.
  if (config.wantResponseSigned !== true && config.wantAssertionsSigned !== true) {
    throw new TypeError('SAML needs SAML_WANT_RESPONSE_SIGNED or SAML_WANT_ASSERTIONS_SIGNED');
  }
  if (config.enabled && (!config.entryPoint || !config.issuer || !config.cert)) {
    throw new TypeError('SAML_ENTRYPOINT, SAML_ISSUER and SAML_CERT are required');
  }
  return config;
}
module.exports = { SAML_FIELDS, SAML_PROFILES, cleanSamlOverrides, resolveSamlConfig, validateSamlConfig };

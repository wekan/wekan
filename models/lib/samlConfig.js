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
].map(([key, envVar, type, defaultValue]) => ({ key, envVar, type, defaultValue }));

function cleanSamlOverrides(input) {
  const clean = {};
  for (const [key, value] of Object.entries(input)) {
    const field = SAML_FIELDS.find(item => item.key === key);
    if (!field) throw new TypeError(`Unknown SAML setting: ${key}`);
    if (value === '' || value === null) continue; // restore environment/default
    if (field.type === 'boolean') {
      if (typeof value !== 'boolean') throw new TypeError(`Invalid ${field.envVar}`);
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
    config[field.key] = field.type === 'boolean' ? value === true || value === 'true' : value;
    sources[field.key] = { source: resolved.source, value: config[field.key] };
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
  if (config.enabled && (!config.entryPoint || !config.issuer || !config.cert)) {
    throw new TypeError('SAML_ENTRYPOINT, SAML_ISSUER and SAML_CERT are required');
  }
  return config;
}
module.exports = { SAML_FIELDS, cleanSamlOverrides, resolveSamlConfig, validateSamlConfig };

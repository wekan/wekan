'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { SAML_FIELDS, cleanSamlOverrides, resolveSamlConfig, validateSamlConfig } = require('../models/lib/samlConfig');
const env = { SAML_ENABLED: 'true', SAML_PROVIDER: 'idp', SAML_ENTRYPOINT: 'https://idp.invalid/sso', SAML_ISSUER: 'urn:wekan', SAML_CERT: 'certificate' };
assert.equal(resolveSamlConfig({}, env).config.enabled, true);
assert.equal(resolveSamlConfig({ enabled: false }, env).config.enabled, false);
assert.equal(resolveSamlConfig({}, {}).config.enabled, false);
assert.equal(resolveSamlConfig({ issuer: 'override' }, env).sources.issuer.source, 'admin');
assert.equal(resolveSamlConfig({ issuer: '' }, env).config.issuer, env.SAML_ISSUER);
assert.deepEqual(cleanSamlOverrides({ issuer: '', enabled: false }), { enabled: false });
for (const bad of [{ enabled: 'true' }, { cert: {} }, { unknown: true }]) assert.throws(() => cleanSamlOverrides(bad));
assert.doesNotThrow(() => validateSamlConfig(resolveSamlConfig({}, env).config));
for (const bad of [{ provider: '../idp' }, { entryPoint: 'javascript:alert(1)' }, { privateKeyFile: '../secret' }, { idpSLORedirectURL: 'https://user:password@host/logout' }]) {
  assert.throws(() => validateSamlConfig(resolveSamlConfig(bad, env).config));
}
assert.throws(() => validateSamlConfig(resolveSamlConfig({ enabled: true }, {}).config));
const platforms = ['Dockerfile', '.devcontainer/Dockerfile', 'start-wekan.sh', 'start-wekan.bat', 'releases/virtualbox/start-wekan.sh', 'sandstorm-pkgdef.capnp', 'snap-src/bin/config', ...fs.readdirSync('.').filter(name => /^docker-compose.*\.yml$/.test(name))];
for (const file of platforms) {
  const source = fs.readFileSync(file, 'utf8');
  for (const field of SAML_FIELDS) assert.ok(source.includes(field.envVar), `${file}: ${field.envVar}`);
}
assert.doesNotMatch(fs.readFileSync('server/publications/settings.js', 'utf8'), /^\s+saml:\s*1/m);
console.log('samlConfig: precedence, reset, validation and all-platform environment coverage pass');

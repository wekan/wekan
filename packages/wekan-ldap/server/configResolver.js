// Vendored copy of models/lib/configResolver.js's pure resolution helpers.
// A Meteor local package is its own isolated build unit and cannot import
// app-tree modules (an ES import of an app-tree absolute path inside
// packages/ resolves at runtime, not build time, and fails with "Cannot find module"
// the moment the app actually boots - node test suites never catch this,
// because they run these files directly with plain Node, outside Meteor's
// package linker). Both copies must be kept in sync; models/lib/configResolver.js
// stays the canonical one, tested by tests/configResolver.test.cjs.

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

function resolveConfigValue(envVarName, adminValue, options = {}) {
  const readEnv = options.readEnv || (name => process.env[name]);

  if (!isEmpty(adminValue)) {
    return { value: adminValue, source: 'admin' };
  }

  const envValue = readEnv(envVarName);
  if (!isEmpty(envValue)) {
    return { value: envValue, source: 'env' };
  }

  return { value: undefined, source: 'default' };
}

function hasConfigValue(envVarName, adminValue, options = {}) {
  const readEnv = options.readEnv || (name => process.env[name]);

  if (!isEmpty(adminValue)) {
    return { hasValue: true, source: 'admin' };
  }
  const envValue = readEnv(envVarName);
  if (!isEmpty(envValue)) {
    return { hasValue: true, source: 'env' };
  }
  return { hasValue: false, source: 'default' };
}

export { resolveConfigValue, hasConfigValue };

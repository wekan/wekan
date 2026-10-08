'use strict';

// Server secrets from files (#5724, maintainer decision of 2026-10-08), for the
// two that are not login settings and that WeKan reads from the environment
// once at start:
//   - MAIL_URL_FILE      -> MAIL_URL      (the SMTP URL, password included)
//   - S3_SECRET_KEY_FILE -> S3_SECRET_KEY (the S3 / MinIO secret access key)
// The variable wins over its file when both are set, as it does for the login
// secrets (models/lib/authConfigCatalog.js). One trailing line break in the
// file is ignored; every other character is part of the secret.
//
// MONGO_URL_FILE is NOT here: Meteor connects with MONGO_URL before any
// application code runs, so the launchers (start-wekan.sh / .bat, the snap's
// wekan-control and the Docker entrypoint) read it instead.
//
// The names that used to be offered - MAIL_SERVICE_PASSWORD_FILE,
// MONGO_PASSWORD_FILE and S3_SECRET_FILE - were read by nothing, and
// MAIL_SERVICE_PASSWORD and S3_SECRET themselves are read by nothing either, so
// they are gone from the platforms; RETIRED lists them so the server can say so
// when somebody still sets one.
//
// Pure apart from the injected readFile: plain-Node tests run it.

const SECRET_FILES = [
  ['MAIL_URL', 'MAIL_URL_FILE'],
  ['S3_SECRET_KEY', 'S3_SECRET_KEY_FILE'],
];

const RETIRED = {
  MAIL_SERVICE_PASSWORD_FILE: 'MAIL_URL_FILE',
  MONGO_PASSWORD_FILE: 'MONGO_URL_FILE',
  S3_SECRET_FILE: 'S3_SECRET_KEY_FILE',
};

function isUnset(value) {
  return value === undefined || value === null || value === '';
}

function defaultReadFile(file) {
  // eslint-disable-next-line global-require
  return require('fs').readFileSync(file, 'utf8');
}

// Fill each variable from its file when the variable is unset. Returns, per
// variable, where its value came from: 'env', 'file', 'unset', or
// 'file-error:<code>' - never the value or the file's content.
function applySecretFiles(env, readFile = defaultReadFile) {
  const report = {};
  for (const [name, fileVar] of SECRET_FILES) {
    if (!isUnset(env[name])) { report[name] = 'env'; continue; }
    const file = env[fileVar];
    if (isUnset(file)) { report[name] = 'unset'; continue; }
    try {
      const value = String(readFile(String(file))).replace(/(\r?\n)+$/, '');
      if (value === '') { report[name] = 'file-error:empty'; continue; }
      env[name] = value;
      report[name] = 'file';
    } catch (e) {
      report[name] = `file-error:${e && e.code ? e.code : 'unreadable'}`;
    }
  }
  return report;
}

// The retired names still set in this environment, each with its replacement.
function retiredSecretFiles(env) {
  return Object.entries(RETIRED)
    .filter(([name]) => !isUnset(env[name]))
    .map(([name, replacement]) => ({ name, replacement }));
}

module.exports = { SECRET_FILES, RETIRED, applySecretFiles, retiredSecretFiles };

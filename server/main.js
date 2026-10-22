// ============================================================================
// WeKan Server Entry Point
//
// Uses require() to guarantee bootstrap runs before any model code.
// ============================================================================

// 0. Secrets from files (#5724): MAIL_URL_FILE and S3_SECRET_KEY_FILE fill
//    MAIL_URL and S3_SECRET_KEY before any code reads them. Never the values
//    in the log - only where each came from.
{
  const { applySecretFiles, retiredSecretFiles } = require('/models/lib/envSecretFiles');
  const report = applySecretFiles(process.env);
  for (const [name, source] of Object.entries(report)) {
    if (source === 'file') console.log(`[secrets] ${name} read from ${name}_FILE`);
    else if (source.startsWith('file-error:')) console.error(`[secrets] ${name}_FILE cannot be used (${source.slice(11)}); ${name} is unset`);
  }
  for (const { name, replacement } of retiredSecretFiles(process.env)) {
    console.warn(`[secrets] ${name} is not read by WeKan; use ${replacement} instead`);
  }
}

// 0b. #6762: TLS trusts the operating system's certificate authorities as well
//     as Node.js's own, so a company root CA installed on the server verifies
//     LDAPS, mail, webhooks and OAuth2 the way it does for every other program.
//     Before anything opens a connection.
{
  const { trustSystemCaCertificates } = require('/server/lib/systemCaCertificates');
  try {
    const result = trustSystemCaCertificates();
    if (result.applied) {
      console.log(`[tls] trusting ${result.added} certificate authorities of the operating system as well as Node.js's own`);
    }
  } catch (e) {
    console.warn(`[tls] the operating system's certificate authorities could not be read (${e.message}); only Node.js's own are trusted`);
  }
}

// 0c. The Meteor 3.5.3 security fixes in packages/ (allow-deny, ddp-server,
//     dynamic-import, google-oauth, facebook-oauth) report refused attempts to
//     Admin Panel / Problems through this hook. Before the first connection.
require('/server/lib/meteorSecurityHook').installMeteorSecurityHook();

// 1. Helpers polyfill (server no-op for .helpers())
require('/imports/collectionHelpers');

// 2. Collection2 (server-only)
require('meteor/aldeed:collection2');

// 3. Load all application code
require('/server/imports');

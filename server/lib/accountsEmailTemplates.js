// Accounts.emailTemplates when accounts-password is not in the build.
//
// accounts-password is what creates Accounts.emailTemplates, and WeKan reads it
// far beyond password mail: every notification, invitation and rule e-mail
// takes its From address and site name from it (server/models/settings.js,
// server/lib/emailLocalization.js, server/notifications/emailQueue.js, ...),
// and config/accounts.js fills in its subjects and texts at startup.
//
// The Sandstorm .spk is built WITHOUT accounts-password (releases/sandstorm-slim.mjs,
// docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md), where the
// first grain to start without it crash-looped on
//   TypeError: Cannot read properties of undefined (reading 'resetPassword')
//   at config/accounts.js
// So when the package is absent, the same object is made here, with the
// defaults accounts-password gives it, before any app code reads it. When the
// package is present, nothing is touched.
function ensureEmailTemplates(Accounts, absoluteUrl) {
  if (!Accounts || Accounts.emailTemplates) return false;
  let siteName = '';
  try {
    siteName = new URL(absoluteUrl).hostname.replace(/^www\./, '');
  } catch (e) {
    siteName = '';
  }
  Accounts.emailTemplates = {
    from: 'Accounts Example <no-reply@example.com>',
    siteName,
    headers: {},
    resetPassword: {},
    verifyEmail: {},
    enrollAccount: {},
  };
  return true;
}

module.exports = { ensureEmailTemplates };

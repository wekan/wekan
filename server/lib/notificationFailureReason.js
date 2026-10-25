'use strict';

// What a notification log line may say about why it failed.
//
// The activity notification pipeline throws plain codes - "activity-
// notification-intent-invalid", "sync-busy" - and its log lines dropped them:
// "Activity notification delivery incomplete; pending intent retained", a
// thousand times in one test run, said that something failed and never which
// check. A code is safe to log, it is how the failure is found, and it is what
// this returns. Anything else - a database error, a TypeError - may carry
// document content or an address in its message, so only its name and code are
// given, never the message.
const CODE = /^[a-z0-9]+(?:-[a-z0-9]+)+$/; // at least one hyphen: a code, not a word

function notificationFailureReason(error) {
  if (!error) return 'unknown';
  const message = typeof error.message === 'string' ? error.message : '';
  if (message.length <= 100 && CODE.test(message)) return message;
  const name = typeof error.name === 'string' && /^[A-Za-z]{1,60}$/.test(error.name) ? error.name : 'Error';
  const code = error.code;
  if (typeof code === 'number' && Number.isFinite(code)) return `${name} ${code}`;
  if (typeof code === 'string' && code.length <= 60 && /^[A-Za-z0-9_.-]+$/.test(code)) return `${name} ${code}`;
  return name;
}

module.exports = { notificationFailureReason };

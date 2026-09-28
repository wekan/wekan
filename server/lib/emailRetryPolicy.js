// SMTP reply classes: RFC 5321 section 4.2.1. Use Nodemailer's structured
// error fields, never server response text (which can contain addresses or
// credentials). Storage/read errors must not be mistaken for SMTP rejection.
const MAX_EMAIL_ATTEMPTS = 12;
const EMAIL_FAILURE_REASONS = [
  'smtp-temporary', 'smtp-rejected', 'smtp-authentication', 'smtp-configuration',
  'recipient-unavailable', 'delivery-unconfirmed', 'acknowledgement-failed',
  'delivery-failed', 'retry-limit',
];
function emailFailure(error, phase = 'smtp') {
  if (phase === 'acknowledgement') return { reason: 'acknowledgement-failed', terminal: false };
  if (error?.code === 'email-recipient-unavailable') return { reason: 'recipient-unavailable', terminal: false };
  if (phase !== 'smtp') return { reason: 'delivery-failed', terminal: false };
  if (error?.code === 'email-not-accepted') return { reason: 'delivery-unconfirmed', terminal: true };
  const response = error?.responseCode;
  if (Number.isInteger(response) && response >= 400 && response < 500) return { reason: 'smtp-temporary', terminal: false };
  if (Number.isInteger(response) && response >= 500 && response < 600) {
    return { reason: error?.code === 'EAUTH' ? 'smtp-authentication' : 'smtp-rejected', terminal: true };
  }
  if (error?.code === 'EAUTH') return { reason: 'smtp-authentication', terminal: true };
  if (['EENVELOPE', 'EMESSAGE', 'ETLS'].includes(error?.code)) return { reason: 'smtp-configuration', terminal: true };
  return { reason: 'delivery-failed', terminal: false };
}
function emailRetryDecision(error, phase, cycleAttempts, now, random = Math.random) {
  const failure = emailFailure(error, phase);
  if (failure.terminal) return { state: 'failed', lastFailure: failure.reason, failedAt: now };
  if (cycleAttempts >= MAX_EMAIL_ATTEMPTS) return { state: 'failed', lastFailure: 'retry-limit', failedAt: now };
  // Positive jitter never retries before the base delay. Cap the base at 48
  // minutes so the 0–25% spread still disperses retries at the one-hour ceiling.
  const sample = random();
  const jitter = Number.isFinite(sample) ? Math.max(0, Math.min(1, sample)) : 0;
  const base = Math.min(2880000, 5000 * 2 ** Math.min(Math.max(0, cycleAttempts - 1), 10));
  return { state: 'pending', lastFailure: failure.reason,
    nextAttemptAt: new Date(now.getTime() + Math.round(base * (1 + 0.25 * jitter))) };
}
module.exports = { emailFailure, emailRetryDecision, MAX_EMAIL_ATTEMPTS, EMAIL_FAILURE_REASONS };

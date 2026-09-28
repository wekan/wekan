'use strict';
// Use the same MailComposer as Meteor Email, not an independent address parser.
// Compilation only resolves the transport envelope; it performs no send.
function ruleEmailRecipients(mail, MailComposer) {
  if (typeof MailComposer !== 'function') throw new Error('sync-rule-email-composer-required');
  const envelope = new MailComposer(mail).compile().getEnvelope();
  if (!Array.isArray(envelope?.to) || !envelope.to.length || envelope.to.length > 1000 ||
      envelope.to.some(address => typeof address !== 'string' || !address.trim() || /[\r\n\0]/.test(address))) {
    throw new Error('sync-rule-email-recipients-invalid');
  }
  // SMTP domains are case-insensitive; local parts can be case-sensitive.
  // Preserve the composer's local-part spelling rather than merging mailboxes.
  return [...new Set(envelope.to)].sort();
}
function confirmRuleEmailAcceptance(recipients, result) {
  if (!Array.isArray(recipients) || !recipients.length ||
      recipients.some(address => typeof address !== 'string' || !address) ||
      new Set(recipients).size !== recipients.length) throw new Error('sync-rule-email-recipients-invalid');
  const accepted = result?.accepted;
  if (!Array.isArray(accepted) || !accepted.length ||
      (result.rejected !== undefined && (!Array.isArray(result.rejected) || result.rejected.length))) {
    throw new Error('sync-rule-email-delivery-unconfirmed');
  }
  const addresses = accepted.map(value => typeof value === 'string' ? value : value?.address);
  if (addresses.some(address => typeof address !== 'string' || !address) ||
      recipients.some(address => !addresses.includes(address)) ||
      addresses.some(address => !recipients.includes(address))) {
    throw new Error('sync-rule-email-delivery-unconfirmed');
  }
  return true;
}
module.exports = { ruleEmailRecipients, confirmRuleEmailAcceptance };

// Board View / Shop: the buyer's order confirmation e-mail
// (docs/Features/Board-Header/Board-Views/Shop.md).
//
// Sent once the order is placed, through Meteor's Email - so every hook WeKan
// has on sending applies: an address stopped by Admin Panel / E-mail /
// Bounces is taken out (server/emailBounces.js), the SMTP limits and
// deadlines of server/lib/mailTransport.js hold. Not sent when this WeKan
// sends no e-mail (no MAIL_URL, from the environment or Admin Panel /
// E-mail), when Board Settings / Shop turns it off, or to a stopped address.
//
// It is the buyer's receipt, not the order: a failure is recorded in Admin
// Panel / Problems (server/lib/mailProblems.js) and never fails the order.
// The text is plain (models/lib/shop.js orderEmail); the HTML part is the
// account e-mail layout of that same text, which escapes every character of
// it (models/lib/accountEmailHtml.js).
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from '/imports/i18n';

const { orderEmail } = require('/models/lib/shop');
const { renderAccountEmailHtml } = require('/models/lib/accountEmailHtml');

let testSender = null;

// Tests only: capture or fail the send instead of reaching a mail server.
export function setOrderEmailSenderForTests(fn) {
  testSender = typeof fn === 'function' ? fn : null;
}

async function send(mail) {
  if (testSender) return testSender(mail);
  const { Email } = require('meteor/email');
  return Email.sendAsync(mail);
}

function mailConfigured() {
  return !!testSender || !!process.env.MAIL_URL;
}

function from() {
  try {
    return require('meteor/accounts-base').Accounts.emailTemplates.from;
  } catch (e) {
    return undefined;
  }
}

async function translatorFor(language) {
  let lang = 'en';
  try {
    const key = language && TAPi18n.resolveTag ? TAPi18n.resolveTag(language) : null;
    if (key) lang = key;
    await TAPi18n.ensureLanguageLoaded(lang);
  } catch (e) { /* English, then */ }
  return { language: lang, t: (key, options) => {
    try { return TAPi18n.__(key, options || {}, lang); } catch (e) { return key; }
  } };
}

/**
 * @returns {Promise<'sent'|'skipped'|'failed'>} never throws
 */
export async function sendOrderConfirmation({ settings, shopTitle: title, to, language, order, payment, method, money }) {
  try {
    if (!settings || settings.confirmationEmail === false || !to || !mailConfigured()) return 'skipped';
    try {
      if (require('/server/emailBounces').isAddressStopped(to)) return 'skipped';
    } catch (e) { /* no bounce list: send */ }
    const { t, language: lang } = await translatorFor(language);
    const methodLabel = (method && method.method && method.method.label) || t(`billing-method-${method && method.method && method.method.type}`);
    const shopTitle = settings.title || title || '';
    const { subject, text } = orderEmail({ order, payment, methodLabel, shopTitle, t, money: minor => money(minor, lang) });
    await send({
      to,
      from: from(),
      subject,
      text,
      html: renderAccountEmailHtml({ text, siteName: shopTitle }),
    });
    return 'sent';
  } catch (error) {
    try {
      require('/server/lib/mailProblems').recordMailProblem('send-failed', {
        source: 'shop-order-confirmation',
        detail: `${(error && (error.responseCode || error.code)) || ''} ${(error && (error.response || error.message)) || error}`.trim(),
      });
    } catch (e) { /* logging must never break the order */ }
    if (Meteor.isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn('[shop] order confirmation not sent:', error && error.message);
    }
    return 'failed';
  }
}

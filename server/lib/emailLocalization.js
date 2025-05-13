// emailLocalization.js
// Utility functions to handle email localization in Wekan

import { TAPi18n } from '/imports/i18n';
import { ReactiveCache } from '/imports/reactiveCache';

// Main object for email localization utilities
EmailLocalization = {
  /**
   * Send an email using the recipient's preferred language
   * @param {Object} options - Standard email sending options plus language options
   * @param {String} options.to - Recipient email address
   * @param {String} options.from - Sender email address
   * @param {String} options.subject - Email subject i18n key
   * @param {String} options.text - Email text i18n key
   * @param {Object} options.params - Parameters for i18n translation
   * @param {String} options.language - Language code to use (if not provided, will try to detect)
   * @param {String} options.userId - User ID to determine language (if not provided with language)
   */
  sendEmail(options) {
    // Determine the language to use
    let lang = options.language;

    // If no language is specified but we have a userId, try to get the user's language
    if (!lang && options.userId) {
      const user = ReactiveCache.getUser(options.userId);
      if (user) {
        lang = user.getLanguage();
      }
    }

    // If no language could be determined, use the site default
    if (!lang) {
      lang = TAPi18n.getLanguage() || 'en';
    }

    // Translate subject and text using the determined language
    const subject = TAPi18n.__(options.subject, options.params || {}, lang);
    let text = options.text;

    // If text is an i18n key, translate it
    if (typeof text === 'string' && text.startsWith('email-')) {
      text = TAPi18n.__(text, options.params || {}, lang);
    }

    // Send the email with translated content
    return Email.send({
      to: options.to,
      from: options.from || Accounts.emailTemplates.from,
      subject: subject,
      text: text,
      html: options.html
    });
  }
};

// Add module.exports to make it accessible from other files
module.exports = EmailLocalization;

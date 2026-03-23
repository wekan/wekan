import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
//var nodemailer = require('nodemailer');

import EmailLocalization from '../lib/emailLocalization';
import { Notifications } from '/server/notifications/notifications';

// buffer each user's email text in a queue, then flush them in single email
Meteor.startup(() => {
  Notifications.subscribe('email', (user, title, description, params) => {
    try {
      if (
        !user ||
        typeof user.getLanguage !== 'function' ||
        typeof user.getEmailBuffer !== 'function' ||
        typeof user.addEmailBuffer !== 'function'
      ) {
        console.error('Invalid user helper surface for email notification:', user?._id);
        return;
      }

      // add quote to make titles easier to read in email text
      const quoteParams = { ...params };
      ['card', 'list', 'oldList', 'board', 'comment'].forEach(key => {
        if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
      });
      ['timeValue', 'timeOldValue'].forEach(key => {
        quoteParams[key] = quoteParams[key] ? `${params[key]}` : '';
      });

      const lan = user.getLanguage();
      const subject = TAPi18n.__(title, params, lan);
      const existing = user.getEmailBuffer().length > 0;
      const htmlEnabled =
        Meteor.settings.public &&
        Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR !== false;
      const text = `${existing ? `\n${subject}\n` : ''}${
        params.user
      } ${TAPi18n.__(description, quoteParams, lan)}\n${params.url}`;

      user.addEmailBuffer(htmlEnabled ? text.replace(/\n/g, '<br/>') : text);

      const userId = user._id;
      Meteor.setTimeout(async () => {
        const user = await ReactiveCache.getUser(userId);
        if (
          !user ||
          typeof user.getEmailBuffer !== 'function' ||
          typeof user.clearEmailBuffer !== 'function' ||
          typeof user.getLanguage !== 'function'
        ) {
          return;
        }

        const texts = user.getEmailBuffer();
        if (texts.length === 0) return;

        const html = texts.join('<br/>\n\n');
        user.clearEmailBuffer();
        try {
          await EmailLocalization.sendEmail({
            to: user.emails[0].address.toLowerCase(),
            from: Accounts.emailTemplates.from,
            subject,
            html,
            language: user.getLanguage(),
            userId: user._id
          });
        } catch (e) {
          return;
        }
      }, process.env.EMAIL_NOTIFICATION_TIMEOUT || 30000);
    } catch (error) {
      console.error('Error preparing email notification:', error);
    }
  });
});

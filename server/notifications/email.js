import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
//var nodemailer = require('nodemailer');

import EmailLocalization from '../lib/emailLocalization';
import { Notifications } from '/server/notifications/notifications';
import { formatActivityNotificationTitle } from '/server/lib/activityNotificationTitle';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
const {
  escapeEmailHtml,
  safeEmailSubject,
  buildHtmlNotificationLine,
} = require('/models/lib/emailNotificationSafety');
const { buildReplyToAddress } = require('/server/lib/inboundEmailReplyToken');
const { substituteVars } = require('/models/lib/ruleVarsSubstitute');

// #2414: reply-by-email. A notification's Reply-To address encodes the card
// it is about (HMAC-signed, see inboundEmailReplyToken.js) so a reply caught
// by the inbound-email webhook (server/routes/inboundEmail.js) can be matched
// back to the right card. Both a shared secret and a domain to send the
// reply to must be configured, or WeKan sends no Reply-To at all (the
// feature is opt-in and off by default - most self-hosters have no
// inbound-mail webhook configured).
// Emails are buffered per-user and flushed together (see below); a digest
// covering more than one card can only carry ONE Reply-To, so this tracks the
// MOST RECENTLY notified card per user and a reply lands on that one. This is
// a deliberate, documented limitation of the webhook-based approach - see
// docs/Features/Reply-By-Email.md.
const lastNotifiedCardIdByUser = new Map();

function inboundEmailReplyTo(cardId) {
  const secret = process.env.INBOUND_EMAIL_HMAC_SECRET;
  const domain = process.env.INBOUND_EMAIL_DOMAIN;
  if (!cardId || !secret || !domain) return '';
  try {
    return buildReplyToAddress(cardId, secret, domain);
  } catch (e) {
    return '';
  }
}

// buffer each user's email text in a queue, then flush them in single email
Meteor.startup(() => {
  Notifications.subscribe('email', async (user, title, description, params) => {
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

      // 3-tier Notification Settings: admin default -> board override ->
      // member override (see models/lib/notificationSettings.js).
      const setting = await ReactiveCache.getCurrentSetting();
      const board = params.boardId
        ? await ReactiveCache.getBoard(params.boardId)
        : null;
      const enabled = resolveNotificationSetting('email', {
        adminDefault: setting && setting.notifyDefaultEmail,
        boardOverride: board && board.notifyOverrideEmail,
        memberOverride: user.profile && user.profile.notifyOverrideEmail,
      });
      if (!enabled) return;

      // #5875: the server only loads the English bundle at startup, so make sure
      // the recipient's language is loaded before translating the subject/body —
      // otherwise notification emails silently fall back to English.
      await TAPi18n.ensureLanguageLoaded(user.getLanguage());

      // add quote to make titles easier to read in email text
      const quoteParams = { ...params };
      ['card', 'list', 'oldList', 'board', 'comment'].forEach(key => {
        if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
      });
      ['timeValue', 'timeOldValue'].forEach(key => {
        quoteParams[key] = quoteParams[key] ? `${params[key]}` : '';
      });

      const lan = user.getLanguage();
      let subject = safeEmailSubject(formatActivityNotificationTitle(
        title,
        params,
        TAPi18n.__.bind(TAPi18n),
        lan,
      ));
      const existing = user.getEmailBuffer().length > 0;
      const htmlEnabled =
        Meteor.settings.public &&
        Meteor.settings.public.RICHER_CARD_COMMENT_EDITOR !== false;
      const actorName = params.user || '';
      const descriptionText = TAPi18n.__(description, quoteParams, lan);

      // #2022: an admin-customized activity-notification template (Admin
      // Panel -> Email Templates) overrides the built subject/body line,
      // using the same {token} substitution the #3304 rule "send email"
      // action uses (substituteVars). Unset (the default on every existing
      // install) falls through to the exact content built above, unchanged.
      const templateSetting = await ReactiveCache.getCurrentSetting();
      const templateVars = {
        board: params.board || '',
        card: params.card || '',
        list: params.list || '',
        username: actorName,
        url: params.url || '',
        comment: params.comment || '',
        action: descriptionText,
      };
      if (templateSetting && templateSetting.activityEmailSubjectTemplate) {
        subject = safeEmailSubject(
          substituteVars(templateSetting.activityEmailSubjectTemplate, templateVars),
        );
      }
      const bodyTemplate = templateSetting && templateSetting.activityEmailBodyTemplate;
      const text = bodyTemplate
        ? `${existing ? `\n${subject}\n` : ''}${substituteVars(bodyTemplate, templateVars)}`
        : `${existing ? `\n${subject}\n` : ''}${
            actorName
          } ${descriptionText}\n${params.url}`;

      user.addEmailBuffer(
        bodyTemplate
          ? text
          : htmlEnabled
          ? buildHtmlNotificationLine({
              existing,
              subject,
              actorName,
              descriptionText,
              url: params.url,
            })
          : text,
      );

      if (params.cardId) {
        lastNotifiedCardIdByUser.set(user._id, params.cardId);
      }

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
        const replyToCardId = lastNotifiedCardIdByUser.get(userId);
        lastNotifiedCardIdByUser.delete(userId);
        try {
          await EmailLocalization.sendEmail({
            to: user.emails[0].address.toLowerCase(),
            from: Accounts.emailTemplates.from,
            subject,
            html,
            language: user.getLanguage(),
            userId: user._id,
            replyTo: inboundEmailReplyTo(replyToCardId),
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

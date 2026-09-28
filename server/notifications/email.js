import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

import { emailOutbox } from '/server/notifications/emailQueue';
import { Notifications } from '/server/notifications/notifications';
import { formatActivityNotificationTitle } from '/server/lib/activityNotificationTitle';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
const {
  safeEmailSubject,
  buildHtmlNotificationLine,
} = require('/models/lib/emailNotificationSafety');
const { substituteVars } = require('/models/lib/ruleVarsSubstitute');

// buffer each user's email text in a queue, then flush them in single email
Meteor.startup(() => {
  Notifications.subscribe('email', async (user, title, description, params) => {
    try {
      if (
        !user ||
        typeof user.getLanguage !== 'function'
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
      const existing = await emailOutbox.hasPending(user._id);
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

      const html = bodyTemplate
        ? text
        : buildHtmlNotificationLine({
            existing,
            subject,
            actorName,
            descriptionText,
            url: params.url,
          });
      await emailOutbox.enqueue({ userId: user._id, eventId: params.activityId,
        subject, html, language: lan, cardId: params.cardId || null, boardId: params.boardId || null });
    } catch (error) {
      console.error('Error preparing email notification:', error);
    }
  });
});

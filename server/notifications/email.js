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

// Prepare a self-contained, rendered job without enqueuing it. Recovery planning
// can persist this result and later reuse the exact text and language.
export async function prepareActivityEmail(user, title, description, params) {
  if (
    !user ||
    typeof user.getLanguage !== 'function'
  ) {
    throw new Error('invalid-email-notification-user');
  }

  // Capture caller-owned values before the first asynchronous lookup. A saved
  // job must not mix later language/profile/template changes into its content.
  const userId = user._id;
  const lan = user.getLanguage();
  const memberOverride = user.profile && user.profile.notifyOverrideEmail;
  params = structuredClone(params);

  // 3-tier Notification Settings: admin default -> board override ->
  // member override (see models/lib/notificationSettings.js).
  const currentSetting = await ReactiveCache.getCurrentSetting();
  const setting = currentSetting && {
    notifyDefaultEmail: currentSetting.notifyDefaultEmail,
    activityEmailSubjectTemplate: currentSetting.activityEmailSubjectTemplate,
    activityEmailBodyTemplate: currentSetting.activityEmailBodyTemplate,
  };
  const board = params.boardId
    ? await ReactiveCache.getBoard(params.boardId)
    : null;
  const enabled = resolveNotificationSetting('email', {
    adminDefault: setting && setting.notifyDefaultEmail,
    boardOverride: board && board.notifyOverrideEmail,
    memberOverride,
  });
  if (!enabled) return null;

  // #5875: the server only loads the English bundle at startup, so make sure
  // the recipient's language is loaded before translating the subject/body —
  // otherwise notification emails silently fall back to English.
  await TAPi18n.ensureLanguageLoaded(lan);

  // add quote to make titles easier to read in email text
  const quoteParams = { ...params };
  ['card', 'list', 'oldList', 'board', 'comment'].forEach(key => {
    if (quoteParams[key]) quoteParams[key] = `"${params[key]}"`;
  });
  ['timeValue', 'timeOldValue'].forEach(key => {
    quoteParams[key] = quoteParams[key] ? `${params[key]}` : '';
  });

  let subject = safeEmailSubject(formatActivityNotificationTitle(
    title,
    params,
    TAPi18n.__.bind(TAPi18n),
    lan,
  ));
  const existing = await emailOutbox.hasPending(userId);
  const actorName = params.user || '';
  const descriptionText = TAPi18n.__(description, quoteParams, lan);

  // #2022: an admin-customized activity-notification template (Admin
  // Panel -> Email Templates) overrides the built subject/body line,
  // using the same {token} substitution the #3304 rule "send email"
  // action uses (substituteVars). Unset (the default on every existing
  // install) falls through to the exact content built above, unchanged.
  const templateSetting = setting;
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
  return { userId, eventId: params.activityId,
    subject, html, language: lan, cardId: params.cardId || null, boardId: params.boardId || null };
}

Meteor.startup(() => {
  Notifications.subscribe('email', async (user, title, description, params) => {
    const job = await prepareActivityEmail(user, title, description, params);
    if (job) await emailOutbox.enqueue(job);
  });
});

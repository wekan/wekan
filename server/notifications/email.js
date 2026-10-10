import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

import { emailOutbox, emailDelayMs } from '/server/notifications/emailQueue';
import { Notifications } from '/server/notifications/notifications';
import { formatActivityNotificationTitle } from '/server/lib/activityNotificationTitle';
import { resolveNotificationSetting } from '/models/lib/notificationSettings';
const {
  escapeEmailHtml,
  safeEmailSubject,
  buildHtmlNotificationLine,
} = require('/models/lib/emailNotificationSafety');
const { substituteVars } = require('/models/lib/ruleVarsSubstitute');
const {
  channelOf,
  groupKeyFor,
  nextDeliveryAt,
  redactForRecipient,
  renderNotificationItem,
  resolveChannelSettings,
} = require('/models/lib/notificationDelivery');

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
  const memberDelivery = channelOf(user.profile && user.profile.notificationDelivery, 'email');
  params = structuredClone(params);

  // 3-tier Notification Settings: admin default -> board override ->
  // member override (see models/lib/notificationSettings.js).
  const currentSetting = await ReactiveCache.getCurrentSetting();
  const setting = currentSetting && {
    notifyDefaultEmail: currentSetting.notifyDefaultEmail,
    activityEmailSubjectTemplate: currentSetting.activityEmailSubjectTemplate,
    activityEmailBodyTemplate: currentSetting.activityEmailBodyTemplate,
    notificationDelivery: currentSetting.notificationDelivery,
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

  // #5171: how this recipient's e-mail is delivered - Member Settings, then
  // the board, then the Admin Panel, then the built-in behaviour (the classic
  // sentence, combined per recipient after EMAIL_NOTIFICATION_TIMEOUT).
  const delivery = resolveChannelSettings('email', [
    ['member', memberDelivery],
    ['board', channelOf(board && board.notificationDelivery, 'email')],
    ['admin', channelOf(setting && setting.notificationDelivery, 'email')],
  ]);
  // A value of an admin-only custom field (#3141) reaches only board admins.
  const isBoardAdmin = !!(board && typeof board.hasAdmin === 'function' && board.hasAdmin(userId));
  params = redactForRecipient(params, { isBoardAdmin });

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
  // #5171: the clearly arranged item - board, actor and card in bold and
  // linked, only the chosen parts, with a plain-text alternative. An admin's
  // own body template still wins: it is the more specific instruction.
  const clear = !bodyTemplate && delivery.layout === 'clear'
    ? renderNotificationItem({ description, params, parts: delivery.parts,
      translate: (key, values) => TAPi18n.__(key, values, lan) })
    : null;
  const text = bodyTemplate
    ? `${existing ? `\n${subject}\n` : ''}${substituteVars(bodyTemplate, templateVars)}`
    : `${existing ? `\n${subject}\n` : ''}${
        actorName
      } ${descriptionText}\n${params.url}`;

  // MailTitleBleed, again (2026-10-02): the admin's body template is trusted
  // and may carry HTML, but the values substituted into it - card, board and
  // list titles, the username, a comment - are written by members. Sent as
  // the HTML body unescaped, markup in a card title reached other members'
  // mail. The HTML body substitutes escaped values; the text body is unchanged.
  const htmlVars = Object.fromEntries(Object.entries(templateVars).map(([key, value]) => [key, escapeEmailHtml(value)]));
  const html = clear ? clear.html : bodyTemplate
    ? `${existing ? `<br/>\n${escapeEmailHtml(subject)}<br/>\n` : ''}${substituteVars(bodyTemplate, htmlVars)}`
    : buildHtmlNotificationLine({
        existing,
        subject,
        actorName,
        descriptionText,
        url: params.url,
      });
  const job = { userId, eventId: params.activityId,
    subject, html, language: lan, cardId: params.cardId || null, boardId: params.boardId || null };
  // #5171: only what differs from the built-in delivery is added, so a job
  // under default settings is exactly the job WeKan always queued.
  if (clear) job.text = clear.text;
  const groupKey = delivery.from.grouping === 'default' ? null
    : groupKeyFor(delivery.grouping, { boardId: job.boardId, cardId: job.cardId, eventId: job.eventId });
  if (groupKey && delivery.grouping !== 'all') job.groupKey = groupKey;
  if (delivery.schedule !== 'immediate' || delivery.quietStart) {
    job.deliverAt = nextDeliveryAt(new Date(), delivery, { baseDelayMs: emailDelayMs }).getTime();
  }
  return job;
}

Meteor.startup(() => {
  Notifications.subscribe('email', async (user, title, description, params) => {
    const job = await prepareActivityEmail(user, title, description, params);
    if (job) await emailOutbox.enqueue(job);
  });
});

import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
const {
  channelOf,
  redactForRecipient,
  renderNotificationItem,
  resolveChannelSettings,
} = require('/models/lib/notificationDelivery');

// #5171: the tray (notification drawer) side of the shared notification
// delivery model (models/lib/notificationDelivery.js).
//   schedule - an entry stamped with `showAt` (server/notifications/
//              trayQueue.js) appears when that time comes;
//   grouping - entries of one card/board collapse into one drawer row;
//   content  - the clearly arranged layout shows only the chosen parts.
// Everything here reads data the drawer's publications already sent to this
// member, so it can show nothing the member could not see in WeKan.

const minute = new ReactiveVar(Date.now());
let ticking = false;
function startTicking() {
  if (ticking) return;
  ticking = true;
  Meteor.setInterval(() => minute.set(Date.now()), 60000);
}

// The current time, re-run every minute so a scheduled entry appears.
export function trayNow() {
  startTicking();
  return minute.get();
}

export function trayEntryVisible(entry, now = trayNow()) {
  return !entry || typeof entry.showAt !== 'number' || entry.showAt <= now;
}

// One board's tray settings for the current member.
export function trayDeliveryFor(boardId) {
  const user = ReactiveCache.getCurrentUser();
  const setting = ReactiveCache.getCurrentSetting();
  const board = boardId ? ReactiveCache.getBoard(boardId) : null;
  return resolveChannelSettings('tray', [
    ['member', channelOf(user && user.profile && user.profile.notificationDelivery, 'tray')],
    ['board', channelOf(board && board.notificationDelivery, 'tray')],
    ['admin', channelOf(setting && setting.notificationDelivery, 'tray')],
  ]);
}

function title(doc) {
  return doc && typeof doc.title === 'string' ? doc.title : '';
}

// The activity's values, as the e-mail builds them on the server.
function activityParams(activity) {
  const user = ReactiveCache.getCurrentUser();
  const board = activity.board && activity.board();
  const card = activity.card && activity.card();
  const actor = activity.user && activity.user();
  const member = activity.member && activity.member();
  const customField = activity.customField && activity.customField();
  const params = {
    user: actor ? (actor.profile && actor.profile.fullname) || actor.username || '' : '',
    board: title(board),
    oldBoard: title(activity.oldBoard && activity.oldBoard()),
    list: title(activity.list && activity.list()),
    oldList: title(activity.oldList && activity.oldList()),
    swimlane: title(activity.swimlane && activity.swimlane()),
    oldSwimlane: title(activity.oldSwimlane && activity.oldSwimlane()),
    card: title(card),
    cardId: activity.cardId,
    member: member ? (member.profile && member.profile.fullname) || member.username || '' : '',
    checklist: title(activity.checklist && activity.checklist()),
    checklistItem: title(activity.checklistItem && activity.checklistItem()),
    customField: customField ? customField.name || '' : '',
    comment: activity.commentId && activity.commentDisplayText ? activity.commentDisplayText() : '',
    customFieldValue: activity.value,
    customFieldAdminOnly: !!(customField && customField.adminOnly === true),
    timeValue: activity.timeValue,
    timeOldValue: activity.timeOldValue,
  };
  if (board && typeof board.absoluteUrl === 'function') params.boardUrl = board.absoluteUrl();
  if (card && typeof card.absoluteUrl === 'function') params.cardUrl = card.absoluteUrl(board);
  params.url = params.cardUrl || params.boardUrl;
  const isBoardAdmin = !!(board && user && typeof board.hasAdmin === 'function' && board.hasAdmin(user._id));
  return redactForRecipient(params, { isBoardAdmin });
}

// The escaped HTML of one entry in the clearly arranged layout, or '' for the
// classic activity line.
export function trayClearItemHtml(activity) {
  if (!activity || !activity.activityType) return '';
  const delivery = trayDeliveryFor(activity.boardId);
  if (delivery.layout !== 'clear') return '';
  const description = `act-${activity.activityType}`;
  // An activity with no sentence of its own keeps the classic line.
  if (TAPi18n.__(description) === description) return '';
  return renderNotificationItem({
    description,
    params: activityParams(activity),
    parts: delivery.parts,
    translate: (key, values) => TAPi18n.__(key, values),
  }).html;
}

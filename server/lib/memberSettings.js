import { Meteor } from 'meteor/meteor';
import securityLog from '/server/lib/securityLog';

const BOOLEAN_FIELDS = Object.freeze({
  showDesktopDragHandles: 'profile.showDesktopDragHandles',
  submitOnEnter: 'profile.submitOnEnter',
  openManyCardsAtOnce: 'profile.openManyCardsAtOnce',
  rescueCardDescription: 'profile.rescueCardDescription',
});

function report(user, context, detail) {
  securityLog.record({
    category: 'input', bleed: 'UserBleed', severity: 'high', action: 'blocked',
    source: 'memberSettings', userId: user?._id || context.userId,
    username: user?.username, req: context.req, detail,
  });
}

export async function memberSettingsForUser(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1, isWorker: 1, profile: 1 },
  });
  if (!user) {
    report(user, { ...context, userId }, 'refused member-settings read without an account');
    throw new Meteor.Error('not-authorized');
  }
  const profile = user.profile || {};
  return {
    isWorker: user.isWorker === true,
    showDesktopDragHandles: profile.showDesktopDragHandles === true,
    submitOnEnter: profile.submitOnEnter === true,
    openManyCardsAtOnce: profile.openManyCardsAtOnce === true,
    rescueCardDescription: profile.rescueCardDescription === true,
    showCardsCountAt: Number.isSafeInteger(profile.showCardsCountAt)
      ? profile.showCardsCountAt : -1,
    startDayOfWeek: Number.isSafeInteger(profile.startDayOfWeek)
      ? profile.startDayOfWeek : 1,
  };
}

export async function updateMemberSettings(userId, input, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { username: 1, isWorker: 1 },
  });
  if (!user) throw new Meteor.Error('not-authorized');
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Meteor.Error('invalid-setting-value');
  }
  const allowedKeys = new Set([
    ...Object.keys(BOOLEAN_FIELDS), 'showCardsCountAt', 'startDayOfWeek',
  ]);
  const unknown = Object.keys(input).filter(key => !allowedKeys.has(key));
  if (unknown.length) {
    report(user, context, `refused unknown member setting ${unknown[0].slice(0, 100)}`);
    throw new Meteor.Error('invalid-setting-value');
  }
  const $set = {};
  for (const [name, path] of Object.entries(BOOLEAN_FIELDS)) {
    if (!Object.prototype.hasOwnProperty.call(input, name)) continue;
    if (typeof input[name] !== 'boolean') throw new Meteor.Error('invalid-setting-value');
    if (user.isWorker && name === 'rescueCardDescription') {
      report(user, context, 'refused worker-only hidden card setting');
      throw new Meteor.Error('not-authorized');
    }
    $set[path] = input[name];
  }
  if (Object.prototype.hasOwnProperty.call(input, 'showCardsCountAt')) {
    if (user.isWorker || !Number.isSafeInteger(input.showCardsCountAt)
      || input.showCardsCountAt < -1 || input.showCardsCountAt > 100000) {
      report(user, context, 'refused invalid card-count threshold');
      throw new Meteor.Error('invalid-setting-value');
    }
    $set['profile.showCardsCountAt'] = input.showCardsCountAt;
  }
  if (Object.prototype.hasOwnProperty.call(input, 'startDayOfWeek')) {
    if (user.isWorker || !Number.isSafeInteger(input.startDayOfWeek)
      || input.startDayOfWeek < 0 || input.startDayOfWeek > 6) {
      report(user, context, 'refused invalid start day of week');
      throw new Meteor.Error('invalid-setting-value');
    }
    $set['profile.startDayOfWeek'] = input.startDayOfWeek;
  }
  if (!Object.keys($set).length) throw new Meteor.Error('invalid-setting-value');
  const updated = await Meteor.users.updateAsync({ _id: userId }, { $set });
  if (updated !== 1) throw new Meteor.Error('setting-save-failed');
  return memberSettingsForUser(userId, context);
}

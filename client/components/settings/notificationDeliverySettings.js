import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import Integrations from '/models/integrations';
const {
  GROUPINGS,
  INTERVAL_MINUTES,
  ITEM_PARTS,
  LAYOUTS,
  SCHEDULES,
  channelOf,
  normalizeChannelSettings,
  resolveChannelSettings,
} = require('/models/lib/notificationDelivery');
const { GROUP_KEYS: WEBHOOK_FIELD_GROUPS } = require('/models/lib/webhookPayload');

// #3695 / #5171: one channel's delivery settings at one level
// (notificationDeliverySettings.jade). Every change saves at once through the
// setNotificationDelivery method.

function safe(channel, value) {
  try {
    return normalizeChannelSettings(channel, value) || {};
  } catch (e) {
    return {};
  }
}

// Every level that applies to this section, most specific first, and which
// of them is this section's own.
function levelsFor({ scope, targetId, channel }) {
  const setting = ReactiveCache.getCurrentSetting();
  const admin = ['admin', channelOf(setting && setting.notificationDelivery, channel)];
  if (scope === 'admin') return [admin];
  if (scope === 'member') {
    const user = ReactiveCache.getCurrentUser();
    return [['member', channelOf(user && user.profile && user.profile.notificationDelivery, channel)], admin];
  }
  if (scope === 'board') {
    const board = targetId && ReactiveCache.getBoard(targetId);
    return [['board', channelOf(board && board.notificationDelivery, channel)], admin];
  }
  const integration = targetId && ReactiveCache.getIntegration({ _id: targetId });
  const levels = [['integration', channelOf(integration && integration.notificationDelivery, 'webhook')]];
  if (integration && integration.boardId !== Integrations.Const.GLOBAL_WEBHOOK_ID) {
    const board = ReactiveCache.getBoard(integration.boardId);
    levels.push(['board', channelOf(board && board.notificationDelivery, 'webhook')]);
  }
  levels.push(admin);
  return levels;
}

function state(data) {
  const levels = levelsFor(data);
  return {
    own: safe(data.channel, levels[0][1]),
    effective: resolveChannelSettings(data.channel, levels),
    inherited: resolveChannelSettings(data.channel, levels.slice(1)),
  };
}

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch (e) {
    return null;
  }
}

// Save `changes` to this level (null clears a key = inherit). The server
// merges them into the stored value, so quick successive changes never
// overwrite each other.
function save(instance, changes) {
  const data = instance.data;
  const { own } = state(data);
  const patch = { ...changes };
  // A schedule is read in the clock of whoever set it: keep the time zone of
  // the browser that saves a time unless this level already has one.
  const timed = ['schedule', 'dailyTime', 'quietStart', 'quietEnd', 'intervalMinutes'].some(key => changes[key]);
  if (timed && !own.timezone) patch.timezone = browserTimezone();
  Meteor.call('setNotificationDelivery', data.scope, data.targetId || null, data.channel, patch, error => {
    instance.message.set(error ? TAPi18n.__('notification-delivery-invalid') : '');
  });
}

function options(data, key, values, labelOf) {
  const { own, effective } = state(data);
  const rows = [];
  // At the admin level unset IS the built-in default, so no "Default" row.
  if (data.scope !== 'admin') {
    rows.push({ value: '', labelKey: 'default', label: TAPi18n.__('default'), selected: own[key] === undefined });
  }
  for (const value of values) {
    rows.push({
      value: String(value), labelKey: labelOf(value), label: labelOf(value),
      selected: data.scope === 'admin' ? effective[key] === value : own[key] === value,
    });
  }
  return rows;
}

Template.notificationDeliverySettings.onCreated(function () {
  this.message = new ReactiveVar('');
});

Template.notificationDeliverySettings.helpers({
  channelIcon() {
    const channel = Template.instance().data.channel;
    return channel === 'email' ? 'fa-envelope' : channel === 'tray' ? 'fa-bell' : 'fa-plug';
  },
  channelLabel() {
    const channel = Template.instance().data.channel;
    return channel === 'email' ? 'email' : channel === 'tray' ? 'notification-settings-tray' : 'outgoing-webhooks';
  },
  memberWebhook() {
    const data = Template.instance().data;
    return data.scope === 'member' && data.channel === 'webhook';
  },
  isWebhook() {
    return Template.instance().data.channel === 'webhook';
  },
  hideIdentity() {
    const user = ReactiveCache.getCurrentUser();
    return !!(user && user.profile && user.profile.webhookHideIdentity === true);
  },
  offerDefault() {
    return Template.instance().data.scope !== 'admin';
  },
  textOptions() {
    const data = Template.instance().data;
    return options(data, 'text', [true, false], value => (value ? 'yes' : 'no'));
  },
  layoutOptions() {
    return options(Template.instance().data, 'layout', LAYOUTS, value => `notification-delivery-layout-${value}`);
  },
  showParts() {
    return state(Template.instance().data).effective.layout === 'clear';
  },
  partsInherit() {
    return state(Template.instance().data).own.parts === undefined;
  },
  partRows() {
    const { effective } = state(Template.instance().data);
    return ITEM_PARTS.map(value => ({ value, labelKey: `notification-delivery-part-${value}`, enabled: effective.parts.includes(value) }));
  },
  fieldsInherit() {
    return state(Template.instance().data).own.fields === undefined;
  },
  fieldRows() {
    const { effective } = state(Template.instance().data);
    return WEBHOOK_FIELD_GROUPS.map(value => ({ value, labelKey: `webhook-payload-field-${value}`, enabled: effective.fields.includes(value) }));
  },
  groupingOptions() {
    const data = Template.instance().data;
    return options(data, 'grouping', GROUPINGS[data.channel], value => `notification-delivery-grouping-${value}`);
  },
  scheduleOptions() {
    return options(Template.instance().data, 'schedule', SCHEDULES, value => `notification-delivery-schedule-${value}`);
  },
  scheduleIs(value) {
    return state(Template.instance().data).effective.schedule === value;
  },
  intervalOptions() {
    const data = Template.instance().data;
    return options(data, 'intervalMinutes', INTERVAL_MINUTES, value => value).map(row => ({
      ...row,
      label: row.value === '' ? TAPi18n.__('default') : TAPi18n.__('notification-delivery-minutes', { count: row.value }),
    }));
  },
  dailyTime() {
    return state(Template.instance().data).effective.dailyTime;
  },
  quietStart() {
    return state(Template.instance().data).effective.quietStart || '';
  },
  quietEnd() {
    return state(Template.instance().data).effective.quietEnd || '';
  },
  hasQuiet() {
    return !!state(Template.instance().data).own.quietStart;
  },
  timezone() {
    const { effective } = state(Template.instance().data);
    return effective.schedule !== 'immediate' || effective.quietStart ? effective.timezone || 'UTC' : '';
  },
  message() {
    return Template.instance().message.get();
  },
});

function stop(event) {
  event.preventDefault();
  event.stopPropagation();
}

Template.notificationDeliverySettings.events({
  'click .js-webhook-hide-identity'(event, instance) {
    stop(event);
    const user = ReactiveCache.getCurrentUser();
    const hidden = !!(user && user.profile && user.profile.webhookHideIdentity === true);
    Meteor.call('setNotificationDelivery', 'member', null, 'webhook', { hideIdentity: !hidden }, error => {
      instance.message.set(error ? TAPi18n.__('notification-delivery-invalid') : '');
    });
  },
  'change .js-delivery-select'(event, instance) {
    event.stopPropagation();
    const key = event.currentTarget.dataset.key;
    const raw = event.currentTarget.value;
    let value = raw === '' ? null : raw;
    if (key === 'text' && value !== null) value = value === 'true';
    if (key === 'intervalMinutes' && value !== null) value = Number(value);
    save(instance, { [key]: value });
  },
  'change .js-delivery-time'(event, instance) {
    event.stopPropagation();
    const value = event.currentTarget.value;
    save(instance, { dailyTime: value || null });
  },
  'change .js-delivery-quiet'(event, instance) {
    event.stopPropagation();
    const container = instance.$(event.currentTarget).closest('.notification-delivery-quiet');
    const quietStart = container.find('[data-key="quietStart"]').val();
    const quietEnd = container.find('[data-key="quietEnd"]').val();
    // Quiet hours are saved once both ends are there.
    if (quietStart && quietEnd) save(instance, { quietStart, quietEnd });
  },
  'click .js-delivery-quiet-clear'(event, instance) {
    stop(event);
    save(instance, { quietStart: null, quietEnd: null });
  },
  'click .js-delivery-list-default'(event, instance) {
    stop(event);
    const key = event.currentTarget.dataset.key;
    const { own, effective } = state(instance.data);
    // Ticking "Default" clears this level's list; unticking it starts this
    // level's own list from what it inherited.
    save(instance, { [key]: own[key] === undefined ? effective[key] : null });
  },
  'click .js-delivery-list-item'(event, instance) {
    stop(event);
    const { key, value } = event.currentTarget.dataset;
    const current = state(instance.data).effective[key] || [];
    save(instance, { [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] });
  },
});

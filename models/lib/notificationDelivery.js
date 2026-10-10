'use strict';
// #3695 / #5171: ONE model for how every notification channel delivers -
// what a notification carries (content), whether several are combined into
// one message or entry (grouping), and when it is delivered (scheduling).
//
// Channels:
//   email    - the notification e-mails (server/notifications/email.js, the
//              durable outbox in server/lib/emailOutbox.js);
//   tray     - the in-app notification drawer (the bell);
//   webhook  - outgoing webhooks, board and global (server/notifications/
//              outgoing.js, server/notifications/webhookQueue.js).
//
// Levels, the most specific explicit value winning, key by key:
//   email, tray:  Member Settings -> board -> Admin Panel -> built-in
//   webhook:      the webhook itself -> board (its own webhooks only) ->
//                 Admin Panel -> built-in
// A member cannot change a board's webhook delivery; what a member owns about
// webhooks is their identity (profile.webhookHideIdentity,
// models/lib/webhookPayload.js).
//
// Built-in defaults reproduce the behaviour from before these settings, for
// every channel: the classic sentence, e-mails combined per recipient after
// EMAIL_NOTIFICATION_TIMEOUT, every tray entry on its own and at once, every
// webhook its own POST at once with text and the standard attributes.
//
// Pure (no Meteor/Mongo) - shared by the server, the client UI and node tests.

const { GROUP_KEYS: WEBHOOK_FIELD_GROUPS } = require('./webhookPayload');

const CHANNELS = Object.freeze(['email', 'tray', 'webhook']);
const MEMBER_CHANNELS = Object.freeze(['email', 'tray']);

// What an e-mail item or a tray entry shows, in the clearly arranged layout.
const ITEM_PARTS = Object.freeze(['board', 'actor', 'card', 'list', 'swimlane', 'details', 'dates', 'link']);
const LAYOUTS = Object.freeze(['classic', 'clear']);
const GROUPINGS = Object.freeze({
  email: Object.freeze(['all', 'board', 'card', 'none']),
  tray: Object.freeze(['none', 'card', 'board']),
  webhook: Object.freeze(['none', 'all', 'board', 'card']),
});
const SCHEDULES = Object.freeze(['immediate', 'interval', 'daily']);
const INTERVAL_MINUTES = Object.freeze([5, 10, 15, 30, 60, 120, 240, 480, 720, 1440]);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const SCHEDULE_KEYS = Object.freeze(['schedule', 'intervalMinutes', 'dailyTime', 'quietStart', 'quietEnd', 'timezone']);
const CHANNEL_KEYS = Object.freeze({
  email: Object.freeze(['layout', 'parts', 'grouping', ...SCHEDULE_KEYS]),
  tray: Object.freeze(['layout', 'parts', 'grouping', ...SCHEDULE_KEYS]),
  webhook: Object.freeze(['text', 'fields', 'grouping', ...SCHEDULE_KEYS]),
});

const BUILT_IN = Object.freeze({
  email: Object.freeze({ layout: 'classic', parts: Object.freeze([...ITEM_PARTS]), grouping: 'all',
    schedule: 'immediate', intervalMinutes: 60, dailyTime: '08:00', quietStart: null, quietEnd: null, timezone: null }),
  tray: Object.freeze({ layout: 'classic', parts: Object.freeze([...ITEM_PARTS]), grouping: 'none',
    schedule: 'immediate', intervalMinutes: 60, dailyTime: '08:00', quietStart: null, quietEnd: null, timezone: null }),
  webhook: Object.freeze({ text: true, fields: Object.freeze(['standard']), grouping: 'none',
    schedule: 'immediate', intervalMinutes: 60, dailyTime: '08:00', quietStart: null, quietEnd: null, timezone: null }),
});

class DeliverySettingsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DeliverySettingsError';
    this.error = 'invalid-notification-delivery';
  }
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

function validTimezone(value) {
  if (typeof value !== 'string' || !value || value.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(value)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch (e) {
    return false;
  }
}

function list(value, allowed, name) {
  if (!Array.isArray(value) || value.length > allowed.length * 2) throw new DeliverySettingsError(`${name} must be a list`);
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.includes(item)) {
      throw new DeliverySettingsError(`unknown ${name} value ${String(item).slice(0, 40)}`);
    }
  }
  return allowed.filter(item => value.includes(item));
}

// One channel's settings at one level. Returns only the explicitly set keys,
// or null when nothing is set (= inherit). Throws on anything unknown.
function normalizeChannelSettings(channel, input) {
  if (!CHANNELS.includes(channel)) throw new DeliverySettingsError('unknown channel');
  if (input === null || input === undefined) return null;
  if (!isPlainObject(input)) throw new DeliverySettingsError('settings must be an object');
  const allowed = CHANNEL_KEYS[channel];
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) throw new DeliverySettingsError(`unknown setting ${String(key).slice(0, 40)}`);
  }
  const out = {};
  for (const key of allowed) {
    const value = input[key];
    if (value === undefined || value === null) continue;
    switch (key) {
      case 'layout':
        if (!LAYOUTS.includes(value)) throw new DeliverySettingsError('layout must be classic or clear');
        out.layout = value; break;
      case 'parts':
        out.parts = list(value, ITEM_PARTS, 'parts'); break;
      case 'text':
        if (typeof value !== 'boolean') throw new DeliverySettingsError('text must be true, false or null');
        out.text = value; break;
      case 'fields':
        out.fields = list(value, WEBHOOK_FIELD_GROUPS, 'field group'); break;
      case 'grouping':
        if (!GROUPINGS[channel].includes(value)) throw new DeliverySettingsError('unknown grouping');
        out.grouping = value; break;
      case 'schedule':
        if (!SCHEDULES.includes(value)) throw new DeliverySettingsError('unknown schedule');
        out.schedule = value; break;
      case 'intervalMinutes':
        if (!INTERVAL_MINUTES.includes(value)) throw new DeliverySettingsError('unknown interval');
        out.intervalMinutes = value; break;
      case 'dailyTime': case 'quietStart': case 'quietEnd':
        if (typeof value !== 'string' || !TIME_PATTERN.test(value)) throw new DeliverySettingsError(`${key} must be HH:MM`);
        out[key] = value; break;
      case 'timezone':
        if (!validTimezone(value)) throw new DeliverySettingsError('unknown time zone');
        out.timezone = value; break;
      default:
        break;
    }
  }
  if ((out.quietStart === undefined) !== (out.quietEnd === undefined)) {
    throw new DeliverySettingsError('quiet hours need both a start and an end');
  }
  return Object.keys(out).length ? out : null;
}

// The whole stored object of one level: { email?, tray?, webhook? }.
function normalizeDeliverySettings(input, channels = CHANNELS) {
  if (input === null || input === undefined) return null;
  if (!isPlainObject(input)) throw new DeliverySettingsError('settings must be an object');
  const out = {};
  for (const key of Object.keys(input)) {
    if (!channels.includes(key)) throw new DeliverySettingsError(`unknown channel ${String(key).slice(0, 40)}`);
    const normalized = normalizeChannelSettings(key, input[key]);
    if (normalized) out[key] = normalized;
  }
  return Object.keys(out).length ? out : null;
}

function safeChannel(channel, value) {
  try {
    return normalizeChannelSettings(channel, value) || {};
  } catch (e) {
    return {};
  }
}

// resolveChannelSettings('email', [['member', m], ['board', b], ['admin', a]])
// Levels are given most specific first, each the stored CHANNEL object (or
// undefined). A corrupt level is ignored, never trusted. Returns every key
// with its value and, in `from`, the level that decided it.
function resolveChannelSettings(channel, levels = []) {
  const safe = levels.map(([name, value]) => [name, safeChannel(channel, value)]);
  const resolved = { from: {} };
  for (const key of CHANNEL_KEYS[channel]) {
    let found = false;
    for (const [name, settings] of safe) {
      if (settings[key] !== undefined) {
        resolved[key] = Array.isArray(settings[key]) ? [...settings[key]] : settings[key];
        resolved.from[key] = name;
        found = true;
        break;
      }
    }
    if (!found) {
      const value = BUILT_IN[channel][key];
      resolved[key] = Array.isArray(value) ? [...value] : value;
      resolved.from[key] = 'default';
    }
  }
  // Quiet hours are one setting: both ends come from the same level.
  const quietFrom = safe.find(([, s]) => s.quietStart !== undefined);
  if (quietFrom) {
    resolved.quietStart = quietFrom[1].quietStart;
    resolved.quietEnd = quietFrom[1].quietEnd;
  }
  return resolved;
}

// Read one channel's object from a stored level document field.
function channelOf(stored, channel) {
  return stored && typeof stored === 'object' ? stored[channel] : undefined;
}

// ---------------------------------------------------------------- schedule

// The wall-clock fields of an instant in a time zone.
function zonedParts(date, timezone) {
  const format = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC', hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  });
  const parts = {};
  for (const part of format.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return parts;
}

function offsetMs(date, timezone) {
  const p = zonedParts(date, timezone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - (date.getTime() - date.getMilliseconds());
}

// The instant at which the wall clock in `timezone` shows the given fields.
// Two passes settle a daylight-saving change; a non-existent wall time (the
// spring-forward hour) lands just after it.
function zonedTimeToInstant({ year, month, day, hour, minute }, timezone) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = guess - offsetMs(new Date(guess), timezone);
  instant = guess - offsetMs(new Date(instant), timezone);
  return new Date(instant);
}

function minutesOf(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function addLocalDays(parts, days) {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

// The next local midnight-based boundary (k * interval minutes after local
// midnight) strictly after `from`.
function nextIntervalBoundary(from, intervalMinutes, timezone) {
  const p = zonedParts(from, timezone);
  const minuteOfDay = p.hour * 60 + p.minute;
  const next = (Math.floor(minuteOfDay / intervalMinutes) + 1) * intervalMinutes;
  const day = addLocalDays(p, Math.floor(next / 1440));
  const rest = next % 1440;
  return zonedTimeToInstant({ ...day, hour: Math.floor(rest / 60), minute: rest % 60 }, timezone);
}

// The next time the local clock shows `time`, at or after `from`.
function nextDailyTime(from, time, timezone) {
  const p = zonedParts(from, timezone);
  const minutes = minutesOf(time);
  for (let days = 0; days < 3; days += 1) {
    const day = addLocalDays(p, days);
    const at = zonedTimeToInstant({ ...day, hour: Math.floor(minutes / 60), minute: minutes % 60 }, timezone);
    if (at.getTime() >= from.getTime()) return at;
  }
  return new Date(from.getTime() + 86400000);
}

function inQuietHours(date, quietStart, quietEnd, timezone) {
  if (!quietStart || !quietEnd || quietStart === quietEnd) return false;
  const p = zonedParts(date, timezone);
  const now = p.hour * 60 + p.minute, start = minutesOf(quietStart), end = minutesOf(quietEnd);
  return start < end ? now >= start && now < end : now >= start || now < end;
}

// When a notification created at `createdAt` is delivered, under one
// channel's resolved settings. Deterministic: the same inputs give the same
// time, so every notification in one window shares one delivery time (and so
// one message), a restart recomputes nothing, and a stored time is never lost
// when a setting changes later.
//   baseDelayMs  the channel's immediate delay (e-mail: EMAIL_NOTIFICATION_TIMEOUT)
function nextDeliveryAt(createdAt, resolved, { baseDelayMs = 0, timezone } = {}) {
  const tz = (resolved && resolved.timezone) || timezone || 'UTC';
  const start = new Date(createdAt);
  let at;
  if (resolved && resolved.schedule === 'interval') {
    at = nextIntervalBoundary(start, resolved.intervalMinutes || 60, tz);
  } else if (resolved && resolved.schedule === 'daily') {
    at = nextDailyTime(start, resolved.dailyTime || '08:00', tz);
  } else {
    at = new Date(start.getTime() + baseDelayMs);
  }
  if (resolved && inQuietHours(at, resolved.quietStart, resolved.quietEnd, tz)) {
    at = nextDailyTime(at, resolved.quietEnd, tz);
  }
  return at;
}

// --------------------------------------------------------------- grouping

// The key notifications of one message share. null = the channel's built-in
// combining (e-mail: everything due for the recipient; others: none).
function groupKeyFor(grouping, { boardId, cardId, eventId } = {}) {
  switch (grouping) {
    case 'all': return 'all';
    case 'board': return `board:${boardId || '-'}`;
    case 'card': return cardId ? `card:${cardId}` : `board:${boardId || '-'}`;
    case 'none': return `single:${eventId || ''}`;
    default: return null;
  }
}

// Tray entries collapsed for the drawer, in their order (newest first). Each
// entry has its own grouping (its board's or the member's choice), so
// groupingOf(entry) says it, and idsOf(entry) gives { boardId, cardId }.
// 'none' keeps an entry alone; 'card' and 'board' collect the entries with
// the same card / board into the group where the first of them stands.
function groupEntries(entries, groupingOf, idsOf) {
  const groups = [];
  const byKey = new Map();
  entries.forEach((entry, index) => {
    const grouping = groupingOf(entry);
    const ids = idsOf(entry) || {};
    let key = null;
    if (grouping === 'card' && ids.cardId) key = `card:${ids.cardId}`;
    else if (grouping === 'card' || grouping === 'board') key = `board:${ids.boardId || '-'}`;
    if (key === null) {
      groups.push({ key: `single:${index}`, grouping: 'none', entries: [entry] });
      return;
    }
    if (!byKey.has(key)) {
      const group = { key, grouping, entries: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).entries.push(entry);
  });
  return groups;
}

// #3695: whether a webhook notification is queued, and with which group and
// time. null = deliver at once (the built-in behaviour). Grouping with an
// immediate schedule waits the short grouping window, so notifications that
// arrive together go together.
const WEBHOOK_GROUP_WINDOW_MS = 30000;
function webhookQueueTarget(resolved, { boardId, cardId, eventId } = {}, createdAt = new Date()) {
  if (!resolved) return null;
  const grouped = resolved.grouping && resolved.grouping !== 'none';
  const scheduled = resolved.schedule && resolved.schedule !== 'immediate';
  if (!grouped && !scheduled && !resolved.quietStart) return null;
  const id = eventId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    eventId: id,
    groupKey: groupKeyFor(grouped ? resolved.grouping : 'none', { boardId, cardId, eventId: id }),
    deliverAt: nextDeliveryAt(createdAt, resolved, { baseDelayMs: grouped ? WEBHOOK_GROUP_WINDOW_MS : 0 }).getTime(),
  };
}

// ---------------------------------------------------------------- content

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// A link target is only ever an http(s) URL.
function safeUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (e) {
    return '';
  }
}

// The sentence placeholders and the part each belongs to.
const PLACEHOLDER_PART = Object.freeze({
  board: 'board', oldBoard: 'board',
  list: 'list', oldList: 'list',
  swimlane: 'swimlane', oldSwimlane: 'swimlane',
  card: 'card',
  comment: 'details', customFieldValue: 'details',
  timeValue: 'dates', timeOldValue: 'dates',
});
const PLACEHOLDERS = Object.freeze([
  'card', 'list', 'oldList', 'swimlane', 'oldSwimlane', 'board', 'oldBoard', 'comment', 'customField',
  'customFieldValue', 'member', 'assignee', 'label', 'checklist', 'checklistItem', 'checkList', 'attachment',
  'subtask', 'timeValue', 'timeOldValue', 'user',
]);
const MARK = index => `WKNMARK${index}WKNMARK`;
const MARK_PATTERN = /WKNMARK(\d+)WKNMARK/g;

// A clause can be dropped when the words joining it to the previous value are
// a short connector ("at board", "zur Liste", ": "), so the sentence stays a
// sentence in any language. Anything longer, or a placeholder that starts the
// sentence, keeps its value instead.
function droppableConnector(text) {
  if (/[[\](){}/\n]/.test(text)) return false;
  const words = text.replace(/:/g, ' ').trim().split(/\s+/).filter(Boolean);
  return words.length <= 3;
}

// Split a translated sentence into text pieces and value markers, and drop the
// clauses of parts that are switched off.
function sentencePieces(sentence, keyByIndex, parts) {
  const pieces = [];
  let last = 0, match;
  MARK_PATTERN.lastIndex = 0;
  while ((match = MARK_PATTERN.exec(sentence)) !== null) {
    pieces.push({ text: sentence.slice(last, match.index) });
    pieces.push({ key: keyByIndex[Number(match[1])] });
    last = match.index + match[0].length;
  }
  pieces.push({ text: sentence.slice(last) });
  const out = [];
  for (const piece of pieces) {
    if (piece.key !== undefined) {
      const part = PLACEHOLDER_PART[piece.key];
      // The board is the item's own header in the clear layout.
      const off = part && (part === 'board' || !parts.includes(part)) && part !== 'card';
      const previous = out[out.length - 1];
      const hasEarlierValue = out.some(p => p.key !== undefined);
      if (off && hasEarlierValue && previous && previous.text !== undefined && droppableConnector(previous.text)) {
        out.pop();
        continue;
      }
    }
    out.push(piece);
  }
  return out;
}

// Remove what this recipient may not see. A value of an admin-only custom
// field (#3141) is shown only to the board's admins.
function redactForRecipient(params, { isBoardAdmin = false } = {}) {
  const copy = { ...params };
  if (copy.customFieldAdminOnly === true && !isBoardAdmin) {
    for (const key of ['customFieldValue', 'value', 'oldValue']) {
      if (copy[key] !== undefined) copy[key] = '';
    }
  }
  delete copy.customFieldAdminOnly;
  return copy;
}

// One clearly arranged notification item (#5171), as HTML and plain text:
//   [Board](board link): Actor <sentence with bold values> [card link]
//   translate(key, params) returns the recipient-language sentence.
function renderNotificationItem({ description, params = {}, parts = ITEM_PARTS, translate }) {
  const keyByIndex = [];
  const markers = {};
  PLACEHOLDERS.forEach((key, index) => {
    keyByIndex[index] = key;
    markers[key] = MARK(index);
  });
  const sentence = String(translate(description, markers) ?? '');
  const pieces = sentencePieces(sentence, keyByIndex, parts);
  const cardUrl = safeUrl(params.cardUrl || (params.cardId ? params.url : ''));
  const boardUrl = safeUrl(params.boardUrl || (!params.cardId ? params.url : ''));
  const link = safeUrl(params.url);
  let html = '', text = '';
  for (const piece of pieces) {
    if (piece.key === undefined) {
      html += escapeHtml(piece.text);
      text += piece.text;
      continue;
    }
    const raw = params[piece.key];
    const value = raw === undefined || raw === null ? '' : String(raw);
    if (!value) continue;
    const quoted = `"${value}"`;
    text += quoted;
    if (piece.key === 'card' && parts.includes('card') && cardUrl) {
      html += `<b><a href="${escapeHtml(cardUrl)}">${escapeHtml(quoted)}</a></b>`;
    } else {
      html += `<b>${escapeHtml(quoted)}</b>`;
    }
  }
  html = html.replace(/\s+$/, '');
  text = text.replace(/\s+$/, '');
  const actor = parts.includes('actor') && params.user ? String(params.user) : '';
  const boardTitle = parts.includes('board') && params.board ? String(params.board) : '';
  let htmlItem = '', textItem = '';
  if (boardTitle) {
    htmlItem += boardUrl
      ? `<b><a href="${escapeHtml(boardUrl)}">${escapeHtml(boardTitle)}</a></b>: `
      : `<b>${escapeHtml(boardTitle)}</b>: `;
    textItem += `[${boardTitle}]: `;
  }
  if (actor) {
    htmlItem += `<b>${escapeHtml(actor)}</b> `;
    textItem += `${actor} `;
  }
  htmlItem += html;
  textItem += text;
  if (parts.includes('link') && link) {
    htmlItem += `<br/>\n<a href="${escapeHtml(link)}">${escapeHtml(link)}</a>`;
    textItem += `\n${link}`;
  }
  return { html: `<div class="wekan-notification-item">${htmlItem}</div>`, text: textItem };
}

// ----------------------------------------------------------------- schema

// SimpleSchema entries for a `notificationDelivery` field holding `channels`.
// Every value has its allowed values in the schema too, so a write that skips
// the method (an allow-rule update of a board document) cannot store junk.
function deliverySchemaFields(prefix, channels = CHANNELS) {
  const fields = { [prefix]: { type: Object, optional: true } };
  for (const channel of channels) {
    const base = `${prefix}.${channel}`;
    fields[base] = { type: Object, optional: true };
    for (const key of CHANNEL_KEYS[channel]) {
      const name = `${base}.${key}`;
      switch (key) {
        case 'layout': fields[name] = { type: String, optional: true, allowedValues: [...LAYOUTS] }; break;
        case 'parts':
          fields[name] = { type: Array, optional: true, maxCount: ITEM_PARTS.length };
          fields[`${name}.$`] = { type: String, allowedValues: [...ITEM_PARTS] }; break;
        case 'text': fields[name] = { type: Boolean, optional: true }; break;
        case 'fields':
          fields[name] = { type: Array, optional: true, maxCount: WEBHOOK_FIELD_GROUPS.length };
          fields[`${name}.$`] = { type: String, allowedValues: [...WEBHOOK_FIELD_GROUPS] }; break;
        case 'grouping': fields[name] = { type: String, optional: true, allowedValues: [...GROUPINGS[channel]] }; break;
        case 'schedule': fields[name] = { type: String, optional: true, allowedValues: [...SCHEDULES] }; break;
        case 'intervalMinutes': fields[name] = { type: Number, optional: true, allowedValues: [...INTERVAL_MINUTES] }; break;
        case 'timezone': fields[name] = { type: String, optional: true, max: 64 }; break;
        default: fields[name] = { type: String, optional: true, regEx: TIME_PATTERN }; break;
      }
    }
  }
  return fields;
}

module.exports = {
  CHANNELS,
  MEMBER_CHANNELS,
  ITEM_PARTS,
  LAYOUTS,
  GROUPINGS,
  SCHEDULES,
  INTERVAL_MINUTES,
  CHANNEL_KEYS,
  BUILT_IN,
  DeliverySettingsError,
  normalizeChannelSettings,
  normalizeDeliverySettings,
  resolveChannelSettings,
  channelOf,
  validTimezone,
  zonedParts,
  zonedTimeToInstant,
  nextDeliveryAt,
  inQuietHours,
  groupKeyFor,
  groupEntries,
  webhookQueueTarget,
  WEBHOOK_GROUP_WINDOW_MS,
  escapeHtml,
  safeUrl,
  redactForRecipient,
  renderNotificationItem,
  deliverySchemaFields,
};

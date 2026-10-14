'use strict';

// #2026 / #1377: browser push notifications. A member turns them on per
// device in Member Settings / Notification Settings; the browser gives a
// push subscription, and every notification they get in WeKan is also
// pushed there, so it arrives even with WeKan closed.
//
// A subscription's endpoint is an address the BROWSER chose, which the server
// then POSTs to - so it is accepted only over https and only at the push
// services browsers use. Anything else (an internal address, another
// site) is refused when it is saved, so a member cannot make the server
// send requests where they like. Pure: tests/webPush.test.cjs.

const PUSH_SERVICE_HOSTS = Object.freeze([
  'fcm.googleapis.com', // Chrome, Edge, Opera, Brave, Samsung
  'updates.push.services.mozilla.com', // Firefox
  'web.push.apple.com', // Safari
  'notify.windows.com', // legacy Edge (*.notify.windows.com)
  'push.services.mozilla.com',
]);

function isPushServiceEndpoint(endpoint) {
  let u;
  try { u = new URL(String(endpoint || '')); } catch (e) { return false; }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return false;
  const host = u.hostname.toLowerCase();
  return PUSH_SERVICE_HOSTS.some(h => host === h || host.endsWith(`.${h}`));
}

const B64URL = /^[A-Za-z0-9_-]{8,200}$/;

// A subscription as the browser's PushSubscription.toJSON() gives it, or null.
function cleanSubscription(input) {
  const s = input && typeof input === 'object' ? input : {};
  const keys = s.keys && typeof s.keys === 'object' ? s.keys : {};
  if (!isPushServiceEndpoint(s.endpoint) || String(s.endpoint).length > 1000) return null;
  if (!B64URL.test(String(keys.p256dh || '')) || !B64URL.test(String(keys.auth || ''))) return null;
  return { endpoint: String(s.endpoint), keys: { p256dh: String(keys.p256dh), auth: String(keys.auth) } };
}

const MAX_SUBSCRIPTIONS = 10;

// The member's subscriptions after adding one: once each, newest kept.
function subscriptionsAfterAdd(current, sub, now = new Date()) {
  const list = (Array.isArray(current) ? current : []).filter(s => s && s.endpoint !== sub.endpoint);
  return [...list, { ...sub, createdAt: now }].slice(-MAX_SUBSCRIPTIONS);
}

function pushPayload({ title, body, url }) {
  return JSON.stringify({
    title: String(title || 'WeKan').slice(0, 200),
    body: String(body || '').slice(0, 1000),
    url: /^\/[^/]|^\/$/.test(String(url || '')) ? String(url) : '/',
  });
}

module.exports = { PUSH_SERVICE_HOSTS, isPushServiceEndpoint, cleanSubscription, subscriptionsAfterAdd, pushPayload, MAX_SUBSCRIPTIONS };

'use strict';

// #5148: ntfy (https://ntfy.sh, or a self-hosted ntfy) as a notification
// channel, per member. A member saves their topic's address - e.g.
// https://ntfy.sh/my-secret-topic - and, for a protected topic, an access
// token, in Member Settings / Notifications; every notification they would
// get then also arrives on their phone through the ntfy app.
//
// Sent with ntfy's JSON publishing (POST to the server's root with
// { topic, title, message, click }), so a title in any language needs no
// header encoding. Sent by server/notifications/ntfy.js through the same SSRF
// guard as webhooks: a self-hosted ntfy on the internal network is reached
// only when a site admin lists it under Internal destinations.
// Pure: tests/ntfy.test.cjs.

const TOPIC = /^[A-Za-z0-9_-]{1,64}$/;

// { base, topic } of a topic address, or null.
function parseTopicUrl(value) {
  let u;
  try { u = new URL(String(value || '').trim()); } catch (e) { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password || u.search || u.hash) return null;
  const parts = u.pathname.split('/').filter(Boolean);
  const topic = parts.pop();
  if (!topic || !TOPIC.test(topic)) return null;
  return { base: `${u.origin}/${parts.length ? `${parts.join('/')}/` : ''}`, topic };
}

function cleanNtfySettings(input) {
  const i = input && typeof input === 'object' ? input : {};
  const url = typeof i.url === 'string' ? i.url.trim().slice(0, 500) : '';
  if (url && !parseTopicUrl(url)) return { error: 'ntfy-invalid-topic-url' };
  const token = typeof i.token === 'string' ? i.token.trim().slice(0, 200) : '';
  if (token && !/^[\x21-\x7e]+$/.test(token)) return { error: 'ntfy-invalid-token' };
  return { value: { enabled: i.enabled === true && !!url, url, token } };
}

function ntfyRequest(settings, { title, message, click } = {}) {
  if (!settings || settings.enabled !== true) return null;
  const target = parseTopicUrl(settings.url);
  if (!target) return null;
  const body = { topic: target.topic, message: String(message || '').slice(0, 4000) || ' ' };
  if (title) body.title = String(title).replace(/[\r\n]+/g, ' ').slice(0, 250);
  if (click && /^https?:\/\//.test(String(click))) body.click = String(click);
  const headers = { 'Content-Type': 'application/json' };
  if (settings.token) headers.Authorization = `Bearer ${settings.token}`;
  return { url: target.base, headers, body: JSON.stringify(body) };
}

module.exports = { parseTopicUrl, cleanNtfySettings, ntfyRequest };

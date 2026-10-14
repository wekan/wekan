'use strict';

// #2290: Admin Panel / Settings / Global Webhooks / Login and registration
// webhook - one instance-wide address told when somebody logs in or a new
// account is made. Off by default, and by default it carries only what
// happened, the user name and the time; the email, the address the login came
// from, the full name and the sign-in method are each sent only when ticked.
//
// Pure: tests/accountWebhook.test.cjs. Sent by server/accountWebhook.js,
// through the same SSRF guard as every outgoing webhook.

const EXTRA_FIELDS = ['email', 'ip', 'fullname', 'authMethod'];

function cleanAccountWebhook(input) {
  const i = input && typeof input === 'object' ? input : {};
  const url = typeof i.url === 'string' ? i.url.trim().slice(0, 2000) : '';
  let error;
  if (url) {
    let parsed;
    try { parsed = new URL(url); } catch (e) { error = 'invalid-url'; }
    if (parsed && !['http:', 'https:'].includes(parsed.protocol)) error = 'invalid-url';
  }
  return {
    value: {
      url: error ? '' : url,
      token: typeof i.token === 'string' ? i.token.trim().slice(0, 500) : '',
      onLogin: i.onLogin === true,
      onRegister: i.onRegister === true,
      fields: Array.isArray(i.fields) ? EXTRA_FIELDS.filter(f => i.fields.includes(f)) : [],
    },
    error,
  };
}

// Whether `event` ('login' | 'register') is sent at all.
function sends(config, event) {
  if (!config || !config.url) return false;
  return event === 'login' ? config.onLogin === true : event === 'register' ? config.onRegister === true : false;
}

function accountWebhookPayload(event, user, { config, ip, now } = {}) {
  const u = user || {};
  const profile = u.profile || {};
  const fields = (config && Array.isArray(config.fields)) ? config.fields : [];
  const body = {
    event,
    username: u.username || '',
    at: new Date(now || Date.now()).toISOString(),
  };
  if (fields.includes('email')) {
    const email = Array.isArray(u.emails) && u.emails[0] && u.emails[0].address;
    if (email) body.email = email;
  }
  if (fields.includes('ip') && ip) body.ip = String(ip);
  if (fields.includes('fullname') && profile.fullname) body.fullname = profile.fullname;
  if (fields.includes('authMethod') && u.authenticationMethod) body.authMethod = u.authenticationMethod;
  return body;
}

module.exports = { EXTRA_FIELDS, cleanAccountWebhook, sends, accountWebhookPayload };

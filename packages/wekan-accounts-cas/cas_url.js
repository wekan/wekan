// Keep URL handling independent of Meteor so callback encoding can be tested.
const { URL, URLSearchParams } = require('url');

function validationUrl(value) {
  let parsed;
  try { parsed = new URL(value); } catch (_error) {
    throw new Error('Option `validateUrl` must be a valid https URL.');
  }
  if (parsed.protocol !== 'https:') throw new Error('Only https CAS servers are supported.');
  return parsed;
}

function callbackUrl(requestUrl, rootUrl) {
  const root = new URL(rootUrl);
  const parsed = new URL(requestUrl, root);
  const tickets = parsed.searchParams.getAll('ticket');
  if (!tickets.length) return null;
  if (parsed.origin !== root.origin || tickets.length !== 1 ||
      parsed.searchParams.getAll('casToken').length > 1) {
    throw new Error('Invalid CAS callback URL.');
  }
  const ticket = tickets[0];
  const credentialToken = parsed.searchParams.get('casToken');
  // CAS validates the exact service URL. Deleting through searchParams would
  // re-encode unrelated values (for example %20 becomes + and ~ becomes %7E).
  const query = parsed.search.slice(1).split('&')
    .filter(part => !new URLSearchParams(part).has('ticket')).join('&');
  parsed.search = query ? `?${query}` : '';
  parsed.hash = '';
  return { ticket, credentialToken, serviceUrl: parsed.href };
}

// The credential token the browser that STARTED this CAS login set for itself
// (cas_client.js), read from a Cookie header. Without it anybody could choose
// a casToken, put it in a CAS login link, and - once a signed-in victim opened
// it - log in with that token as the victim.
function casStateCookie(cookieHeader) {
  if (typeof cookieHeader !== 'string') return null;
  for (const part of cookieHeader.split(';')) {
    const at = part.indexOf('=');
    if (at > 0 && part.slice(0, at).trim() === 'wekan_cas_state') {
      const value = part.slice(at + 1).trim();
      return value || null;
    }
  }
  return null;
}

module.exports = { validationUrl, callbackUrl, casStateCookie };

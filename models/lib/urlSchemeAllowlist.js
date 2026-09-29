'use strict';

// wekan/wekan#3218: custom URL schemes in card text (thunderlink:, onenote:,
// file:, a company's own folder scheme ...) become clickable links only when an
// administrator lists them in Admin Panel → Features → URL →
// "automaticLinkedUrlSchemes". Off by default: an empty setting links nothing
// beyond the web and mail schemes the viewer always allowed.
//
// Each scheme launches a local application, so this is the security decision
// the issue asked for, and it stays one: whatever the setting says, a scheme
// that runs code in the page or hides content inside the URL is never linked.
//
// packages/markdown receives the parsed list (it cannot import app code) and
// builds the same URI rule with its own copy of allowedUriRegExp(); the test
// tests/urlSchemeAllowlist.test.cjs keeps the two in agreement.

// Always links; listing them changes nothing.
const BUILT_IN = ['http', 'https', 'ftp', 'ftps', 'mailto', 'tel', 'callto', 'cid', 'xmpp'];
// Never links, even when listed.
const NEVER_LINKED = new Set([
  'javascript', 'vbscript', 'livescript', 'data', 'blob', 'about', 'filesystem',
  'view-source', 'jar', 'wyciwyg', 'ms-its', 'mhtml', 'res',
]);
const SCHEME_RE = /^[a-z][a-z0-9+.-]{0,31}$/;
const MAX_SCHEMES = 50;

// "thunderlink\nonenote:\nfile://" -> ['file', 'onenote', 'thunderlink'].
// Separators are whitespace or commas; a trailing ":" or "://" is accepted,
// since that is how people write a scheme. Invalid, built-in and never-linked
// names are dropped.
function parseAllowedUrlSchemes(text) {
  if (typeof text !== 'string') return [];
  const schemes = new Set();
  for (const raw of text.split(/[\s,;]+/)) {
    const name = raw.trim().toLowerCase().replace(/:(?:\/\/)?$/, '');
    if (!SCHEME_RE.test(name) || BUILT_IN.includes(name) || NEVER_LINKED.has(name)) continue;
    schemes.add(name);
    if (schemes.size >= MAX_SCHEMES) break;
  }
  return [...schemes].sort();
}

const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

// DOMPurify's ALLOWED_URI_REGEXP: the viewer's original rule, with the listed
// schemes added to the ones it already allows. Schemes come from
// parseAllowedUrlSchemes(), so they are plain names; they are escaped anyway.
function allowedUriRegExp(schemes = []) {
  const extra = schemes.filter(name => SCHEME_RE.test(name) && !NEVER_LINKED.has(name)).map(escapeRegExp);
  const names = ['(?:f|ht)tps?', 'mailto', 'tel', 'callto', 'cid', 'xmpp', ...extra].join('|');
  return new RegExp(`^(?:(?:${names}):|[^a-z]|[a-z+.\\-]+(?:[^a-z+.\\-:]|$))`, 'i');
}

// The scheme of an href, lower-cased, or '' for a relative or scheme-less one.
function hrefScheme(href) {
  const match = /^\s*([a-z][a-z0-9+.-]*):/i.exec(String(href || ''));
  return match ? match[1].toLowerCase() : '';
}

module.exports = { BUILT_IN, NEVER_LINKED, MAX_SCHEMES, parseAllowedUrlSchemes, allowedUriRegExp, hrefScheme };

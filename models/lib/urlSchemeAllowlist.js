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
// Never links, even when listed: schemes that run code in the page or hide
// content inside the URL...
const IN_PAGE = [
  'javascript', 'vbscript', 'livescript', 'data', 'blob', 'about', 'filesystem',
  'view-source', 'jar', 'wyciwyg', 'ms-its', 'mhtml', 'res',
];
// ...and schemes whose operating-system handler has a public code-execution
// history, so a link to one runs something on the machine of whoever clicks
// it. An administrator listing one - it can look like Microsoft's own - must
// not be enough: any board member could then plant such a link on a card.
//   ms-msdt         Follina, CVE-2022-30190
//   search-ms, search  Windows Search, used to show remote executables as local
//   ms-officecmd    Office launch arguments, CVE-2022-26813 class
//   ms-appinstaller installs a package from a URL (abused 2021-2023, then disabled)
//   ms-cxh, ms-cxh-full  Windows account and OOBE flows
//   telnet          the last link of the 2026 Edge full chain: Windows looks for
//                   telnet.exe on PATH, which includes a user-writable directory
const OS_HANDLERS = [
  'ms-msdt', 'search-ms', 'search', 'ms-officecmd', 'ms-appinstaller', 'ms-cxh', 'ms-cxh-full', 'telnet',
];
const NEVER_LINKED = new Set([...IN_PAGE, ...OS_HANDLERS]);
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

// The OS-handler schemes above that text puts in a LINK position - a markdown
// link or reference, an autolink, an href/src - sorted. Never linked whatever
// the setting says, so a link like that is never useful and is an attempt;
// the word in prose ("ms-msdt: Follina") is not, and is not counted. Used on
// the server to show the attempt in Admin Panel -> Problems
// (server/lib/handlerLinkCanary.js). Long text is only searched as far as
// MAX_SCAN, so a huge description cannot make a save slow.
const MAX_SCAN = 200000;
const HANDLER_NAMES = OS_HANDLERS.map(escapeRegExp).sort((a, b) => b.length - a.length).join('|');
const HANDLER_LINK = new RegExp(
  `(?:\\]\\(\\s*<?|^[ \\t]{0,3}\\[[^\\]\\n]{1,200}\\]:[ \\t]*<?|<|\\b(?:href|src|action|formaction|xlink:href)\\s*=\\s*["']?)\\s*(${HANDLER_NAMES}):`,
  'gim');
function handlerLinkSchemes(text) {
  if (typeof text !== 'string' || !text) return [];
  const found = new Set();
  for (const match of text.slice(0, MAX_SCAN).matchAll(HANDLER_LINK)) found.add(match[1].toLowerCase());
  return [...found].sort();
}

module.exports = {
  BUILT_IN, NEVER_LINKED, OS_HANDLERS, MAX_SCHEMES, parseAllowedUrlSchemes, allowedUriRegExp, hrefScheme,
  handlerLinkSchemes,
};

'use strict';

// #6752: the snap's default ROOT_URL is the loopback address 127.0.0.1, and
// every link WeKan builds in the browser - Copy link of a card, list or
// swimlane, a comment permalink - goes through Meteor.absoluteUrl(), which
// reads ROOT_URL. So a browser that opened WeKan by the machine's name copied
// a link to 127.0.0.1, which no other machine can follow.
//
// A loopback ROOT_URL seen from a browser on a NON-loopback address can only
// mean ROOT_URL was left at that default: the browser demonstrably reached the
// server some other way. Then the browser's own origin is the address that
// works, and the client's absoluteUrl uses it, keeping ROOT_URL's path (a
// sub-URL install). Anything else is left alone:
//   - a real ROOT_URL is the administrator's canonical address and wins, even
//     when this browser came in through another name or an IP;
//   - a browser on loopback itself is the case ROOT_URL already describes.
// The server keeps ROOT_URL as it is - emails have no browser to ask - so
// `snap set wekan root-url=...` is still what fixes the links in emails.

function isLoopbackHost(hostname) {
  const host = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  return host === 'localhost' || host.endsWith('.localhost') || host === '::1'
    || host === '0.0.0.0' || /^127(?:\.\d{1,3}){3}$/.test(host);
}

// The root URL the browser should build absolute links from, or null to keep
// Meteor's default (ROOT_URL).
function browserRootUrl(rootUrl, browserLocation) {
  let root;
  let page;
  try {
    root = new URL(rootUrl);
    page = new URL(browserLocation);
  } catch (e) {
    return null;
  }
  if (!/^https?:$/.test(page.protocol)) return null;
  if (!isLoopbackHost(root.hostname) || isLoopbackHost(page.hostname)) return null;
  const rootPath = root.pathname.replace(/\/+$/, '');
  return `${page.origin}${rootPath}`;
}

module.exports = { isLoopbackHost, browserRootUrl };

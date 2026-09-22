'use strict';

// Markdown card links use the same tab so FlowRouter can open the card popup.
function internalCardPath(href, currentUrl) {
  try {
    const link = new URL(href, currentUrl);
    const current = new URL(currentUrl);
    if (link.origin !== current.origin) return null;
    if (!/\/b\/[^/]+\/[^/]+\/[^/]+\/?$/.test(link.pathname)) return null;
    return `${link.pathname}${link.search}${link.hash}`;
  } catch (_error) {
    return null;
  }
}

module.exports = { internalCardPath };

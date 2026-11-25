'use strict';

// A translation dictionary served to the browser by its content hash: the
// browser's module for a language is { __wekanI18nAsset: '<hash>' }
// (npm-packages/meteor-i18n-server-loader), and the file is
// build-assets/i18n/<hash>.json among the server's assets.

const HASH = /^[0-9a-f]{20}$/;

// The server asset a request names, or null: only "<20 hex digits>.json".
function i18nAssetPath(file) {
  const m = /^([0-9a-f]{20})\.json$/.exec(String(file || ''));
  return m ? `build-assets/i18n/${m[1]}.json` : null;
}

// The hash a loaded module stands for, or null when it is the dictionary itself.
function i18nAssetHash(data) {
  const hash = data && typeof data === 'object' ? data.__wekanI18nAsset : undefined;
  return typeof hash === 'string' && HASH.test(hash) ? hash : null;
}

// Where the browser fetches it: the page's own origin and ROOT_URL's path
// prefix, as Meteor's dynamic imports do (models/lib/dynamicImportOrigin.js) -
// the one address the browser has shown it can reach.
function i18nAssetUrl(hash, pathPrefix) {
  if (!HASH.test(String(hash))) throw new Error('not a translation hash');
  const prefix = String(pathPrefix || '').replace(/\/+$/, '');
  return `${prefix}/i18n/${hash}.json`;
}

module.exports = { i18nAssetPath, i18nAssetHash, i18nAssetUrl };

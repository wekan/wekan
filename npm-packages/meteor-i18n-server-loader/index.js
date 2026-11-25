'use strict';
const { createHash } = require('node:crypto');
const path = require('node:path');

// A dictionary's asset is named by its content alone: build-assets/i18n/<hash>.json.
//
// Each was <tag>.<hash>.json, and the build keeps one file per CONTENT: where
// two dictionaries are byte for byte the same (en-IT, en-MY and en-YS are
// en-BR; en_SG, en_TR and en_ZA are en_AU), only one of the names reached the
// bundle, and the server code reading the others failed with ENOENT. Named by
// content, identical dictionaries are one file that every one of them reads.
const SAFE_ASSET = /^build-assets\/i18n\/[0-9a-f]{20}\.json$/;
// Dictionary names are a locale tag: letters, digits, - _ . and @ (ca@valencia).
const SAFE_NAME = /^[A-Za-z0-9_.@-]+\.i18n$/;

// A JavaScript string literal that stays one literal wherever the code ends up:
// JSON.stringify, with the characters that can end a <script> or a line in
// older engines escaped too.
function jsStringLiteral(value) {
  return JSON.stringify(String(value)).replace(/[<>\/\u2028\u2029]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function dictionaryHash(source) {
  return createHash('sha256').update(source).digest('hex').slice(0, 20);
}

// One copy of each dictionary, on the server. Rspack emits server assets under
// private/; the server reads its file the first time a language is asked for.
//
// The browser gets no copy of its own: with `{ target: 'client' }` the module
// is only the dictionary's hash, and imports/i18n/tap.js fetches that file from
// the server (server/i18nAssets.js serves /i18n/<hash>.json). Every dictionary
// used to be in the bundle twice - once as a server asset and once as a
// client chunk, 140 MiB each.
const serverTranslationLoader = function serverTranslationLoader(source) {
  JSON.parse(source); // Fail the build for malformed dictionaries.
  const name = path.basename(this.resourcePath || '', '.json');
  if (!SAFE_NAME.test(name)) throw new Error(`refusing translation file name ${JSON.stringify(path.basename(this.resourcePath || ''))}`);
  const hash = dictionaryHash(source);
  const options = (typeof this.getOptions === 'function' && this.getOptions()) || {};
  if (options.target === 'client') {
    return `module.exports = { __wekanI18nAsset: ${jsStringLiteral(hash)} };\n`;
  }
  const asset = `build-assets/i18n/${hash}.json`;
  if (!SAFE_ASSET.test(asset)) throw new Error(`refusing translation asset ${JSON.stringify(asset)}`);
  this.emitFile(asset, source);
  return `module.exports = JSON.parse(require('node:fs').readFileSync(Assets.absoluteFilePath(${jsStringLiteral(asset)}), 'utf8'));\n`;
};

module.exports = serverTranslationLoader;
module.exports.jsStringLiteral = jsStringLiteral;
module.exports.dictionaryHash = dictionaryHash;

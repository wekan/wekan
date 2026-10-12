'use strict';
const { createHash } = require('node:crypto');
const path = require('node:path');

// Dictionary names are a locale tag: letters, digits, - _ . and @ (ca@valencia).
const SAFE_ASSET = /^build-assets\/i18n\/[A-Za-z0-9_.@-]+\.[0-9a-f]{20}\.json$/;

// A JavaScript string literal that stays one literal wherever the code ends up:
// JSON.stringify, with the characters that can end a <script> or a line in
// older engines escaped too.
function jsStringLiteral(value) {
  return JSON.stringify(String(value)).replace(/[<>\/\u2028\u2029]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

// Rspack emits server assets under private/. Keep translation bytes outside the
// eager server script while retaining its normal module cache and import shape.
const serverTranslationLoader = function serverTranslationLoader(source) {
  JSON.parse(source); // Fail the build for malformed dictionaries.
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 20);
  const asset = `build-assets/i18n/${path.basename(this.resourcePath, '.json')}.${hash}.json`;
  // The asset name becomes part of generated code: it may hold only the
  // characters a dictionary file name has, and its literal is escaped anyway.
  if (!SAFE_ASSET.test(asset)) throw new Error(`refusing translation file name ${JSON.stringify(path.basename(this.resourcePath))}`);
  this.emitFile(asset, source);
  return `module.exports = JSON.parse(require('node:fs').readFileSync(Assets.absoluteFilePath(${jsStringLiteral(asset)}), 'utf8'));\n`;
};

module.exports = serverTranslationLoader;
module.exports.jsStringLiteral = jsStringLiteral;

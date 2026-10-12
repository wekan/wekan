'use strict';
const { createHash } = require('node:crypto');
const path = require('node:path');

// Rspack emits server assets under private/. Keep translation bytes outside the
// eager server script while retaining its normal module cache and import shape.
module.exports = function serverTranslationLoader(source) {
  JSON.parse(source); // Fail the build for malformed dictionaries.
  const hash = createHash('sha256').update(source).digest('hex').slice(0, 20);
  const asset = `build-assets/i18n/${path.basename(this.resourcePath, '.json')}.${hash}.json`;
  this.emitFile(asset, source);
  return `module.exports = JSON.parse(require('node:fs').readFileSync(Assets.absoluteFilePath(${JSON.stringify(asset)}), 'utf8'));\n`;
};

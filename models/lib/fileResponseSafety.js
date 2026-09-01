'use strict';

const DANGEROUS_MIME_TYPES = new Set([
  'text/html',
  'application/xhtml+xml',
  'image/svg+xml',
  'text/xml',
  'application/xml',
  'application/javascript',
  'text/javascript',
]);

const DANGEROUS_FILE_EXTENSIONS = new Set([
  'html',
  'htm',
  'xhtml',
  'svg',
  'xml',
  'js',
  'mjs',
  'cjs',
]);

function fileNameIsBrowserExecutable(name) {
  const cleanName = String(name || '').split(/[?#]/, 1)[0].toLowerCase();
  const dot = cleanName.lastIndexOf('.');
  return dot !== -1 && DANGEROUS_FILE_EXTENSIONS.has(cleanName.slice(dot + 1));
}

function fileResponsePolicy(type, dangerousByName = false) {
  const normalizedType = String(type || 'application/octet-stream')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  const dangerous = dangerousByName || DANGEROUS_MIME_TYPES.has(normalizedType);

  return {
    contentType: dangerous ? 'application/octet-stream' : normalizedType,
    forceDownload: dangerous,
    headers: dangerous ? {
      'Content-Security-Policy': "default-src 'none'; sandbox;",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    } : {
      'X-Content-Type-Options': 'nosniff',
    },
  };
}

module.exports = {
  DANGEROUS_MIME_TYPES,
  DANGEROUS_FILE_EXTENSIONS,
  fileNameIsBrowserExecutable,
  fileResponsePolicy,
};

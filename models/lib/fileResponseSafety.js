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

module.exports = { DANGEROUS_MIME_TYPES, fileResponsePolicy };

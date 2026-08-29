'use strict';

function escapeEmailHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeEmailSubject(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

module.exports = { escapeEmailHtml, safeEmailSubject };
